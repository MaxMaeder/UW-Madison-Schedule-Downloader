import fileDownload from "js-file-download";
import { DateTime } from "luxon";
import type { PlasmoCSConfig } from "plasmo";
import { generateIcsCalendar, type VCalendar, type VEvent } from "ts-ics";
import { uid } from "uid";
import browser from "webextension-polyfill";

import { DOWNLOAD_SHED_MSG } from "~assets/constants";
import { parseExamDetails, parseMeetingDetails } from "~util/parseDetails";

export const config: PlasmoCSConfig = {
  matches: ["*://mumaaenroll.services.wisc.edu/courses-schedule*"]
};

interface Break {
  name: string;
  date: Date;
  length: number;
}

interface DownloadScheduleMessage {
  type: string;
  payload: Break[];
}

browser.runtime.onMessage.addListener((message: DownloadScheduleMessage) => {
  if (message.type !== DOWNLOAD_SHED_MSG) return true;

  const calEvents: VEvent[] = [];

  let breaks: Break[] = message.payload;
  let initDate: DateTime;
  let endDate: DateTime;
  let finalDate: Date;
  let exceptionDates: Date[] = [];

  if (breaks.length > 0) {
    initDate = DateTime.fromJSDate(new Date(breaks[0].date));
    endDate = DateTime.fromJSDate(new Date(breaks[breaks.length - 1].date));
    breaks = breaks.slice(1, -1);

    for (let i = 0; i < breaks.length; i++) {
      let date = new Date(breaks[i].date);
      let count = breaks[i].length;
      for (let j = 0; j < count; j++) {
        exceptionDates.push(new Date(date));
        date.setDate(date.getDate() + 1);
      }
    }
  } else {
    initDate = DateTime.now();
    endDate = initDate.plus({ years: 1 });
  }

  // Hacky solution to get around the bug in ts-ics.
  // Check comment below for more details.
  finalDate = endDate.toJSDate();
  Object.defineProperty(finalDate, "toString", {
    value: function () {
      let isoDate = this.toISOString();
      let year = isoDate.slice(0, 4);
      let month = isoDate.slice(5, 7);
      let day = isoDate.slice(8, 10);
      return `${year}${month}${day}`;
    }
  });

  const courses = document.querySelectorAll("#course-meetings");
  for (let i = 0; i < courses.length; i++) {
    const fullCourse = courses[i].querySelector("h3")?.textContent || "";
    const [courseTitle, courseName] = fullCourse.split(": ");
    const lists = Array.from(courses[i].querySelectorAll(":scope > ul"));

    const [meetingList, examList] = lists;

    const exams = examList.querySelectorAll("li");
    let examString = "";

    for (let j = 0; j < exams.length; j++) {
      const examStr = exams[j].querySelector("span")?.textContent || "";
      const examDetails = parseExamDetails(examStr);

      examString += `Exam: ${examStr}\t`;

      calEvents.push({
        uid: uid(),
        stamp: { date: new Date() },
        summary: `${courseTitle} FINAL EXAM`,
        location: examDetails.location,
        start: { date: examDetails.start.toJSDate() },
        end: { date: examDetails.end.toJSDate() }
      });
    }

    examString = examString.trim();

    let description = `${fullCourse}\t${examString}`;

    const meetings = meetingList.children;

    for (let j = 0; j < meetings.length; j++) {
      const type = meetings[j].querySelector("strong")?.textContent || "";
      const details = meetings[j].querySelector("span");

      const parsedDetails = parseMeetingDetails(
        details?.textContent || "",
        initDate
      );

      description = `${type} ` + description;

      let descElement = meetings[j].querySelector("em");
      if (descElement) {
        description += `\t${descElement.textContent}`;
      }

      for (let meetingTime of parsedDetails.times) {
        calEvents.push({
          uid: uid(),
          stamp: { date: new Date() },
          summary: `${courseTitle}`,
          description: `${description}`,
          location: parsedDetails.location,
          start: { date: meetingTime.start.toJSDate() },
          end: { date: meetingTime.end.toJSDate() },
          recurrenceRule: {
            frequency: "WEEKLY",
            interval: 1,
            until: {
              date: finalDate
            }
          },
          exceptionDates:
            exceptionDates.length > 0
              ? exceptionDates.map((date) => ({ date, type: "DATE" }))
              : []
        });
      }
    }
  }

  const calendar: VCalendar = {
    version: "2.0",
    prodId: "uw-madison-schedule-downloader",
    events: calEvents
  };

  let generatedCal = generateIcsCalendar(calendar);

  // There is a bug in ts-ics (before version 1.6.2) where the UNTIL field
  // is not correctly generated. It adds an "undefined" string before the date
  // if the local property is not defined, along with incorrectly formatting the date.
  // This is a hacky solution to fix that.
  //
  // Ideally this could be fixed by updating the ts-ics package to the working version,
  // but, I ran into numerous dependency issues when trying to update the package and
  // wasn't able to resolve them.
  //
  // https://github.com/Neuvernetzung/ts-ics/commit/36343d5691eb90dcc65687164ec1fe9845e0fbb3
  let correctedCalendar = generatedCal.replace(
    /UNTIL=undefined(\d{8})/g,
    "UNTIL=$1"
  );

  fileDownload(correctedCalendar, "uw-schedule.ics");
});

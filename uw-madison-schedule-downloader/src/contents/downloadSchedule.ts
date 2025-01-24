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
  let initDate: Date;
  let endDate: Date;
  let exceptionDates: Date[] = [];

  if (breaks.length > 0) {
    initDate = new Date(breaks[0].date);
    endDate = new Date(breaks[breaks.length - 1].date);
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
    initDate = new Date();
    endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  console.log("Break info!");
  console.log("breaks: ", breaks);
  console.log("initDate: ", initDate);
  console.log("endDate: ", endDate);
  let isoDate = endDate.toISOString();
  console.log(isoDate);
  let year = isoDate.slice(0, 4);
  let month = isoDate.slice(5, 7);
  let day = isoDate.slice(8, 10);
  console.log(year, month, day);
  console.log(`${year}${month}${day}`);
  console.log("exceptionDates: ", exceptionDates);

  const courses = document.querySelectorAll("#course-meetings");
  for (let i = 0; i < courses.length; i++) {
    const fullCourse = courses[i].querySelector("h3")?.textContent || "";
    const [courseTitle, courseName] = fullCourse.split(": ");
    const lists = courses[i].querySelectorAll(":scope > ul");

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

      description += `\t${type}`;

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
              type: "DATE",
              date: endDate
            }
          },
          exceptionDates:
            exceptionDates.length > 0
              ? exceptionDates.map((date) => ({ date }))
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

  const generatedCal = generateIcsCalendar(calendar);

  fileDownload(generatedCal, "uw-schedule.ics");
});

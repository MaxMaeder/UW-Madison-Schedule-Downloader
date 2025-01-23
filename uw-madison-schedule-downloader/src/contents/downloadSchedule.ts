import fileDownload from "js-file-download";
import type { PlasmoCSConfig } from "plasmo";
import { generateIcsCalendar, type VCalendar, type VEvent } from "ts-ics";
import { uid } from "uid";
import browser from "webextension-polyfill";

import { DOWNLOAD_SHED_MSG } from "~assets/constants";
import type { AppMessage } from "~types";
import { parseExamDetails, parseMeetingDetails } from "~util/parseDetails";

export const config: PlasmoCSConfig = {
  matches: ["*://mumaaenroll.services.wisc.edu/courses-schedule*"]
};

browser.runtime.onMessage.addListener((message: AppMessage) => {
  if (message.type !== DOWNLOAD_SHED_MSG) return true;

  const calEvents: VEvent[] = [];

  const courses = document.querySelectorAll("#course-meetings");
  for (let i = 0; i < courses.length; i++) {
    const fullCourse = courses[i].querySelector("h3").textContent;
    console.log(fullCourse);
    const [courseTitle, courseName] = fullCourse.split(": ");
    const lists = courses[i].querySelectorAll(":scope > ul");

    const [meetingList, examList] = lists;

    const exams = examList.querySelectorAll("li");
    let examString = "";

    for (let j = 0; j < exams.length; j++) {
      const examStr = exams[j].querySelector("span").textContent;
      const examDetails = parseExamDetails(examStr);

      examString +=
        examStr
          .split("\n")
          .filter((block) => block.trim() !== "")
          .map((block) => block.trim())
          .join(" ") + "\n";

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

    let description = `${fullCourse}\n${examString}`;

    const meetings = meetingList.children;

    for (let j = 0; j < meetings.length; j++) {
      const type = meetings[j].querySelector("strong").textContent;
      const details = meetings[j].querySelector("span");

      const parsedDetails = parseMeetingDetails(details.textContent);

      description += `\n${type}`;

      let descElement = meetings[j].querySelector("em");
      if (descElement) {
        description += `\n\n${descElement.textContent}`;
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
            interval: 1
          }
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

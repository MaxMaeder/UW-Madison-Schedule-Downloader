import fileDownload from "js-file-download";
import type { PlasmoCSConfig } from "plasmo";
import { generateIcsCalendar, type VCalendar, type VEvent } from "ts-ics";
import { uid } from "uid";
import browser from "webextension-polyfill";

import { DOWNLOAD_SHED_MSG } from "~assets/constants";
import type { AppMessage } from "~types";
import parseMeetingDetails from "~util/parseMeetingDetails";

export const config: PlasmoCSConfig = {
  matches: ["*://mumaaenroll.services.wisc.edu/courses-schedule*"]
};

browser.runtime.onMessage.addListener((message: AppMessage) => {
  if (message.type !== DOWNLOAD_SHED_MSG) return true;

  const calEvents: VEvent[] = [];

  const courses = document.querySelectorAll("#course-meetings");
  for (let i = 0; i < courses.length; i++) {
    const courseName = courses[i].querySelector("strong");
    if (!courseName) continue;

    const [meetingList, examList] = courses[i].querySelectorAll("ul");

    const meetings = meetingList.querySelectorAll("li");
    for (let j = 0; j < meetings.length; j++) {
      const type = meetings[j].querySelector("strong");
      const details = meetings[j].querySelector("span");

      if (!type || !details) continue;

      const parsedDetails = parseMeetingDetails(details.textContent);

      for (let meetingTime of parsedDetails.times) {
        calEvents.push({
          uid: uid(),
          stamp: { date: new Date() },
          summary: `${type.textContent} | ${courseName.textContent}`,
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

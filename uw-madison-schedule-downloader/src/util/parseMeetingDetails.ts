import { DateTime, type WeekdayNumbers } from "luxon";

export interface Meeting {
  times: { start: DateTime; end: DateTime }[];
  location: string;
}

const parseMeetingDetails = (scheduleStr: string): Meeting => {
  scheduleStr = scheduleStr.replace(/\s+/g, " ").trim();

  const [days, ...timeAndLocation] = scheduleStr.split(" ");

  const startTime = `${timeAndLocation[0]} ${timeAndLocation[1]}`;
  const endTime = `${timeAndLocation[3]} ${timeAndLocation[4]}`;
  const location = timeAndLocation.slice(5).join(" ");

  const today = DateTime.now();
  const timeFormat = "h:mm a";

  const times = [...days].map((day) => {
    const dayOfWeek = dayToWeekday(day);
    const nextDay = today.set({ weekday: dayOfWeek });
    const startDateTime = DateTime.fromFormat(startTime, timeFormat).set({
      year: nextDay.year,
      month: nextDay.month,
      day: nextDay.day
    });
    const endDateTime = DateTime.fromFormat(endTime, timeFormat).set({
      year: nextDay.year,
      month: nextDay.month,
      day: nextDay.day
    });

    return { start: startDateTime, end: endDateTime };
  });

  return {
    times,
    location
  };
};

const dayToWeekday = (day: string): WeekdayNumbers => {
  switch (day) {
    case "M":
      return 1;
    case "T":
      return 2;
    case "W":
      return 3;
    case "R":
      return 4;
    case "F":
      return 5;
    default:
      throw new Error("Invalid day abbreviation");
  }
};

export default parseMeetingDetails;

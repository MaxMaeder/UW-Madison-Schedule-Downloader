import { DateTime, type WeekdayNumbers } from "luxon";

export interface Meeting {
  times: { start: DateTime; end: DateTime }[];
  location: string;
}

export interface Exam {
  start: DateTime;
  end: DateTime;
  location: string;
}

export const parseMeetingDetails = (scheduleStr: string): Meeting => {
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

export const parseExamDetails = (examStr: string): Exam => {
  const [month, day, ...timeAndLocation] = examStr.split(" ");

  const startTime = `${timeAndLocation[0]} ${timeAndLocation[1]}`;
  const endTime = `${timeAndLocation[3]} ${timeAndLocation[4]}`;
  let location = timeAndLocation.slice(5).join(" ");
  location = location === "" ? "TBA" : location;

  const dateFormat = "LLLd,";
  const timeFormat = "h:mm a";

  const examDay = DateTime.fromFormat(month + day, dateFormat);
  const startDateTime = DateTime.fromFormat(startTime, timeFormat).set({
    year: examDay.year,
    month: examDay.month,
    day: examDay.day
  });
  const endDateTime = DateTime.fromFormat(endTime, timeFormat).set({
    year: examDay.year,
    month: examDay.month,
    day: examDay.day
  });

  return {
    start: startDateTime,
    end: endDateTime,
    location: location
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

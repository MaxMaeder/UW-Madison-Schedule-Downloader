document.getElementById("ext-download").addEventListener("click", () => {
  // Get all events
  let events = window.document.getElementsByClassName("tt-activity");

  let parsedEvents = [];

  // Iterate over events
  for (let event of events) {
    
    // Get day of week event will occur on
    let day =
      event.parentElement.getElementsByClassName("tt-dayTitle")[0].innerText;

    // Get event info
    let rawEventInfo = event.childNodes[0].childNodes;
    if (rawEventInfo.length < 5) continue;

    // Parse event info
    let eventInfo = [];
    for (let rawEvent of rawEventInfo) {
      eventInfo.push(rawEvent.innerText);
    }

    // Parse dates and times of the event
    let [firstDate, lastDate] = eventInfo[3].split(" - ");
    let [startTime, endTime] = eventInfo[4].split(" to ");

    // Save event data to array
    let parsedEvent = {
      name: `${eventInfo[0]} ${eventInfo[1]}`,
      location: eventInfo[2],
      day,
      startTime,
      endTime,
      firstDate,
      lastDate,
    };
    parsedEvents.push(parsedEvent);
  }

  let cal = ics();

  // Iterate over parsed events
  for (let parsedEvent of parsedEvents) {
    
    // Get start and end times of the event
    let startTime = luxon.DateTime.fromFormat(
      `${parsedEvent.day} ${parsedEvent.startTime}`,
      "EEE h:mm a"
    );
    let endTime = luxon.DateTime.fromFormat(
      `${parsedEvent.day} ${parsedEvent.endTime}`,
      "EEE h:mm a"
    );

    // Get the dates before or after which the event will not occur
    let firstDate = luxon.DateTime.fromFormat(
      parsedEvent.firstDate,
      "MMM d"
    );
    let lastDate = luxon.DateTime.fromFormat(
      parsedEvent.lastDate,
      "MMM d, yyyy"
    );

    // Make sure event doesn't start before the first date
    while (startTime.startOf("day") < firstDate.startOf("day")) { // Is startTime before firstDate?
      startTime = startTime.plus({ weeks: 1 });
      endTime = endTime.plus({ weeks: 1 }); // Also need to increase end time by same amnt.
    }

    // Add event to calendar
    console.log({
      name: parsedEvent.name,
      location: parsedEvent.location,
      startTime: startTime.toJSDate().toString(),
      endTime: endTime.toJSDate().toString(),
      freq: "WEEKLY",
      until: lastDate.toJSDate().toString(),
    })

    cal.addEvent(
      parsedEvent.name,
      "",
      parsedEvent.location,
      startTime.toJSDate().toString(),
      endTime.toJSDate().toString(),

      // Set to repeat weekly, as classes do
      {
        freq: "WEEKLY",
        until: lastDate.toJSDate().toString(),
      }
    );
  }

  // Download iCal file
  cal.download("Class Schedule");
});

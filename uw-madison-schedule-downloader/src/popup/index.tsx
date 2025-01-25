import {
  Anchor,
  AppShell,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Loader,
  Stack,
  Text,
  Title
} from "@mantine/core";
import {
  IconArrowUpRight,
  IconDownload,
  IconReload
} from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import browser from "webextension-polyfill";

import {
  DOWNLOAD_SHED_MSG,
  GET_TERM_MSG,
  SCHEDULE_SITE_HOST,
  SCHEDULE_SITE_PATH
} from "~assets/constants";
import useCurrentTabUrl from "~hooks/useCurrentTabUrl";
import isScheduleSite from "~util/isScheduleSite";

import Header from "./Header";
import { ThemeProvider } from "./theme";

const Popup = () => {
  const currUrl = useCurrentTabUrl();
  const isShedSite = currUrl && isScheduleSite(currUrl);

  const [detectedSemester, setDetectedSemester] = useState("None");
  const [breaks, setBreaks] = useState([]);
  const [loadingSemester, setLoadingSemester] = useState(true);
  const [loadingBreaks, setLoadingBreaks] = useState(false);

  const downloadSchedule = useCallback(async () => {
    const [activeTab] = await browser.tabs.query({
      active: true,
      currentWindow: true
    });

    if (activeTab.id)
      await browser.tabs.sendMessage(activeTab.id, {
        type: DOWNLOAD_SHED_MSG,
        payload: breaks
      });
  }, [breaks]);

  const openSite = useCallback(() => {
    window.open("https://" + SCHEDULE_SITE_HOST + SCHEDULE_SITE_PATH, "_blank");
  }, []);

  const getTerm = useCallback(async () => {
    try {
      const [activeTab] = await browser.tabs.query({
        active: true,
        currentWindow: true
      });

      if (activeTab.id) {
        const response: { detectedSemester: string } =
          await browser.tabs.sendMessage(activeTab.id, {
            type: GET_TERM_MSG
          });

        if (response && response.detectedSemester) {
          setDetectedSemester(response.detectedSemester);
        }
      }
    } catch (error) {
      console.error("Error getting term: ", error);
    } finally {
      setLoadingSemester(false);
    }
  }, []);

  useEffect(() => {
    if (isShedSite) {
      setLoadingSemester(true);
      getTerm();
    }
  }, [isShedSite, getTerm]);

  const updateBreaks = useCallback(() => {
    setLoadingBreaks(true);

    fetch("https://secfac.wisc.edu/academic-calendar/")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.text();
      })
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        let rows = doc.querySelector("table").querySelector("tbody").children;

        let [semYear, semType] = detectedSemester.split(" ");
        let semesterTitle = semType;
        semType = semType.toLowerCase();

        let startingIndex = 0;

        for (let i = 0; i < rows.length; i++) {
          let strong = rows[i].querySelector("strong");
          if (strong && strong.textContent.toLowerCase().includes(semType)) {
            startingIndex = i;
            break;
          }
        }

        let parseDate = (dateStr) => {
          let dateParts = dateStr.match(/[a-z]{3} \d{1,2}/gi);

          let res = {
            date: null,
            length: 1
          };

          res.date = new Date(dateParts[0] + ", " + semYear);
          if (dateParts.length === 2) {
            let date1 = new Date(dateParts[0] + ", " + semYear);
            let date2 = new Date(dateParts[1] + ", " + semYear);
            let difference = date2.getTime() - date1.getTime();
            res.length = difference / (1000 * 3600 * 24) + 1;
          }

          return res;
        };

        let breaksData = [];

        breaksData.push({
          name: `${semesterTitle} start`,
          ...parseDate(rows[startingIndex].children[1].textContent)
        });

        for (let i = startingIndex + 1; i < rows.length; i++) {
          let leftTitle = rows[i].children[0].textContent.toLowerCase();
          let parsedDate = parseDate(rows[i].children[1].textContent);

          if (leftTitle.includes("last")) {
            breaksData.push({
              name: `${semesterTitle} end`,
              ...parsedDate
            });
            break;
          }

          if (
            leftTitle.includes("break") ||
            leftTitle.includes("day") ||
            leftTitle.includes("recess")
          ) {
            let breakData = {
              name: rows[i].children[0].textContent,
              ...parsedDate
            };
            breaksData.push(breakData);
          }
        }

        setBreaks(breaksData);
        setLoadingBreaks(false);
      })
      .catch((error) => {
        console.error("Error fetching breaks: ", error);
        setBreaks([]);
        setLoadingBreaks(false);
      });
  }, [detectedSemester, setBreaks, setLoadingBreaks]);

  return (
    <ThemeProvider withNormalizeCSS withGlobalStyles>
      <AppShell header={<Header />} w={350}>
        <Stack>
          {isShedSite && (
            <>
              <Group position="apart">
                <Text weight={600}>Detected semester:</Text>
                {loadingSemester ? (
                  <Loader size="xs" />
                ) : (
                  <Text>{detectedSemester}</Text>
                )}
              </Group>
              <Divider my="sm" />
              <Button
                variant={breaks.length > 0 ? "outline" : "filled"}
                color="blue"
                leftIcon={<IconReload />}
                onClick={updateBreaks}>
                Update Breaks
              </Button>
              <Title order={4}>Breaks</Title>
              {loadingBreaks ? (
                <Loader size="xs" />
              ) : breaks.length > 0 ? (
                breaks.map((breakItem, index) => {
                  const startDate = new Date(breakItem.date);
                  const endDate = new Date(startDate);
                  endDate.setDate(startDate.getDate() + breakItem.length - 1);

                  let dateStr =
                    breakItem.length > 1
                      ? `${startDate.toDateString()} - ${endDate.toDateString()}`
                      : startDate.toDateString();

                  return (
                    <Card key={index} shadow="sm" padding="sm" withBorder>
                      <Text weight={500}>{breakItem.name}</Text>
                      <Badge color="blue">{dateStr}</Badge>
                    </Card>
                  );
                })
              ) : (
                <Text>No breaks available</Text>
              )}
              <Divider my="sm" />
            </>
          )}
          {isShedSite ? (
            <Button leftIcon={<IconDownload />} onClick={downloadSchedule}>
              {breaks.length > 0
                ? "Download Schedule with Breaks"
                : "Download Schedule"}
            </Button>
          ) : (
            <Button leftIcon={<IconArrowUpRight />} onClick={openSite}>
              Go to Schedule Site
            </Button>
          )}
        </Stack>

        <Text c="dimmed" align="center" mt="lg">
          Made by{" "}
          <Anchor color="dimmed" href="https://mmaeder.com/" target="_blank">
            Max Maeder
          </Anchor>
        </Text>
      </AppShell>
    </ThemeProvider>
  );
};

export default Popup;

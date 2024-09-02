import { Anchor, AppShell, Button, Stack, Text } from "@mantine/core";
import { IconArrowUpRight, IconDownload } from "@tabler/icons-react";
import { useCallback } from "react";
import browser from "webextension-polyfill";

import {
  DOWNLOAD_SHED_MSG,
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

  const downloadSchedule = useCallback(async () => {
    const [activeTab] = await browser.tabs.query({
      active: true,
      currentWindow: true
    });

    if (activeTab.id)
      await browser.tabs.sendMessage(activeTab.id, { type: DOWNLOAD_SHED_MSG });
  }, []);

  const openSite = useCallback(() => {
    window.open("https://" + SCHEDULE_SITE_HOST + SCHEDULE_SITE_PATH, "_blank");
  }, []);

  return (
    <ThemeProvider withNormalizeCSS withGlobalStyles>
      <AppShell header={<Header />} w={350}>
        <Stack>
          {isShedSite ? (
            <Button leftIcon={<IconDownload />} onClick={downloadSchedule}>
              Download Schedule
            </Button>
          ) : (
            <Button leftIcon={<IconArrowUpRight />} onClick={openSite}>
              Go to Schedule Site
            </Button>
          )}
        </Stack>

        <Text c="dimmed" align="center" mt="lg">
          Made by{" "}
          <Anchor
            color="dimmed"
            href="https://www.linkedin.com/in/maxmaeder/"
            target="_blank">
            Max Maeder
          </Anchor>
        </Text>
      </AppShell>
    </ThemeProvider>
  );
};

export default Popup;

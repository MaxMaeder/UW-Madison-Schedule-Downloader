import { useEffect, useState } from "react";
import browser from "webextension-polyfill";

const useCurrentTabUrl = (): string | null => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchTabUrl = async () => {
      try {
        const [activeTab] = await browser.tabs.query({
          active: true,
          currentWindow: true
        });
        setUrl(activeTab.url ?? null);
      } catch (error) {
        console.error("Failed to fetch the active tab URL:", error);
        setUrl(null);
      }
    };

    fetchTabUrl();
  }, []);

  return url;
};

export default useCurrentTabUrl;

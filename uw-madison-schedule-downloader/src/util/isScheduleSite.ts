import { SCHEDULE_SITE_HOST, SCHEDULE_SITE_PATH } from "~assets/constants";

const isScheduleSite = (rawUrl: string): boolean => {
  const url = new URL(rawUrl);

  return (
    url.hostname === SCHEDULE_SITE_HOST && url.pathname === SCHEDULE_SITE_PATH
  );
};

export default isScheduleSite;

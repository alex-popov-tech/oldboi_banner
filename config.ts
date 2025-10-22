import "dotenv/config";
import { cleanEnv, str, num } from "envalid";

const ONE_MINUTE_IN_MILLIS = 60000;

export const config = cleanEnv(process.env, {
  TWITCH_CLIENT_ID: str({
    desc: "Twitch application client ID (get from https://dev.twitch.tv/console)",
  }),
  TWITCH_ACCESS_TOKEN: str({
    desc: "Twitch OAuth access token for API authentication",
  }),
  TWITCH_BROADCASTER_ID: str({
    desc: "Twitch broadcaster/channel ID to monitor",
  }),
  PATREON_TOKEN: str({
    desc: "Patreon API access token for campaign data",
  }),
  PATREON_CAMPAIGN_ID: str({
    desc: "Patreon campaign ID to track patrons",
  }),
  TWITCH_POLL_INTERVAL: num({
    desc: "Twitch polling interval in milliseconds",
    default: ONE_MINUTE_IN_MILLIS,
  }),
  PATREON_POLL_INTERVAL: num({
    desc: "Patreon polling interval in milliseconds",
    default: 10 * ONE_MINUTE_IN_MILLIS,
  }),
  MONOBANK_POLL_INTERVAL: num({
    desc: "Monobank polling interval in milliseconds",
    default: ONE_MINUTE_IN_MILLIS,
  }),
  YOUTUBE_POLL_INTERVAL: num({
    desc: "YouTube polling interval in milliseconds",
    default: ONE_MINUTE_IN_MILLIS,
  }),
});

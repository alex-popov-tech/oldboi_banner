import "dotenv/config";
import { cleanEnv, str } from "envalid";

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
});

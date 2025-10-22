import { createLogger } from "./logger";

const logger = createLogger("twitch");

type TwitchSubscription = {
  broadcaster_id: string;
  broadcaster_login: string;
  broadcaster_name: string;
  gifter_id: string;
  gifter_login: string;
  gifter_name: string;
  is_gift: boolean;
  plan_name: string;
  tier: string;
  user_id: string;
  user_name: string;
  user_login: string;
};

async function get(args: {
  clientId: string;
  accessToken: string;
  broadcasterId: string;
}): Promise<{ value: number } | { error: Error }> {
  const baseUrl = "https://api.twitch.tv/helix/subscriptions";
  let cursor = "";
  let allSubs: TwitchSubscription[] = [];

  while (true) {
    const url = new URL(baseUrl);
    url.searchParams.set("broadcaster_id", args.broadcasterId);
    if (cursor) url.searchParams.set("after", cursor);

    try {
      const res = await fetch(url.toString(), {
        headers: {
          "Client-ID": args.clientId,
          Authorization: `Bearer ${args.accessToken}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        return { error: new Error(`HTTP ${res.status}: ${text}`) };
      }

      const json = await res.json();
      allSubs.push(...(json.data || []));

      cursor = json.pagination?.cursor;
      if (!cursor) break;
    } catch (err: any) {
      return { error: err?.message || String(err) };
    }
  }

  return { value: allSubs.length };
}

export function init(args: {
  clientId: string;
  accessToken: string;
  broadcasterId: string;
}) {
  logger.log("init started");
  const client = {
    get: async (): Promise<{ value: number } | { error: Error }> => {
      return await get(args);
    },
  };
  logger.log("init finished");
  return client;
}

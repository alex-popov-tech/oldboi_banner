import { createLogger } from "./logger";

const logger = createLogger("patreon");

type Member = {
  id: string;
  type: string;
  attributes: {
    patron_status: string | null;
    currently_entitled_amount_cents: number;
  };
};

type ApiResponse = {
  data: Member[];
  meta: {
    pagination: {
      cursors?: { next?: string };
    };
  };
};

async function get(args: {
  token: string;
  campaignId: string;
}): Promise<{ value: number } | { error: Error }> {
  const { token, campaignId } = args;

  let cursor = "";
  let count = 0;

  try {
    while (true) {
      const url = new URL(
        `https://www.patreon.com/api/oauth2/v2/campaigns/${campaignId}/members`,
      );
      url.searchParams.set(
        "fields[member]",
        "patron_status,currently_entitled_amount_cents",
      );
      if (cursor) url.searchParams.set("page[cursor]", cursor);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        return { error: new Error(`HTTP ${res.status}: ${text}`) };
      }

      const json: ApiResponse = await res.json();

      for (const m of json.data) {
        if (m.attributes.patron_status === "active_patron") {
          count++;
        }
      }

      cursor = json.meta.pagination.cursors?.next ?? "";
      if (!cursor) break;
    }

    return { value: count };
  } catch (err: any) {
    return { error: err };
  }
}

export function init(args: { token: string; campaignId: string }) {
  logger.log("init started");
  const client = {
    get: async (): Promise<{ value: number } | { error: Error }> => {
      return await get(args);
    },
  };
  logger.log("init finished");
  return client;
}

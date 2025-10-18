import "dotenv/config";
import * as twitch from "./twitch";
import * as patreon from "./patreon";
import * as monobank from "./monobank";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const twitchClient = twitch.init({
    clientId: process.env.TWITCH_CLIENT_ID!,
    accessToken: process.env.TWITCH_ACCESS_TOKEN!,
    broadcasterId: process.env.TWITCH_BROADCASTER_ID!,
  });

  const patreonClient = patreon.init({
    token: process.env.PATREON_TOKEN!,
    campaignId: process.env.PATREON_CAMPAIGN_ID!,
  });

  const monobankClient = await monobank.init();

  while (true) {
    const iterationStart = Date.now();
    const timestamp = new Date().toLocaleString("uk-UA", {
      dateStyle: "medium",
      timeStyle: "medium",
    });
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Fetching at ${timestamp}`);
    console.log("=".repeat(60));

    const twitchStart = Date.now();
    const patreonStart = Date.now();
    const monobankStart = Date.now();

    const [twitchResult, patreonResult, monobankResult] = await Promise.all([
      twitchClient.get().then((result) => {
        const twitchTime = Date.now() - twitchStart;
        return { result, time: twitchTime };
      }),
      patreonClient.get().then((result) => {
        const patreonTime = Date.now() - patreonStart;
        return { result, time: patreonTime };
      }),
      monobankClient.get().then((result) => {
        const monobankTime = Date.now() - monobankStart;
        return { result, time: monobankTime };
      }),
    ]);

    if ("error" in twitchResult.result) {
      console.error("Twitch error:", twitchResult.result.error);
    } else {
      console.log(
        `Twitch subs: ${twitchResult.result.value} (${twitchResult.time}ms)`,
      );
    }

    if ("error" in patreonResult.result) {
      console.error("Patreon error:", patreonResult.result.error);
    } else {
      console.log(
        `Patreon patrons: ${patreonResult.result.value} (${patreonResult.time}ms)`,
      );
    }

    if ("error" in monobankResult.result) {
      console.error("Monobank error:", monobankResult.result.error);
    } else {
      console.log(
        `Monobank patrons: ${monobankResult.result.value} (${monobankResult.time}ms)`,
      );
    }

    const iterationTime = Date.now() - iterationStart;
    console.log("=".repeat(60));
    console.log(`Total iteration time: ${iterationTime}ms`);
    console.log("=".repeat(60));

    await sleep(60 * 1000);
  }
})();

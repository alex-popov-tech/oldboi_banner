import { config } from "./config";
import * as twitch from "./twitch";
import * as patreon from "./patreon";
import * as monobank from "./monobank";
import * as youtube from "./youtube";
import { createLogger } from "./logger";
import { readFile, writeFile } from "fs/promises";

const logger = createLogger("main");

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const twitchClient = twitch.init({
    clientId: config.TWITCH_CLIENT_ID,
    accessToken: config.TWITCH_ACCESS_TOKEN,
    broadcasterId: config.TWITCH_BROADCASTER_ID,
  });

  const patreonClient = patreon.init({
    token: config.PATREON_TOKEN,
    campaignId: config.PATREON_CAMPAIGN_ID,
  });

  const monobankClient = await monobank.init();

  const youtubeOldplayClient = await youtube.init({
    name: "oldboi",
    url: "https://studio.youtube.com/channel/UCVbmzw9YUnTuowKV8zEtCLA/monetization/memberships",
  });
  const youtubeOldboiClient = await youtube.init({
    name: "oldplay",
    url: "https://studio.youtube.com/channel/UC9S0Ge7cw73nqvZ4FOA3gAQ/monetization/memberships",
  });

  // Read widget template once at startup
  let widgetTemplate: string;
  try {
    widgetTemplate = await readFile("widget.template", "utf-8");
    logger.log("Widget template loaded successfully");
  } catch (error) {
    logger.log(`Failed to load widget template: ${error}`);
    process.exit(1);
  }

  while (true) {
    let totalCount = 0;
    const iterationStart = Date.now();
    const timestamp = new Date().toLocaleString("uk-UA", {
      dateStyle: "medium",
      timeStyle: "medium",
    });
    logger.log(`\n${"=".repeat(60)}`);
    logger.log(`Fetching at ${timestamp}`);
    logger.log("=".repeat(60));

    const twitchStart = Date.now();
    const patreonStart = Date.now();
    const monobankStart = Date.now();
    const youtubeStart = Date.now();

    const [
      twitchResult,
      patreonResult,
      monobankResult,
      youtubeOldplayResult,
      youtubeOldboiResult,
    ] = await Promise.all([
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
      youtubeOldplayClient.get().then((result) => {
        const youtubeTime = Date.now() - youtubeStart;
        return { result, time: youtubeTime };
      }),
      youtubeOldboiClient.get().then((result) => {
        const youtubeTime = Date.now() - youtubeStart;
        return { result, time: youtubeTime };
      }),
    ]);

    if ("error" in twitchResult.result) {
      logger.log(`Twitch error: ${twitchResult.result.error}`);
    } else {
      logger.log(
        `Twitch subs: ${twitchResult.result.value} (${twitchResult.time}ms)`,
      );
      totalCount += twitchResult.result.value;
    }

    if ("error" in patreonResult.result) {
      logger.log(`Patreon error: ${patreonResult.result.error}`);
    } else {
      logger.log(
        `Patreon patrons: ${patreonResult.result.value} (${patreonResult.time}ms)`,
      );
      totalCount += patreonResult.result.value;
    }

    if ("error" in monobankResult.result) {
      logger.log(`Monobank error: ${monobankResult.result.error}`);
    } else {
      logger.log(
        `Monobank patrons: ${monobankResult.result.value} (${monobankResult.time}ms)`,
      );
      totalCount += monobankResult.result.value;
    }

    if ("error" in youtubeOldplayResult.result) {
      logger.log(`YouTube oldplay error: ${youtubeOldplayResult.result.error}`);
    } else {
      logger.log(
        `YouTube oldplay sponsors: ${youtubeOldplayResult.result.value} (${youtubeOldplayResult.time}ms)`,
      );
      totalCount += youtubeOldplayResult.result.value;
    }

    if ("error" in youtubeOldboiResult.result) {
      logger.log(`YouTube oldboi error: ${youtubeOldboiResult.result.error}`);
    } else {
      logger.log(
        `YouTube oldboi sponsors: ${youtubeOldboiResult.result.value} (${youtubeOldboiResult.time}ms)`,
      );
      totalCount += youtubeOldboiResult.result.value;
    }

    const iterationTime = Date.now() - iterationStart;
    logger.log("=".repeat(60));
    logger.log(`Total subscribers: ${totalCount}`);
    logger.log(`Total iteration time: ${iterationTime}ms`);
    logger.log("=".repeat(60));

    // Generate widget.html with current counter value
    try {
      const widgetContent = widgetTemplate.replace(
        "const COUNTER = 0;",
        `const COUNTER = ${totalCount};`
      );
      await writeFile("widget.html", widgetContent, "utf-8");
      logger.log(`Widget updated: widget.html (counter: ${totalCount})`);
    } catch (error) {
      logger.log(`Failed to write widget.html: ${error}`);
    }

    await sleep(60 * 1000);
  }
})();

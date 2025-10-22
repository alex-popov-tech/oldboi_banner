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
    widgetTemplate = await readFile("widget.html", "utf-8");
    logger.log("Widget template loaded successfully");
  } catch (error) {
    logger.log(`Failed to load widget template: ${error}`);
    process.exit(1);
  }

  // Track last poll time for each source
  const lastPolled = {
    twitch: 0,
    patreon: 0,
    monobank: 0,
    youtubeOldplay: 0,
    youtubeOldboi: 0,
  };

  // Cache last successful results
  type Result = { value: number } | { error: Error };
  const cachedResults: Record<string, Result | null> = {
    twitch: null,
    patreon: null,
    monobank: null,
    youtubeOldplay: null,
    youtubeOldboi: null,
  };

  // Track last total count to detect changes
  let lastTotalCount = 0;

  while (true) {
    const now = Date.now();
    const iterationStart = now;
    const timestamp = new Date().toLocaleString("uk-UA", {
      dateStyle: "medium",
      timeStyle: "medium",
    });

    logger.log(`\n${"=".repeat(60)}`);
    logger.log(`Checking at ${timestamp}`);
    logger.log("=".repeat(60));

    // Build array of promises for sources that need polling
    type PollTask = {
      name: string;
      promise: Promise<Result>;
      start: number;
    };
    const pollTasks: PollTask[] = [];

    // Check each source if it needs polling
    if (now - lastPolled.twitch >= config.TWITCH_POLL_INTERVAL) {
      logger.log(
        `Polling Twitch (last: ${Math.round((now - lastPolled.twitch) / 1000)}s ago)`,
      );
      pollTasks.push({
        name: "twitch",
        promise: twitchClient.get(),
        start: Date.now(),
      });
      lastPolled.twitch = now;
    }

    if (now - lastPolled.patreon >= config.PATREON_POLL_INTERVAL) {
      logger.log(
        `Polling Patreon (last: ${Math.round((now - lastPolled.patreon) / 1000)}s ago)`,
      );
      pollTasks.push({
        name: "patreon",
        promise: patreonClient.get(),
        start: Date.now(),
      });
      lastPolled.patreon = now;
    }

    if (now - lastPolled.monobank >= config.MONOBANK_POLL_INTERVAL) {
      logger.log(
        `Polling Monobank (last: ${Math.round((now - lastPolled.monobank) / 1000)}s ago)`,
      );
      pollTasks.push({
        name: "monobank",
        promise: monobankClient.get(),
        start: Date.now(),
      });
      lastPolled.monobank = now;
    }

    if (now - lastPolled.youtubeOldplay >= config.YOUTUBE_POLL_INTERVAL) {
      logger.log(
        `Polling YouTube oldplay (last: ${Math.round((now - lastPolled.youtubeOldplay) / 1000)}s ago)`,
      );
      pollTasks.push({
        name: "youtubeOldplay",
        promise: youtubeOldplayClient.get(),
        start: Date.now(),
      });
      lastPolled.youtubeOldplay = now;
    }

    if (now - lastPolled.youtubeOldboi >= config.YOUTUBE_POLL_INTERVAL) {
      logger.log(
        `Polling YouTube oldboi (last: ${Math.round((now - lastPolled.youtubeOldboi) / 1000)}s ago)`,
      );
      pollTasks.push({
        name: "youtubeOldboi",
        promise: youtubeOldboiClient.get(),
        start: Date.now(),
      });
      lastPolled.youtubeOldboi = now;
    }

    // Execute polls in parallel
    if (pollTasks.length > 0) {
      const results = await Promise.all(
        pollTasks.map((t) =>
          t.promise.then((result) => ({
            result,
            time: Date.now() - t.start,
          })),
        ),
      );

      // Update cached results and log
      for (let i = 0; i < pollTasks.length; i++) {
        const task = pollTasks[i];
        const { result, time } = results[i];
        cachedResults[task.name] = result;

        if ("error" in result) {
          logger.log(`${task.name} error: ${result.error}`);
        } else {
          logger.log(`${task.name}: ${result.value} (${time}ms)`);
        }
      }
    } else {
      logger.log(
        "No sources need polling this iteration (using cached values)",
      );
    }

    // Calculate total using cached results
    let totalCount = 0;
    for (const [name, result] of Object.entries(cachedResults)) {
      if (result && "value" in result) {
        totalCount += result.value;
      }
    }

    const iterationTime = Date.now() - iterationStart;
    logger.log("=".repeat(60));
    logger.log(`Total subscribers: ${totalCount}`);
    logger.log(`Iteration time: ${iterationTime}ms`);
    logger.log("=".repeat(60));

    // Generate widget.html only if counter changed
    if (totalCount !== lastTotalCount) {
      try {
        const widgetContent = widgetTemplate.replace(
          /const COUNTER\s*=\s*\d+\s*;/,
          `const COUNTER = ${totalCount};`,
        );
        await writeFile("widget.html", widgetContent, "utf-8");
        logger.log(`Widget updated: widget.html (counter: ${totalCount})`);
        lastTotalCount = totalCount;
      } catch (error) {
        logger.log(`Failed to write widget.html: ${error}`);
      }
    } else {
      logger.log(`Widget unchanged (counter still: ${totalCount})`);
    }

    // Dynamic sleep: calculate time until next source needs polling
    const nextPollTimes = [
      lastPolled.twitch + config.TWITCH_POLL_INTERVAL,
      lastPolled.patreon + config.PATREON_POLL_INTERVAL,
      lastPolled.monobank + config.MONOBANK_POLL_INTERVAL,
      lastPolled.youtubeOldplay + config.YOUTUBE_POLL_INTERVAL,
      lastPolled.youtubeOldboi + config.YOUTUBE_POLL_INTERVAL,
    ];

    const nextPollTime = Math.min(...nextPollTimes);
    const sleepDuration = Math.max(1000, nextPollTime - Date.now()); // At least 1 second

    logger.log(
      `Sleeping for ${Math.round(sleepDuration / 1000)}s until next poll`,
    );
    await sleep(sleepDuration);
  }
})();

#!/usr/bin/env node
import program from "commander";
import PQueue from "p-queue";
import { Logger } from "./logger";
import { processFile } from "./process";
import { parseProgramParameters, ResultPromise } from "./util";
import { searchForFiles } from "./fs";
import { Result } from "@usefultools/monads";
import { exiftool } from "exiftool-vendored";
import { logger } from "batch-cluster";
import { basename } from "path";

const run = async (): Promise<void> => {
  program.name("photos-sort");

  program.arguments("<src> <dest>").action((src, dest) => {
    program.src = src;
    program.dest = dest;
  });
  program.option("--dry-run", "Perform a dry run without moving any files");
  program.option("-m, --move", "Move rather than copy files");
  program.option(
    "-d, --duplicates <dir>",
    "Destination directory for files with duplicates"
  );

  // Show Help if no operands
  if (!process.argv.slice(2).length) {
    program.outputHelp();
    process.exit(-1);
  }

  program.parse(process.argv);

  const params = (await parseProgramParameters(program)).match({
    ok: d => d,
    err: err => {
      Logger.error("Parameters parsing error", err);
      return process.exit(-1);
    }
  });

  // Search Source Directory for files
  Logger.info(`Searching for photos in ${params.sourceDirectory}`);
  const matches = (await searchForFiles(params.sourceDirectory)).match({
    ok: data => data,
    err: err => {
      Logger.error("", err);
      return process.exit(-1);
    }
  });
  Logger.info(`Found ${matches.length} matches`);

  // Create Evaluate EXIF/Rename/Move or Copy Pipeline
  const queue = new PQueue({ concurrency: 16 });
  await queue.addAll(
    matches.map(file => {
      return async () => {
        const result = await processFile(file, params);
        result.match({
          ok: s => {
            Logger.info(s);
          },
          err: e => {
            Logger.error("File Processing Error", e);
          }
        });
      };
    })
  );

  Logger.info("Sort Complete");
  process.exit(0);
};

run();

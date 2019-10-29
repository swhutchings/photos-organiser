#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = __importDefault(require("commander"));
const p_queue_1 = __importDefault(require("p-queue"));
const logger_1 = require("./logger");
const process_1 = require("./process");
const util_1 = require("./util");
const fs_1 = require("./fs");
const run = async () => {
    commander_1.default.name("photos-sort");
    commander_1.default.arguments("<src> <dest>").action((src, dest) => {
        commander_1.default.src = src;
        commander_1.default.dest = dest;
    });
    commander_1.default.option("--dry-run", "Perform a dry run without moving any files");
    commander_1.default.option("-m, --move", "Move rather than copy files");
    commander_1.default.option("-d, --duplicates <dir>", "Destination directory for files with duplicates");
    // Show Help if no operands
    if (!process.argv.slice(2).length) {
        commander_1.default.outputHelp();
        process.exit(-1);
    }
    commander_1.default.parse(process.argv);
    const params = (await util_1.parseProgramParameters(commander_1.default)).match({
        ok: d => d,
        err: err => {
            logger_1.Logger.error("Parameters parsing error", err);
            return process.exit(-1);
        }
    });
    // Search Source Directory for files
    logger_1.Logger.info(`Searching for photos in ${params.sourceDirectory}`);
    const matches = (await fs_1.searchForFiles(params.sourceDirectory)).match({
        ok: data => data,
        err: err => {
            logger_1.Logger.error("", err);
            return process.exit(-1);
        }
    });
    logger_1.Logger.info(`Found ${matches.length} matches`);
    // Create Evaluate EXIF/Rename/Move or Copy Pipeline
    const queue = new p_queue_1.default({ concurrency: 4 });
    await queue.addAll(matches.map(file => {
        return async () => {
            try {
                const result = await process_1.processFile(file, params);
                result.match({
                    ok: s => {
                        logger_1.Logger.info(s);
                    },
                    err: e => {
                        logger_1.Logger.error("File Processing Error", e);
                    }
                });
            }
            catch (e) {
                logger_1.Logger.error("", e);
            }
        };
    }));
    logger_1.Logger.info("Sort Complete");
    process.exit(0);
};
run();

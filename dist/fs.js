"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const monads_1 = require("@usefultools/monads");
const globby_1 = __importDefault(require("globby"));
const path_1 = require("path");
const luxon_1 = require("luxon");
const util_1 = require("./util");
async function checkDirectoryExists(directory) {
    return (await util_1.toResultPromise(fs_extra_1.stat(directory))).match({
        ok: () => monads_1.Ok(directory),
        err: err => monads_1.Err(err)
    });
}
exports.checkDirectoryExists = checkDirectoryExists;
async function searchForFiles(sourceDirectory) {
    const files = await globby_1.default("", {
        cwd: sourceDirectory,
        caseSensitiveMatch: false,
        expandDirectories: {
            files: ["*"],
            extensions: util_1.extensions()
        }
    });
    if (files.length > 0) {
        return monads_1.Ok(files.map(path => {
            return path_1.resolve(sourceDirectory, path);
        }));
    }
    return monads_1.Err(new Error("No matches found"));
}
exports.searchForFiles = searchForFiles;
async function getFileCreated(path) {
    const stats = await fs_extra_1.stat(path);
    return luxon_1.DateTime.fromJSDate(stats.birthtime);
}
exports.getFileCreated = getFileCreated;

import { stat, Stats } from "fs-extra";
import { Result, Ok, Option, None, Some, Err } from "@usefultools/monads";
import globby from "globby";
import { resolve } from "path";
import { DateTime } from "luxon";
import {
  toResultPromise,
  extensions,
  OptionPromise,
  ResultPromise
} from "./util";

export async function checkDirectoryExists(
  directory: string
): ResultPromise<string, Error> {
  return (await toResultPromise(stat(directory))).match<Result<string, Error>>({
    ok: () => Ok(directory),
    err: err => Err(err)
  });
}

export async function searchForFiles(
  sourceDirectory: string
): ResultPromise<Array<string>, Error> {
  const files: Array<string> = await globby("", {
    cwd: sourceDirectory,
    caseSensitiveMatch: false,
    expandDirectories: {
      files: ["*"],
      extensions: extensions()
    }
  });

  if (files.length > 0) {
    return Ok(
      files.map(path => {
        return resolve(sourceDirectory, path);
      })
    );
  }
  return Err(new Error("No matches found"));
}

export async function getFileCreated(path: string): Promise<DateTime> {
  const stats = await stat(path);
  return DateTime.fromJSDate(stats.birthtime);
}

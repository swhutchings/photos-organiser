import { Result, Ok, Err, Option, None, Some } from "@usefultools/monads";
import { union, map } from "lodash";
import { join, resolve } from "path";
import { CommanderStatic } from "commander";
import { Logger } from "./logger";
import { checkDirectoryExists } from "./fs";
import { some_constructor } from "@usefultools/monads/dist/Option/main";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const videoExtensions = require("video-extensions");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const imageExtensions = require("image-extensions");

export type ResultPromise<T, U> = Promise<Result<T, U>>;
export type OptionPromise<T> = Promise<Option<T>>;

export async function toResultPromise<T, U = Error>(
  promise: Promise<T>
): ResultPromise<T, U> {
  try {
    const data = await promise;
    return Ok(data);
  } catch (err) {
    return Err(err);
  }
}

export async function toOptionPromise<T>(
  promise: Promise<T>
): OptionPromise<T> {
  try {
    const data = await promise;
    if (data == null || data === undefined) {
      return None;
    }
    return Some(data);
  } catch (err) {
    return None;
  }
}

export function toOption<T>(val: T): Option<T> {
  if (val == null || val === undefined) {
    return None;
  }
  return Some(val);
}

export function extensions(): string[] {
  return union(imageExtensions, videoExtensions, ["dng"]);
}

export enum Mode {
  Move,
  Copy
}

export interface ProgramParameters {
  sourceDirectory: string;
  destinationDirectory: string;
  dryRun: boolean;
  mode: Mode;
  duplicates: Option<string>;
}

export async function parseProgramParameters(
  program: CommanderStatic
): ResultPromise<ProgramParameters, Error> {
  try {
    const params: ProgramParameters = {
      sourceDirectory: (await checkDirectoryExists(
        resolve(program.src)
      )).unwrap(),
      destinationDirectory: (await checkDirectoryExists(
        resolve(program.dest)
      )).unwrap(),
      dryRun: !!program.dryRun,
      mode: program.move ? Mode.Move : Mode.Copy,
      duplicates:
        program.duplicates !== undefined
          ? Some(
              (await checkDirectoryExists(resolve(program.duplicates))).unwrap()
            )
          : None
    };
    return Ok(params);
  } catch (err) {
    return Err(err);
  }
}

export function numberPad(number: number, length: number): string {
  let out = number.toString();
  while (out.length < length) {
    out = "0" + out;
  }
  return out;
}

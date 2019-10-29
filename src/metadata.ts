import { Tags, exiftool } from "exiftool-vendored";
import { Option, Some, None, Result, Ok, Err } from "@usefultools/monads";
import { DateTime } from "luxon";
import { getFileCreated } from "./fs";

export function getCameraMake(tags: Tags): Option<string> {
  if (tags.Make !== undefined) {
    return Some(tags.Make);
  }
  return None;
}

export function getCameraModel(tags: Tags): Option<string> {
  if (tags.Model !== undefined) {
    return Some(tags.Model);
  }
  return None;
}

export function getDateTimeTaken(tags: Tags): Result<DateTime, Error> {
  if (tags.DateTimeOriginal !== undefined) {
    return Ok(tags.DateTimeOriginal.toDateTime());
  }

  if (tags.CreateDate !== undefined) {
    return Ok(tags.CreateDate.toDateTime());
  }

  if (tags.ModifyDate !== undefined) {
    return Ok(tags.ModifyDate.toDateTime());
  }

  return Err(new Error("No Date Found in Metadata"));
}

export interface Metadata {
  dateTaken: DateTime;
  cameraModel: string;
}

export async function getMetadata(path: string): Promise<Metadata> {
  const tags = await exiftool.read(path);
  return {
    dateTaken: getDateTimeTaken(tags).unwrap_or(await getFileCreated(path)),
    cameraModel: getCameraModel(tags).unwrap_or("Unknown")
  };
}

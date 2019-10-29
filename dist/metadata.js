"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exiftool_vendored_1 = require("exiftool-vendored");
const monads_1 = require("@usefultools/monads");
const fs_1 = require("./fs");
function getCameraMake(tags) {
    if (tags.Make !== undefined) {
        return monads_1.Some(tags.Make);
    }
    return monads_1.None;
}
exports.getCameraMake = getCameraMake;
function getCameraModel(tags) {
    if (tags.Model !== undefined) {
        return monads_1.Some(tags.Model);
    }
    return monads_1.None;
}
exports.getCameraModel = getCameraModel;
function getDateTimeTaken(tags) {
    if (tags.DateTimeOriginal !== undefined) {
        return monads_1.Ok(tags.DateTimeOriginal.toDateTime());
    }
    if (tags.CreateDate !== undefined) {
        return monads_1.Ok(tags.CreateDate.toDateTime());
    }
    if (tags.ModifyDate !== undefined) {
        return monads_1.Ok(tags.ModifyDate.toDateTime());
    }
    return monads_1.Err(new Error("No Date Found in Metadata"));
}
exports.getDateTimeTaken = getDateTimeTaken;
async function getMetadata(path) {
    const tags = await exiftool_vendored_1.exiftool.read(path);
    return {
        dateTaken: getDateTimeTaken(tags).unwrap_or(await fs_1.getFileCreated(path)),
        cameraModel: getCameraModel(tags).unwrap_or("Unknown")
    };
}
exports.getMetadata = getMetadata;

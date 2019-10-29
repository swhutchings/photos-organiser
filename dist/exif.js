"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exiftool_vendored_1 = require("exiftool-vendored");
const monads_1 = require("@usefultools/monads");
const fs_1 = require("./fs");
const path_1 = require("path");
const change_case_1 = require("change-case");
function getCameraMake(tags) {
    if (tags.Make != undefined) {
        return monads_1.Some(tags.Make);
    }
    else {
        return monads_1.None;
    }
}
exports.getCameraMake = getCameraMake;
function getCameraModel(tags) {
    if (tags.Model != undefined) {
        return monads_1.Some(tags.Model);
    }
    else {
        return monads_1.None;
    }
}
exports.getCameraModel = getCameraModel;
function getDateTimeTaken(tags) {
    if (tags.DateTimeOriginal != undefined) {
        return monads_1.Ok(tags.DateTimeOriginal.toDateTime());
    }
    else if (tags.CreateDate != undefined) {
        return monads_1.Ok(tags.CreateDate.toDateTime());
    }
    else if (tags.ModifyDate != undefined) {
        return monads_1.Ok(tags.ModifyDate.toDateTime());
    }
    else {
        return monads_1.Err(new Error("No Date Found in Metadata"));
    }
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
function generateFilePath(m) {
    return path_1.join(m.dateTaken.year.toString(), m.dateTaken.month.toString().padStart(2, "0"), m.dateTaken.day.toString().padStart(2, "0"), change_case_1.snakeCase(m.cameraModel));
}
exports.generateFilePath = generateFilePath;
function generateFileNameDated(p, m) {
    const fileDateString = m.dateTaken.toFormat("yyyy LL dd HH mm ss");
    const existingBaseName = path_1.basename(p, path_1.extname(p));
    return change_case_1.snakeCase(`${fileDateString} ${existingBaseName}`) + path_1.extname(p);
}
exports.generateFileNameDated = generateFileNameDated;
function generateFileName(p) {
    const existingBaseName = path_1.basename(p, path_1.extname(p));
    return change_case_1.snakeCase(`${existingBaseName}`) + path_1.extname(p);
}
exports.generateFileName = generateFileName;

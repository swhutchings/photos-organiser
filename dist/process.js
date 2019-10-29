"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const monads_1 = require("@usefultools/monads");
const utils_1 = require("@usefultools/utils");
const change_case_1 = require("change-case");
const hasha_1 = __importDefault(require("hasha"));
const util_1 = require("./util");
const metadata_1 = require("./metadata");
const fs_extra_1 = require("fs-extra");
async function processFile(file, params) {
    const metadata = await metadata_1.getMetadata(file);
    const generatePathResult = await generatePath(file, params, metadata);
    if (generatePathResult.is_err()) {
        return monads_1.Err(generatePathResult.unwrap_err());
    }
    const generatedPath = generatePathResult.unwrap();
    if (generatedPath.isDuplicate) {
        if (params.duplicates.is_some()) {
            const dest = path_1.join(params.duplicates.unwrap(), generatedPath.directoryStructure, generatedPath.fileName);
            return await transferFile(file, dest, params);
        }
        else {
            return monads_1.Err(new Error("Duplicate File"));
        }
    }
    else {
        const dest = path_1.join(params.destinationDirectory, generatedPath.directoryStructure, generatedPath.fileName);
        return await transferFile(file, dest, params);
    }
}
exports.processFile = processFile;
async function generatePath(file, params, metadata) {
    const directoryStructure = generateFilePath(metadata);
    let counter = 0;
    while (true) {
        const fileName = generateFileName(file, metadata, counter);
        const proposedDestination = path_1.join(params.destinationDirectory, directoryStructure, fileName);
        if (!(await fs_extra_1.pathExists(proposedDestination))) {
            return monads_1.Ok({
                fileName: fileName,
                directoryStructure: directoryStructure,
                isDuplicate: false
            });
        }
        const res = await compareFileHash(file, proposedDestination);
        if (res.is_err()) {
            return monads_1.Err(res.unwrap_err());
        }
        if (res.unwrap()) {
            return monads_1.Ok({
                fileName: fileName,
                directoryStructure: directoryStructure,
                isDuplicate: true
            });
        }
        counter += 1;
    }
}
function generateFileName(path, metadata, count) {
    const date = metadata.dateTaken.toFormat("yyyy LL dd HH mm ss");
    return utils_1.match(count)({
        [0]: change_case_1.snakeCase(`${metadata.cameraModel} ${date}`) + path_1.extname(path),
        [utils_1._def]: change_case_1.snakeCase(`${metadata.cameraModel} ${date} ${util_1.numberPad(count, 3)}`) +
            path_1.extname(path)
    });
}
function generateFilePath(metadata) {
    return path_1.join(metadata.dateTaken.year.toString(), metadata.dateTaken.month.toString().padStart(2, "0"), metadata.dateTaken.day.toString().padStart(2, "0"), change_case_1.snakeCase(metadata.cameraModel));
}
async function compareFileHash(file1, file2) {
    try {
        const hash1 = await hasha_1.default.fromFile(file1);
        const hash2 = await hasha_1.default.fromFile(file2);
        return monads_1.Ok(hash1 === hash2);
    }
    catch (e) {
        return monads_1.Err(e);
    }
}
async function transferFile(src, dest, params) {
    try {
        if (params.mode === util_1.Mode.Move) {
            if (!params.dryRun) {
                await fs_extra_1.ensureDir(path_1.dirname(dest));
                await fs_extra_1.move(src, dest);
            }
            return monads_1.Ok(`Moved ${src} to ${dest}`);
        }
        else {
            if (!params.dryRun) {
                await fs_extra_1.ensureDir(path_1.dirname(dest));
                await fs_extra_1.copy(src, dest);
            }
            return monads_1.Ok(`Copied ${src} to ${dest}`);
        }
    }
    catch (error) {
        return monads_1.Err(error);
    }
}
// if (await pathExists(sortedPath)) {
//   if (program.duplicates) {
//     throw Error("Not Yet Implemented");
//   } else {
//     Logger.info(`Skipped ${p} (Duplicate)`);
//     return;
//   }
// } else if (program.dryRun) {
//   if (program.move) {
//     Logger.info(`Move ${p} to ${sortedPath}`);
//     return;
//     {
//       Logger.info(`Copy ${p} to ${sortedPath}`);
//       return;
//     }
//   }
//   if (program.move) {
//     await mkdirp(dirname(sortedPath));
//     await move(p, sortedPath);
//     Logger.info(`Moved ${p} to ${sortedPath}`);
//     return;
//   } else {
//     await mkdirp(dirname(sortedPath));
//     await copy(p, sortedPath);
//     Logger.info(`Copied ${p} to ${sortedPath}`);
//     return;
//   }
// }
// async () => {
//   const metadata = await getMetadata(p);
//   // Generate new filename
//   const newFilePath = generateFilePath(metadata);
//   const newFileName = generateFileName(p);
//   const sortedPath = join(destinationDirectory, newFilePath, newFileName);
//   return await ProcessFile();
// };

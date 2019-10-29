"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const monads_1 = require("@usefultools/monads");
const lodash_1 = require("lodash");
const path_1 = require("path");
const fs_1 = require("./fs");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const videoExtensions = require("video-extensions");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const imageExtensions = require("image-extensions");
async function toResultPromise(promise) {
    try {
        const data = await promise;
        return monads_1.Ok(data);
    }
    catch (err) {
        return monads_1.Err(err);
    }
}
exports.toResultPromise = toResultPromise;
async function toOptionPromise(promise) {
    try {
        const data = await promise;
        if (data == null || data === undefined) {
            return monads_1.None;
        }
        return monads_1.Some(data);
    }
    catch (err) {
        return monads_1.None;
    }
}
exports.toOptionPromise = toOptionPromise;
function toOption(val) {
    if (val == null || val === undefined) {
        return monads_1.None;
    }
    return monads_1.Some(val);
}
exports.toOption = toOption;
function extensions() {
    return lodash_1.union(imageExtensions, videoExtensions, ["dng"]);
}
exports.extensions = extensions;
var Mode;
(function (Mode) {
    Mode[Mode["Move"] = 0] = "Move";
    Mode[Mode["Copy"] = 1] = "Copy";
})(Mode = exports.Mode || (exports.Mode = {}));
async function parseProgramParameters(program) {
    try {
        const params = {
            sourceDirectory: (await fs_1.checkDirectoryExists(path_1.resolve(program.src))).unwrap(),
            destinationDirectory: (await fs_1.checkDirectoryExists(path_1.resolve(program.dest))).unwrap(),
            dryRun: !!program.dryRun,
            mode: program.move ? Mode.Move : Mode.Copy,
            duplicates: program.duplicates !== undefined
                ? monads_1.Some((await fs_1.checkDirectoryExists(path_1.resolve(program.duplicates))).unwrap())
                : monads_1.None
        };
        return monads_1.Ok(params);
    }
    catch (err) {
        return monads_1.Err(err);
    }
}
exports.parseProgramParameters = parseProgramParameters;
function numberPad(number, length) {
    let out = number.toString();
    while (out.length < length) {
        out = "0" + out;
    }
    return out;
}
exports.numberPad = numberPad;

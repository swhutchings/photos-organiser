import { extname, join, dirname } from "path";
import { Err, Ok, None, Option } from "@usefultools/monads";
import { match, _def } from "@usefultools/utils";
import { snakeCase, param } from "change-case";
import hasha from "hasha";
import { ResultPromise, ProgramParameters, numberPad, Mode } from "./util";
import { getMetadata, Metadata } from "./metadata";
import { pathExists, move, copy, ensureDir } from "fs-extra";

export async function processFile(
  file: string,
  params: ProgramParameters
): ResultPromise<string, Error> {
  try {
    const metadata = await getMetadata(file);

    const generatePathResult = await generatePath(file, params, metadata);
    if (generatePathResult.is_err()) {
      return Err(generatePathResult.unwrap_err());
    }

    const generatedPath = generatePathResult.unwrap();

    if (generatedPath.isDuplicate) {
      if (params.duplicates.is_some()) {
        const dest = join(
          params.duplicates.unwrap(),
          generatedPath.directoryStructure,
          generatedPath.fileName
        );
        return await transferFile(file, dest, params);
      } else {
        return Err(new Error("Duplicate File"));
      }
    } else {
      const dest = join(
        params.destinationDirectory,
        generatedPath.directoryStructure,
        generatedPath.fileName
      );
      return await transferFile(file, dest, params);
    }
  } catch (e) {
    return Err(e);
  }
}

interface GeneratedPath {
  fileName: string;
  directoryStructure: string;
  isDuplicate: boolean;
}

async function generatePath(
  file: string,
  params: ProgramParameters,
  metadata: Metadata
): ResultPromise<GeneratedPath, Error> {
  const directoryStructure = generateFilePath(metadata);

  let counter = 0;
  while (true) {
    const fileName = generateFileName(file, metadata, counter);
    const proposedDestination = join(
      params.destinationDirectory,
      directoryStructure,
      fileName
    );

    if (!(await pathExists(proposedDestination))) {
      return Ok({
        fileName: fileName,
        directoryStructure: directoryStructure,
        isDuplicate: false
      });
    }

    const res = await compareFileHash(file, proposedDestination);
    if (res.is_err()) {
      return Err(res.unwrap_err());
    }
    if (res.unwrap()) {
      return Ok({
        fileName: fileName,
        directoryStructure: directoryStructure,
        isDuplicate: true
      });
    }
    counter += 1;
  }
}

function generateFileName(
  path: string,
  metadata: Metadata,
  count: number
): string {
  const date = metadata.dateTaken.toFormat("yyyy LL dd HH mm ss");
  return match(count)({
    [0]: snakeCase(`${metadata.cameraModel} ${date}`) + extname(path),
    [_def]:
      snakeCase(`${metadata.cameraModel} ${date} ${numberPad(count, 3)}`) +
      extname(path)
  });
}

function generateFilePath(metadata: Metadata): string {
  return join(
    metadata.dateTaken.year.toString(),
    metadata.dateTaken.month.toString().padStart(2, "0"),
    metadata.dateTaken.day.toString().padStart(2, "0"),
    snakeCase(metadata.cameraModel)
  );
}

async function compareFileHash(
  file1: string,
  file2: string
): ResultPromise<boolean, Error> {
  try {
    const hash1 = await hasha.fromFile(file1);
    const hash2 = await hasha.fromFile(file2);
    return Ok(hash1 === hash2);
  } catch (e) {
    return Err(e);
  }
}

async function transferFile(
  src: string,
  dest: string,
  params: ProgramParameters
): ResultPromise<string, Error> {
  try {
    if (params.mode === Mode.Move) {
      if (!params.dryRun) {
        await ensureDir(dirname(dest));
        await move(src, dest);
      }
      return Ok(`Moved ${src} to ${dest}`);
    } else {
      if (!params.dryRun) {
        await ensureDir(dirname(dest));
        await copy(src, dest);
      }
      return Ok(`Copied ${src} to ${dest}`);
    }
  } catch (error) {
    return Err(error);
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

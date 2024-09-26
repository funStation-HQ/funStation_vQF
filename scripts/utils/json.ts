// Utilities related with json files.

import fs from "fs";

/**
 * Reads and parses a json file.
 * 
 * @param file The path to the file considering the current repository as root.
 * @returns An object with the data from the json file.
 */
export function loadJsonFile (
    file: string
): object {
    const appRoot = require("app-root-path");
    try {
        const data = fs.readFileSync(
            `${appRoot}${file[0] === "/" ? file : "/" + file}`
        );
        return JSON.parse(data as any);
    } catch (err) {
        throw Error(`loadJsonFile: ${err}`);
    }
}

/**
 * Exports an object to a json file.
 * 
 * @param data The object to be exported
 * @param path The path to the file considering the current repository as root.
 * @param mode If either to append or write a clean file.
 *  Use `a` for append and `w` for write. Defaults to `w`.
 */
export function writeJsonFile (
    data: object,
    path: string,
    mode?: string
) {
    try {
        const appRoot = require("app-root-path");
        let prevData: object;
        let resolvedMode = mode === undefined ? "w" : mode;

        if (resolvedMode === "a") {
            prevData = loadJsonFile(path);
        } else if (resolvedMode === "w") {
            prevData = {}
        } else {
            throw Error(`Invalid mode: ${resolvedMode}`);
        }

        const outputData = JSON.stringify(
            { ...prevData, ...data },
            null,
            2
        );
        
        const outputPath = `${appRoot}${path[0] === "/" ? path : "/" + path}`;
        fs.writeFileSync(outputPath, outputData);
        console.log(`File written to: ${outputPath}`);
    } catch (err) {
        throw Error(`writeJsonFile: ${err}`);
    }
}

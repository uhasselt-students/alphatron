import * as fs from 'fs';
import * as path from 'path';

/**
 * Typical callback interface with room for an error and a result of any type.
 */
interface Callback<T> {
    (err: NodeJS.ErrnoException, result: T): void;
}

/**
 * Shorthand for a set of Node modules.
 */
type Modules = Set<NodeModule>;

/**
 * Requires all JS files in the given directory (non-recursive).
 * @param dir Directory to search for files to require.
 * @param callback Function that is passed the resulting set of modules.
 */
export function reqDir(dir: string, callback: Callback<Modules>): void {
    fs.readdir(dir, (err, files) => {
        if (err) {
            callback(err, null);
            return;
        }

        files.forEach((o, i, a) => { a[i] = path.join(dir, o) })

        reqFiles(files, callback);
    });
}

/**
 * Requires all JS files in the given list.
 * @param files List to search for files to require.
 * @param callback Function that is passed the resulting set of modules.
 */
export function reqFiles(files: string[], callback: Callback<Modules>): void {
    const modules: Set<NodeModule> = new Set();
    let numFilesLeft: number = files.length;

    files.forEach((file) => {
        reqFile(file, (err, mod) => {
            numFilesLeft--;

            if (err) { throw err; }
            if (!mod) { return; }

            modules.add(mod);

            if (numFilesLeft === 0) {
                callback(null, modules);
            }
        });
    });
}

/**
 * Requires the given file if it is a JS file.
 * @param file Path to the file to conditionally require.
 * @param callback Function to which the required Node module is passed, or
 * null if the file is not a JS file.
 */
export function reqFile(file: string, callback: Callback<NodeModule>): void {
    if (path.extname(file).toUpperCase() !== '.JS') {
        callback(null, null);
        return;
    }

    fs.stat(file, (err, stats) => {
        if (err || !stats.isFile()) { callback(err, null); }

        try { callback(null, require(file)); }
        catch (err) { callback(err, null); }
    });
}

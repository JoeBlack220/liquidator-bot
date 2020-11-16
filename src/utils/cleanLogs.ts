/**
 * Delete all the files in log/
 */
import fsExtra from 'fs-extra';

fsExtra.emptyDirSync("./logs");

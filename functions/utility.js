// Admin num:     P2205711
// Name:          Reuben Goh
// Class:         DISM2A03

// utility functions stored here

const path = require("path");
const fs = require ("fs");
utilities = {};
// functions

/**
 * function to validate an object to check that all object keys exists in specified parameters
 * @param {Array} requiredParam array containing all the required parameters that must be present in object
 * @param {Object} bodyObj object to check requiredParam of
 * @returns {Boolean} true or false depending on if object is valid
 */
utilities.validateReqBody = (requiredParam, bodyObj) => {
  // if extra parameter
  if (requiredParam.length != Object.keys(bodyObj).length) {
    return false
  }
  // Iterate over each required parameter
  for (const key of requiredParam) {
    // missing parameter
    if (!(key in bodyObj)) {
      return false;
    }
    
    else {
      const value = String(bodyObj[key]);
      // Check if the value is empty or undefined
      if (!value || value.trim().length === 0) { // .trim to remove any spaces incase user enters "  "
        return false;
      }
    }
  }
  return true;
}

/**
 * function to check file extensions based on allowed file extensions provided
 * @param {String} file file to check for extension of
 * @param {*} callback returns either (null, true), when file extension fits allowed extensions defined in the function, 
 * OR {message: "Image Only"} if extension does not fit allowed extensions
 * @param {RegExp} fileTypes regex of allowed file extensions
 * @returns 
 */
utilities.checkFileType = (file, callback, fileTypes) => {
  const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
  // check mimetype in the case of renaming file extension even if it is not img
  const mimeType = fileTypes.test(file.mimetype);

  if (extName && mimeType) {
    return callback(null, true);
  }

  else {
    return callback({message: "Image only"});
  }
}

/**
 * function to log any unexpected server side errors to file path specified inside the function
 * @param {Error} error objects storing the error that had occured
 * @param {String} errorAt string of where the error occured at depending on API (e.g. "Getting_all_games")
 */
utilities.logErrors = (error, errorAt) => {
  const errorLogPath = `${__dirname}\\..\\logs\\errorLogs.json`;
  const timeStamp = errorAt + "-" + Date.now();

  errorLogEntry = {
    timeStamp,
    error_string: String(error),
    error_obj: error
  }

  let errorLog = [];
  // check if there are any existing logs;
  if (fs.existsSync(errorLogPath)) {
    const existingLogData = fs.readFileSync(errorLogPath, "utf-8");
    errorLog = JSON.parse(existingLogData);
  }

  // append error to log array
  errorLog.push(errorLogEntry);

  // write new error array into file
  fs.writeFileSync(errorLogPath, JSON.stringify(errorLog, null, 2));
}



module.exports = utilities;
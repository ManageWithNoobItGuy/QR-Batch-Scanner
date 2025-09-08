// This file handles the server-side logic for the QR code scanner.

/**
 * Serves the index.html file as a web application.
 * @return {HtmlOutput} The HTML output of the web page.
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index.html')
    .setTitle('QR Code Scanner')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Appends scanned data to a specific Google Sheet and looks up related information.
 * @param {string} scannedData The data scanned from the QR code.
 * @param {string} userName The name of the user who scanned the code.
 * @return {object} An object containing a status message, the scanned data, and lookup results.
 */
function saveData(scannedData, userName) {
  const SPREADSHEET_ID = '1EBu_H_Dda_ACzj26hTZEOtI6-qbxuLwlqVoB_3lqLdw';
  const RECORD_SHEET_NAME = 'บันทึกเบิก';
  const LOOKUP_SHEET_NAME = 'AvailableLot';

  try {
    Logger.log('เริ่มการทำงาน saveData สำหรับ QR code: ' + scannedData);
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // 1. Look up the QR Code ID in the "AvailableLot" sheet first
    const lookupSheet = spreadsheet.getSheetByName(LOOKUP_SHEET_NAME);
    if (!lookupSheet) {
      throw new Error(`ไม่พบชีทชื่อ "${LOOKUP_SHEET_NAME}"`);
    }

    const lastRow = lookupSheet.getLastRow();
    let foundData = null;
    Logger.log('จำนวนแถวในชีท AvailableLot: ' + lastRow);
    
    if (lastRow > 0) {
      const range = lookupSheet.getRange(1, 1, lastRow, 4); // Get data from A to D
      const values = range.getValues();
      
      for (let i = 0; i < values.length; i++) {
        const rowId = values[i][0]; // Column A
        if (rowId.toString() === scannedData.toString()) {
          foundData = {
            columnC: values[i][2], // Column C
            columnD: values[i][3]  // Column D
          };
          Logger.log('พบข้อมูลที่ตรงกันในแถวที่ ' + (i + 1));
          break; // Stop loop once a match is found
        }
      }
    }

    // 2. If data is found, proceed with recording it to the "บันทึกเบิก" sheet
    if (foundData) {
      Logger.log('พบข้อมูลใน AvailableLot กำลังดำเนินการบันทึก...');
      const recordSheet = spreadsheet.getSheetByName(RECORD_SHEET_NAME);
      if (!recordSheet) {
        throw new Error(`ไม่พบชีทชื่อ "${RECORD_SHEET_NAME}"`);
      }
      const timestamp = new Date();
      const today = Utilities.formatDate(timestamp, spreadsheet.getSpreadsheetTimeZone(), 'yyyy-MM-dd');
      recordSheet.appendRow([timestamp, scannedData, today, userName]);
      Logger.log('บันทึกข้อมูลเรียบร้อยแล้ว');

      // Return an object with all the results
      return {
        message: 'บันทึกข้อมูลเรียบร้อยแล้ว!',
        data: scannedData,
        foundData: foundData
      };
    } else {
      // If data is not found, do not record and inform the user
      Logger.log('ไม่พบข้อมูลใน AvailableLot');
      return {
        message: 'ไม่พบข้อมูลใน AvailableLot! ไม่มีการบันทึก.',
        data: scannedData,
        foundData: null
      };
    }

  } catch (e) {
    Logger.log('เกิดข้อผิดพลาดในการทำงาน: ' + e.message);
    throw new Error('เกิดข้อผิดพลาด: ' + e.message);
  }
}

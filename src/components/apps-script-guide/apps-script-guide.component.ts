import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-apps-script-guide',
  templateUrl: './apps-script-guide.component.html',
  styleUrl: './apps-script-guide.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class AppsScriptGuideComponent {
  copyButtonText = signal('Copy Code');

  // Full Google Apps Script code
  readonly appsScriptCode = `
// --- CONFIGURATION ---
// IMPORTANT: Set a strong, unique secret token here. This token must match the one in the Angular app's settings.
const SECRET_TOKEN = "YOUR_SECRET_TOKEN_HERE"; 

// --- SPREADSHEET & SHEET SETUP ---
const SPREADSHEET_ID = "<YOUR_SPREADSHEET_ID>"; // Will be auto-detected if left empty
const ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();

const JOB_QUEUE_SHEET_NAME = "JOB_QUEUE";
const TASK_LIST_SHEET_NAME = "TASK_LIST";
const USER_CREDENTIALS_SHEET_NAME = "USER_CREDENTIALS";

/**
 * Main entry point for all requests from the Angular application.
 * Handles POST requests, validates security, and routes actions.
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    
    // Security Check: Validate the secret token
    if (payload.appToken !== SECRET_TOKEN) {
      return createJsonResponse({ result: 'error', error: 'Invalid security token.' });
    }

    // Route the request based on the specified action and data type
    switch (payload.action) {
      case 'getData':
        return handleGetData(payload.dataType);
      default:
        return handleDataModification(payload.dataType, payload.data);
    }

  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return createJsonResponse({ result: 'error', error: 'An unexpected server error occurred: ' + error.toString() });
  }
}

/**
 * Handles all data retrieval requests.
 */
function handleGetData(dataType) {
  try {
    let sheet;
    switch (dataType) {
      case 'JOB_QUEUE':
        sheet = getOrCreateSheet(JOB_QUEUE_SHEET_NAME, ['id', 'orderNo', 'orderToken', 'customerName', 'contactNo', 'jobDescription', 'jobUrgency', 'quantity', 'unitPrice', 'totalAmount', 'advanceAmount', 'status', 'paymentStatus', 'assignedToUserId', 'createdAt', 'completedAt']);
        break;
      case 'TASK_LIST':
        sheet = getOrCreateSheet(TASK_LIST_SHEET_NAME, ['id', 'description', 'assignedToUserId', 'dueDate', 'status', 'priority', 'createdAt']);
        break;
      case 'USER_CREDENTIALS':
        sheet = getOrCreateSheet(USER_CREDENTIALS_SHEET_NAME, ['id', 'name', 'role', 'password']);
        break;
      default:
        return createJsonResponse({ result: 'error', error: 'Invalid data type for getData.' });
    }
    const data = sheetToJson(sheet);
    return createJsonResponse({ result: 'success', data: data });
  } catch (error) {
    Logger.log('Error in handleGetData: ' + error.toString());
    return createJsonResponse({ result: 'error', error: 'Failed to retrieve data: ' + error.toString() });
  }
}

/**
 * Handles all data modification requests (ADD, UPDATE, DELETE).
 */
function handleDataModification(dataType, data) {
  try {
    const action = dataType.split('_')[0]; // e.g., 'ADD' from 'ADD_ORDER'
    const entity = dataType.split('_').slice(1).join('_'); // e.g., 'ORDER' from 'ADD_ORDER'

    let sheet;
    let headers;

    switch (entity) {
      case 'ORDER':
        headers = ['id', 'orderNo', 'orderToken', 'customerName', 'contactNo', 'jobDescription', 'jobUrgency', 'quantity', 'unitPrice', 'totalAmount', 'advanceAmount', 'status', 'paymentStatus', 'assignedToUserId', 'createdAt', 'completedAt'];
        sheet = getOrCreateSheet(JOB_QUEUE_SHEET_NAME, headers);
        break;
      case 'TASK':
         headers = ['id', 'description', 'assignedToUserId', 'dueDate', 'status', 'priority', 'createdAt'];
        sheet = getOrCreateSheet(TASK_LIST_SHEET_NAME, headers);
        break;
      case 'USER':
        headers = ['id', 'name', 'role', 'password'];
        sheet = getOrCreateSheet(USER_CREDENTIALS_SHEET_NAME, headers);
        break;
      default:
        return createJsonResponse({ result: 'error', error: 'Invalid entity type for modification.' });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(15000); // Wait up to 15 seconds for lock

    try {
      switch (action) {
        case 'ADD':
          const newId = Utilities.getUuid();
          const creationDate = new Date().toISOString();
          const newRow = { ...data, id: newId, createdAt: creationDate };
          const rowData = headers.map(header => newRow[header] !== undefined ? newRow[header] : "");
          sheet.appendRow(rowData);
          break;
        case 'UPDATE':
          updateRow(sheet, data, headers);
          break;
        case 'DELETE':
          deleteRow(sheet, data.id);
          break;
        default:
           return createJsonResponse({ result: 'error', error: 'Invalid action type.' });
      }
    } finally {
      lock.releaseLock();
    }
    
    return createJsonResponse({ result: 'success' });

  } catch (error) {
    Logger.log('Error in handleDataModification: ' + error.toString());
    return createJsonResponse({ result: 'error', error: 'Failed to modify data: ' + error.toString() });
  }
}

// --- UTILITY FUNCTIONS ---

/**
 * Creates a standard JSON response for the client.
 */
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Retrieves a sheet by name, or creates it with specified headers if it doesn't exist.
 */
function getOrCreateSheet(sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  }
  return sheet;
}

/**
 * Converts a Google Sheet's data into an array of JSON objects.
 */
function sheetToJson(sheet) {
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  return data.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      // Handle dates specifically to maintain ISO string format
      if ((header.toLowerCase().includes('date') || header.toLowerCase().includes('at')) && row[index] instanceof Date) {
        obj[header] = row[index].toISOString();
      } else {
        obj[header] = row[index];
      }
    });
    return obj;
  });
}

/**
 * Updates a specific row in a sheet based on its ID.
 */
function updateRow(sheet, rowData, headers) {
  const data = sheet.getDataRange().getValues();
  const idColIndex = data[0].indexOf('id');
  const rowIndex = data.findIndex(row => row[idColIndex] === rowData.id);

  if (rowIndex > 0) { // rowIndex > 0 to skip header
    const newRow = headers.map(header => rowData[header] !== undefined ? rowData[header] : "");
    sheet.getRange(rowIndex + 1, 1, 1, newRow.length).setValues([newRow]);
  } else {
    throw new Error("Row with ID " + rowData.id + " not found for update.");
  }
}

/**
 * Deletes a specific row in a sheet based on its ID.
 */
function deleteRow(sheet, id) {
  const data = sheet.getDataRange().getValues();
  const idColIndex = data[0].indexOf('id');
  const rowIndex = data.findIndex(row => row[idColIndex] === id);
  
  if (rowIndex > 0) { // rowIndex > 0 to skip header
    sheet.deleteRow(rowIndex + 1);
  } else {
    throw new Error("Row with ID " + id + " not found for deletion.");
  }
}
  `;

  async copyScript(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.appsScriptCode.trim());
      this.copyButtonText.set('Copied!');
      setTimeout(() => this.copyButtonText.set('Copy Code'), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      this.copyButtonText.set('Failed to copy');
    }
  }
}

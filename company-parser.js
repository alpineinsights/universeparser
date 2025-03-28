/**
 * Company CSV to COMPANY_DATA Converter (First ISIN Only)
 * 
 * This script processes 'companies 16.csv' and creates a JavaScript file
 * with a COMPANY_DATA array of objects containing ISIN and Name properties,
 * sorted alphabetically by company name.
 * 
 * If multiple ISINs are present (separated by pipe characters),
 * only the first ISIN is used.
 * 
 * To run in cursor.ai:
 * 1. Make sure 'companies 16.csv' is in the current directory
 * 2. Run this script with Node.js: node company-parser.js
 * 3. The output will be saved as 'COMPANY_DATA.js'
 */

const fs = require('fs');
const path = require('path');

// File paths
const inputFile = 'companies 16.csv';
const outputFile = 'COMPANY_DATA.js';

// Read the CSV file
try {
  console.log(`Reading ${inputFile}...`);
  const csvContent = fs.readFileSync(inputFile, 'utf8');
  
  // Parse the CSV and extract the company data
  const { companyData, count } = processCSV(csvContent);
  
  // Generate the output JavaScript code
  const jsContent = `COMPANY_DATA = ${JSON.stringify(companyData, null, 2)}\n`;
  
  // Write to output file
  fs.writeFileSync(outputFile, jsContent);
  
  console.log(`Successfully processed ${count} companies`);
  console.log(`Output saved to ${outputFile}`);
  
} catch (error) {
  console.error(`Error: ${error.message}`);
  if (error.code === 'ENOENT') {
    console.error(`File "${inputFile}" not found. Make sure it's in the current directory.`);
  }
}

/**
 * Process the CSV content and extract company data
 */
function processCSV(csvContent) {
  // Split into lines and filter out empty lines
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }
  
  // Parse headers from the first line
  const headers = parseCSVLine(lines[0]);
  
  // Find the indices of ISIN and Name columns
  const isinIndex = headers.findIndex(h => h === 'ISIN');
  const nameIndex = headers.findIndex(h => h === 'Name');
  
  if (isinIndex === -1 || nameIndex === -1) {
    throw new Error('CSV must contain "ISIN" and "Name" columns');
  }
  
  // Process each data row
  let companyData = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    
    // Only include if we have a valid ISIN
    if (values[isinIndex]) {
      // Extract only the first ISIN if multiple ISINs are separated by pipe
      const firstIsin = values[isinIndex].split('|')[0].trim();
      
      companyData.push({
        ISIN: firstIsin,
        Name: values[nameIndex]
      });
    }
  }
  
  // Sort by company name
  companyData.sort((a, b) => a.Name.localeCompare(b.Name));
  
  return { 
    companyData,
    count: companyData.length
  };
}

/**
 * Parse a single CSV line into an array of values
 * Handles quoted fields and commas within fields
 */
function parseCSVLine(line) {
  const values = [];
  let currentValue = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // Check if this is an escaped quote
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        currentValue += '"';
        i++; // Skip the next quote
      } else {
        inQuotes = !inQuotes;
      }
    } 
    else if (char === ',' && !inQuotes) {
      values.push(currentValue);
      currentValue = '';
    } 
    else {
      currentValue += char;
    }
  }
  
  // Add the last value
  values.push(currentValue);
  
  return values;
}
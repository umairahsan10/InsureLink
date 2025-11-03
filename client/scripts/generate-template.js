const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Create workbook
const wb = XLSX.utils.book_new();

// Create worksheet with headers
const headers = [
  'Employee Number',
  'Full Name',
  'Email',
  'Mobile',
  'CNIC',
  'Plan ID',
  'Designation',
  'Department',
  'Coverage Start Date',
  'Coverage End Date'
];

const ws = XLSX.utils.aoa_to_sheet([headers]);

// Set column widths for better readability
ws['!cols'] = [
  { wch: 15 }, // Employee Number
  { wch: 20 }, // Full Name
  { wch: 25 }, // Email
  { wch: 15 }, // Mobile
  { wch: 18 }, // CNIC
  { wch: 15 }, // Plan ID
  { wch: 18 }, // Designation
  { wch: 15 }, // Department
  { wch: 18 }, // Coverage Start Date
  { wch: 18 }, // Coverage End Date
];

XLSX.utils.book_append_sheet(wb, ws, 'Employees');

// Ensure templates directory exists
const templatesDir = path.join(__dirname, '../public/templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// Write file
const outputPath = path.join(templatesDir, 'employee-import-template.xlsx');
XLSX.writeFile(wb, outputPath);

console.log('Excel template generated successfully at:', outputPath);


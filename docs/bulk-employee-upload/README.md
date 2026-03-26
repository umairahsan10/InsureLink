# Bulk Employee Upload - Test Data Guide

This folder contains sample test data files for the Bulk Employee Upload feature in InsureLink.

## Files Included

### 1. **employee-import-sample.csv**
CSV format employee data with 10 sample employees for testing bulk uploads.

### 2. **employee-import-sample.xlsx**
Excel format employee data with the same 10 sample employees with formatting.

### 3. **create_excel.py**
Python script that generates the Excel file from the sample data (for reference or regeneration).

## How to Test

### Step 1: Access Bulk Upload Feature
1. Navigate to the Corporate Dashboard
2. Go to **Employees** → **Bulk Upload Employees** button
3. A modal popup will appear with options to download templates

### Step 2: Upload Test Data
1. In the "Bulk Upload Employees" modal:
   - Click "CSV Template" or "Excel Template" to download the official templates
   - Or directly use the pre-filled sample files:
     - **employee-import-sample.csv** (for CSV testing)
     - **employee-import-sample.xlsx** (for Excel testing)

2. Select either CSV or Excel file in the modal
3. Click "Upload" button

### Step 3: Review Results
After upload, you'll see:
- **Valid employees count**: Successfully imported employees
- **Invalid employees count**: Employees with validation errors
- Invalid employees can be reviewed and corrected in the "Invalid Employees" tab

## Sample Data Overview

The test files contain 10 employees with the following information:

| Employee # | Name | Email | Phone | Designation | Department | Plan ID |
|--|--|--|--|--|--|--|
| EMP001 | Ahmed Khan | ahmed.khan@company.com | +92-300-1234567 | Senior Developer | Engineering | plan-001 |
| EMP002 | Fatima Ali | fatima.ali@company.com | 03211234567 | Project Manager | Engineering | plan-001 |
| EMP003 | Hassan Ahmed | hassan.ahmed@company.com | +92-300-2345678 | Full Stack Developer | Engineering | plan-002 |
| EMP004 | Ayesha Hassan | ayesha.hassan@company.com | 03121234568 | Accountant | Finance | plan-001 |
| EMP005 | Ali Raza | ali.raza@company.com | +92-300-3456789 | HR Manager | People | plan-003 |
| EMP006 | Zainab Mohammad | zainab.mohammad@company.com | 03001234569 | Sales Executive | Sales | plan-002 |
| EMP007 | Muhammad Hasan | muhammad.hasan@company.com | +92-300-4567890 | IT Support | IT | plan-001 |
| EMP008 | Nida Khan | nida.khan@company.com | 03211234570 | UI/UX Designer | Design | plan-002 |
| EMP009 | Omar Ali | omar.ali@company.com | +92-300-5678901 | Logistics Coordinator | Logistics | plan-001 |
| EMP010 | Samina Hassan | samina.hassan@company.com | 03121234571 | Production Manager | Production | plan-003 |

## File Format Requirements

Both CSV and Excel formats require the following columns:

### Required Fields:
- `employeeNumber` - Unique employee identifier (e.g., EMP001)
- `firstName` - Employee's first name
- `email` - Valid email address
- `phone` - Phone number (supports various formats like +92-300-XXXXXXX or 03XX-XXXXXXX)
- `password` - Initial password for the employee account
- `designation` - Job title
- `department` - Department/team name
- `planId` - Insurance plan identifier
- `coverageStartDate` - Start date in YYYY-MM-DD format
- `coverageEndDate` - End date in YYYY-MM-DD format

### Optional Fields:
- `lastName` - Employee's last name
- `cnic` - CNIC number (Pakistan ID)
- `dob` - Date of birth in YYYY-MM-DD format

## Testing Scenarios

### Valid Upload (All 10 employees)
- Upload either sample file
- Expected result: All 10 employees should be valid and imported
- Employees will appear in the employee list

### Partial Upload Testing
You can manually edit the sample files to create validation errors:
1. Remove required fields to trigger validation errors
2. Use invalid email formats
3. Use invalid date formats
4. Use invalid phone number formats
5. Reference non-existent plan IDs

### Format Testing
- **CSV Format**: Test comma-separated values
- **Excel Format**: Test .xlsx with formatted headers
- Both formats should produce identical results

## Password Requirements

All sample passwords follow security requirements:
- Minimum 8 characters
- Contains uppercase letters
- Contains numbers
- Contains special characters (! or similar)

Feel free to change passwords to something more recognizable for testing.

## Notes

- All data is sample data for testing purposes only
- CNICs and email addresses are fictional
- Phone numbers use realistic Pakistan phone formats
- Coverage dates are set for 2026-2027 to ensure future validity
- The plan IDs (plan-001, plan-002, plan-003) should match existing plans in your system

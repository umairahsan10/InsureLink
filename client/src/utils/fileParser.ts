import * as XLSX from 'xlsx';

/**
 * Parse Excel (.xlsx, .xls) or CSV file into a 2D string array
 * @param file - The file to parse
 * @returns Promise resolving to string[][] where first row is headers and subsequent rows are data
 */
export async function parseFile(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !['xlsx', 'xls', 'csv'].includes(fileExtension)) {
      reject(new Error('Invalid file type. Please upload .xlsx, .xls, or .csv file.'));
      return;
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      reject(new Error('File size exceeds 10MB limit. Please upload a smaller file.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Failed to read file.'));
          return;
        }

        // Parse the file using xlsx
        // Use appropriate type based on source
        const workbook = XLSX.read(
          data as ArrayBuffer | string,
          {
            // For CSV we read as text; for Excel we read as array buffer
            type: fileExtension === 'csv' ? 'string' : 'array',
            raw: false,
          }
        );
        
        // Get the first sheet (most common use case)
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        if (!worksheet) {
          reject(new Error('File appears to be empty or invalid.'));
          return;
        }

        // Convert to JSON array with headers as first row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1, // Use array format (first row is headers, subsequent rows are data)
          defval: '', // Default value for empty cells
          raw: false, // Convert dates and numbers to strings
        }) as string[][];

        // Filter out completely empty rows
        const nonEmptyRows = jsonData.filter(row => 
          row.some(cell => cell && cell.toString().trim() !== '')
        );

        if (nonEmptyRows.length === 0) {
          reject(new Error('File appears to be empty. Please ensure your file has data.'));
          return;
        }

        resolve(nonEmptyRows);
      } catch (error) {
        reject(new Error(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file.'));
    };

    // Read file as array buffer for Excel files, or text for CSV
    if (fileExtension === 'csv') {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
}


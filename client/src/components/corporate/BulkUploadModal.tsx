'use client';

import { useState, useRef, useEffect } from 'react';
import { parseFile } from '@/utils/fileParser';
import { mapHeaders, createManualColumnMap, getFieldDisplayName, ColumnMap, getRowValue } from '@/utils/columnMapper';
import { validateEmployeeRow, parseEmployeeRow, ParsedEmployee, toEmployee, ValidationResult } from '@/utils/employeeValidator';
import { Employee } from '@/types/employee';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (validEmployees: Employee[], invalidEmployees: Employee[]) => void;
  existingEmployees: Employee[];
}

interface RowValidation {
  rowIndex: number;
  employee: ParsedEmployee;
  validation: ValidationResult;
}

export default function BulkUploadModal({
  isOpen,
  onClose,
  onImport,
  existingEmployees,
}: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<ColumnMap | null>(null);
  const [mappingResult, setMappingResult] = useState<ReturnType<typeof mapHeaders> | null>(null);
  const [manualMapping, setManualMapping] = useState<Partial<Record<keyof ColumnMap, number>>>({});
  const [showManualMapping, setShowManualMapping] = useState(false);
  const [validatedRows, setValidatedRows] = useState<RowValidation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved mapping from localStorage
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('bulk-upload-column-map');
      if (saved) {
        try {
          setManualMapping(JSON.parse(saved));
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setParsedData([]);
      setHeaders([]);
      setColumnMap(null);
      setMappingResult(null);
      setManualMapping({});
      setShowManualMapping(false);
      setValidatedRows([]);
      setError(null);
    }
  }, [isOpen]);

  const handleFileSelect = async (selectedFile: File) => {
    setError(null);
    setIsProcessing(true);

    try {
      const data = await parseFile(selectedFile);
      
      if (data.length === 0) {
        throw new Error('File appears to be empty');
      }

      // First row should be headers
      const fileHeaders = data[0];
      const dataRows = data.slice(1);

      if (dataRows.length === 0) {
        throw new Error('File contains only headers. Please add data rows.');
      }

      setFile(selectedFile);
      setParsedData(dataRows);
      setHeaders(fileHeaders);

      // Auto-map headers
      const result = mapHeaders(fileHeaders);
      setMappingResult(result);

      // If all required fields are mapped, use auto-mapping
      if (result.unmappedRequired.length === 0) {
        setColumnMap(result.columnMap);
        setShowManualMapping(false);
        // Auto-validate
        validateAllRows(result.columnMap, dataRows);
      } else {
        // Need manual mapping
        setShowManualMapping(true);
        // Apply saved mapping if available
        const saved = localStorage.getItem('bulk-upload-column-map');
        if (saved) {
          try {
            const savedMapping = JSON.parse(saved);
            const manualMap = createManualColumnMap(fileHeaders, savedMapping);
            setColumnMap(manualMap);
            validateAllRows(manualMap, dataRows);
          } catch {
            // Ignore
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualMappingChange = (field: keyof ColumnMap, columnIndex: number) => {
    const newMapping = { ...manualMapping, [field]: columnIndex };
    setManualMapping(newMapping);
    
    // Save to localStorage
    localStorage.setItem('bulk-upload-column-map', JSON.stringify(newMapping));

    // Update column map
    const newColumnMap = createManualColumnMap(headers, newMapping);
    setColumnMap(newColumnMap);

    // Re-validate
    validateAllRows(newColumnMap, parsedData);
  };

  const validateAllRows = (map: ColumnMap, rows: string[][]) => {
    const validations: RowValidation[] = [];
    const importBatchEmployees: ParsedEmployee[] = [];

    // First pass: parse all employees
    rows.forEach((row, index) => {
      const employee = parseEmployeeRow(row, map);
      importBatchEmployees.push(employee);
    });

    // Second pass: validate with duplicate detection
    rows.forEach((row, index) => {
      const validation = validateEmployeeRow(
        row,
        map,
        existingEmployees,
        importBatchEmployees
      );
      validations.push({
        rowIndex: index + 2, // +2 because row 1 is header, data starts at row 2
        employee: importBatchEmployees[index],
        validation,
      });
    });

    setValidatedRows(validations);
  };

  const handleImport = () => {
    if (!columnMap) return;

    const validEmployees: Employee[] = [];
    const invalidEmployees: Employee[] = [];

    validatedRows.forEach((rowValidation, index) => {
      const employee = toEmployee(rowValidation.employee, 'corp-001', index);
      
      if (rowValidation.validation.valid) {
        validEmployees.push(employee);
      } else {
        employee.importStatus = 'invalid';
        employee.importErrors = rowValidation.validation.errors;
        invalidEmployees.push(employee);
      }
    });

    onImport(validEmployees, invalidEmployees);
    onClose();
  };

  const validCount = validatedRows.filter(r => r.validation.valid).length;
  const invalidCount = validatedRows.filter(r => !r.validation.valid).length;
  const canImport = validCount > 0 && columnMap !== null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gray-100 px-6 py-4 border-b border-gray-300 sticky top-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Bulk Employee Upload</h2>
              <p className="text-sm text-gray-600 mt-1">
                Upload Excel or CSV file with employee data. Columns can be in any order.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Download Templates */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 mb-2">Download Templates:</p>
            <div className="flex gap-3">
              <a
                href="/templates/employee-import-template.xlsx"
                download
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Excel Template
              </a>
              <a
                href="/templates/employee-import-template.csv"
                download
                className="inline-flex items-center px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                CSV Template
              </a>
            </div>
          </div>

          {/* File Upload */}
          {!file && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) {
                    handleFileSelect(selectedFile);
                  }
                }}
                className="hidden"
              />
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-sm text-gray-600 mb-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Click to upload
                </button>
                {' '}or drag and drop
              </p>
              <p className="text-xs text-gray-500">Excel (.xlsx, .xls) or CSV files up to 10MB</p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600 mt-2">Processing file...</p>
            </div>
          )}

          {/* Column Mapping UI */}
          {showManualMapping && columnMap && headers.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm font-medium text-yellow-900 mb-3">
                Some columns could not be auto-detected. Please map them manually:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mappingResult?.unmappedRequired.map((field) => (
                  <div key={field} className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 w-32">
                      {getFieldDisplayName(field as keyof ColumnMap)} *
                    </label>
                    <select
                      value={columnMap[field as keyof ColumnMap] ?? ''}
                      onChange={(e) => {
                        const index = e.target.value ? parseInt(e.target.value) : -1;
                        if (index >= 0) {
                          handleManualMappingChange(field as keyof ColumnMap, index);
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Select a column...</option>
                      {headers.map((header, index) => (
                        <option key={index} value={index}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              
              {/* Optional fields (collapsed by default) */}
              {mappingResult?.unmappedOptional && mappingResult.unmappedOptional.length > 0 && (
                <details className="mt-4">
                  <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                    Advanced (Optional Fields)
                  </summary>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    {mappingResult.unmappedOptional.map((field) => (
                      <div key={field} className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 w-32">
                          {getFieldDisplayName(field as keyof ColumnMap)}
                        </label>
                        <select
                          value={columnMap[field as keyof ColumnMap] ?? ''}
                          onChange={(e) => {
                            const index = e.target.value ? parseInt(e.target.value) : -1;
                            if (index >= 0) {
                              handleManualMappingChange(field as keyof ColumnMap, index);
                            }
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="">(Optional)</option>
                          {headers.map((header, index) => (
                            <option key={index} value={index}>
                              {header}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {mappingResult && mappingResult.unmappedRequired.length === 0 && (
                <p className="text-xs text-green-700 mt-2">✓ All required columns mapped</p>
              )}
            </div>
          )}

          {/* Detected Columns Summary */}
          {columnMap && !showManualMapping && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-medium text-green-900 mb-2">✓ All columns auto-detected:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {Object.entries(columnMap).map(([field, index]) => {
                  if (index !== null && index < headers.length) {
                    return (
                      <div key={field} className="text-gray-700">
                        <span className="font-medium">{getFieldDisplayName(field as keyof ColumnMap)}:</span>{' '}
                        <span className="text-gray-600">{headers[index]}</span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}

          {/* Preview Table */}
          {validatedRows.length > 0 && columnMap && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-green-600">✓ {validCount} valid</span>
                  <span className="text-red-600">✗ {invalidCount} invalid</span>
                </div>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Row</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Employee Number</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {validatedRows.map((rowValidation) => (
                      <tr
                        key={rowValidation.rowIndex}
                        className={rowValidation.validation.valid ? 'bg-white' : 'bg-red-50'}
                      >
                        <td className="px-3 py-2">
                          {rowValidation.validation.valid ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-red-600">✗</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-600">{rowValidation.rowIndex}</td>
                        <td className="px-3 py-2">{rowValidation.employee.employeeNumber}</td>
                        <td className="px-3 py-2">{rowValidation.employee.name}</td>
                        <td className="px-3 py-2">{rowValidation.employee.email}</td>
                        <td className="px-3 py-2">
                          {rowValidation.validation.errors.length > 0 && (
                            <div className="text-xs text-red-600">
                              {rowValidation.validation.errors.slice(0, 2).join(', ')}
                              {rowValidation.validation.errors.length > 2 && '...'}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          {validatedRows.length > 0 && (
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!canImport}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Import {validCount} Valid Employees
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


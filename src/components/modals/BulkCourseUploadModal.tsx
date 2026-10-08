import React, { useState, useRef } from 'react';
import { Department, CourseCategory, Course } from '../../types';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import {
  ParsedCourseRow,
  parseCourseExcelFile,
  downloadCourseExcelTemplate
} from '../../utils/bulkUploadHelpers';
import {
  BookOpen,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Building2,
  Layers,
  ShieldAlert
} from 'lucide-react';

interface BulkCourseUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  categories: CourseCategory[];
  isSuperAdmin: boolean;
  onSuccess?: () => void;
}

export const BulkCourseUploadModal: React.FC<BulkCourseUploadModalProps> = ({
  isOpen,
  onClose,
  departments,
  categories,
  isSuperAdmin,
  onSuccess
}) => {
  const { addCourse } = useCollegeData();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Target default department
  const [selectedDeptId, setSelectedDeptId] = useState<string>(departments[0]?.id || '');

  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedCourseRow[]>([]);
  const [filterView, setFilterView] = useState<'ALL' | 'VALID' | 'ERRORS'>('ALL');

  // Import Execution State
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [importResults, setImportResults] = useState<{
    completed: boolean;
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  if (!isOpen) return null;

  // Strict SuperAdmin security guard:
  if (!isSuperAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center border border-slate-200 shadow-2xl">
          <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">Access Restricted</h3>
          <p className="text-xs text-slate-500 mb-4">
            Course and Subject bulk spreadsheet importing is strictly reserved for the SuperAdmin panel.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    processFile(selected);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      processFile(dropped);
    }
  };

  const processFile = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setIsParsing(true);
    setImportResults(null);
    try {
      const result = await parseCourseExcelFile(uploadedFile, departments, categories, selectedDeptId);
      setParsedRows(result.rows);
    } catch (err: any) {
      alert(`Error parsing course spreadsheet: ${err?.message || 'Could not parse Excel'}`);
      setParsedRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDownloadTemplate = () => {
    downloadCourseExcelTemplate(departments, categories);
  };

  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);
    setImportedCount(0);
    setFailedCount(0);

    let success = 0;
    let failed = 0;
    const errorDetails: string[] = [];

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const targetDeptId = row.matchedDepartmentId || selectedDeptId;
      const targetCatId = row.matchedCategoryId || categories[0]?.id || '';

      try {
        const coursePayload: Omit<Course, 'id'> = {
          courseCode: row.courseCode.toUpperCase(),
          courseTitle: row.courseTitle,
          departmentId: targetDeptId,
          categoryId: targetCatId,
          credits: Number(row.credits) || 4,
          theoryHours: Number(row.theoryHours) || 3,
          practicalHours: Number(row.practicalHours) || 0,
          semester: Number(row.semester) || 1,
          isActive: true
        };

        const res = await addCourse(coursePayload);
        if (res.success) {
          success++;
        } else {
          failed++;
          errorDetails.push(`Row ${row.rowIndex} (${row.courseCode}): ${res.error || 'Failed to save'}`);
        }
      } catch (err: any) {
        failed++;
        errorDetails.push(`Row ${row.rowIndex} (${row.courseCode}): ${err?.message || 'Unknown error'}`);
      }

      setImportedCount(success);
      setFailedCount(failed);
      setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    setIsImporting(false);
    setImportResults({
      completed: true,
      success,
      failed,
      errors: errorDetails
    });

    if (onSuccess && success > 0) {
      onSuccess();
    }
  };

  const validRowsCount = parsedRows.filter(r => r.isValid).length;
  const invalidRowsCount = parsedRows.filter(r => !r.isValid).length;

  const displayRows = parsedRows.filter(r => {
    if (filterView === 'VALID') return r.isValid;
    if (filterView === 'ERRORS') return !r.isValid;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Bulk Course & Subject Import (Excel)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  SuperAdmin Panel
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Quickly add university syllabus papers, credits, and contact hours across departments.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 rounded-xl border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              Download Template (.xlsx)
            </button>
            <button
              onClick={onClose}
              disabled={isImporting}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Default Department Option */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Default Fallback Department
                </p>
                <p className="text-[11px] text-slate-500">
                  Used if a row in the spreadsheet leaves the department column blank.
                </p>
              </div>
            </div>

            <select
              value={selectedDeptId}
              onChange={e => setSelectedDeptId(e.target.value)}
              disabled={isImporting || parsedRows.length > 0}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
            >
              {departments.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Drag & Drop Upload Zone */}
          {!file && (
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/30 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-1">
                Drop your course spreadsheet here, or{' '}
                <span className="text-blue-600 underline">Browse</span>
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Supports Excel (.xlsx, .xls) and CSV (.csv). Download the Course Template above for ready-to-use column headers.
              </p>
            </div>
          )}

          {/* Parsing Spinner */}
          {isParsing && (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Reading course rows from spreadsheet...</p>
            </div>
          )}

          {/* File Selected Banner & Controls */}
          {file && !isParsing && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 truncate">{file.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB • {parsedRows.length} courses identified
                    </p>
                  </div>
                </div>

                {!isImporting && !importResults?.completed && (
                  <button
                    onClick={() => {
                      setFile(null);
                      setParsedRows([]);
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    Change File
                  </button>
                )}
              </div>

              {/* Stats & Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilterView('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      filterView === 'ALL'
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All Courses ({parsedRows.length})
                  </button>
                  <button
                    onClick={() => setFilterView('VALID')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      filterView === 'VALID'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    Ready ({validRowsCount})
                  </button>
                  {invalidRowsCount > 0 && (
                    <button
                      onClick={() => setFilterView('ERRORS')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        filterView === 'ERRORS'
                          ? 'bg-rose-600 text-white'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      }`}
                    >
                      Issues ({invalidRowsCount})
                    </button>
                  )}
                </div>

                <div className="text-xs text-slate-500">
                  <span className="font-bold text-blue-600">{validRowsCount}</span> courses ready to import
                </div>
              </div>

              {/* Parsed Rows Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Course Code</th>
                      <th className="py-2.5 px-3">Course Title</th>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Sem</th>
                      <th className="py-2.5 px-3">Credits</th>
                      <th className="py-2.5 px-3">Hrs (T/P)</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayRows.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-6 text-center text-slate-400">
                          No courses match the active filter.
                        </td>
                      </tr>
                    ) : (
                      displayRows.map(r => (
                        <tr
                          key={r.rowIndex}
                          className={r.isValid ? 'hover:bg-slate-50/50' : 'bg-rose-50/30 hover:bg-rose-50/50'}
                        >
                          <td className="py-2 px-3 text-slate-400 font-mono">{r.rowIndex}</td>
                          <td className="py-2 px-3 font-mono font-bold text-blue-700">{r.courseCode || '—'}</td>
                          <td className="py-2 px-3 font-medium text-slate-900">{r.courseTitle || '—'}</td>
                          <td className="py-2 px-3 text-slate-600">
                            {r.matchedDepartmentName || r.departmentCodeOrName || 'Default'}
                          </td>
                          <td className="py-2 px-3 text-slate-600">
                            {r.matchedCategoryName || r.categoryCodeOrName || 'DSC'}
                          </td>
                          <td className="py-2 px-3 text-slate-600 font-mono">S{r.semester}</td>
                          <td className="py-2 px-3 text-slate-600 font-mono">{r.credits}</td>
                          <td className="py-2 px-3 text-slate-600 font-mono">
                            {r.theoryHours}T / {r.practicalHours}P
                          </td>
                          <td className="py-2 px-3 text-right">
                            {r.isValid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Valid
                              </span>
                            ) : (
                              <span
                                title={r.errors.join('; ')}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 cursor-help"
                              >
                                <AlertTriangle className="w-3 h-3" /> {r.errors[0]}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Import Progress Bar */}
              {isImporting && (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      Adding courses to college database...
                    </span>
                    <span>{importProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-blue-700">
                    <span>Added: {importedCount}</span>
                    {failedCount > 0 && <span className="text-rose-600 font-bold">Failed: {failedCount}</span>}
                  </div>
                </div>
              )}

              {/* Import Results Banner */}
              {importResults && (
                <div
                  className={`p-4 rounded-xl text-xs space-y-2 ${
                    importResults.failed === 0
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {importResults.failed === 0 ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    )}
                    <span>
                      Course Import Complete: {importResults.success} courses added successfully!
                    </span>
                  </div>
                  {importResults.failed > 0 && (
                    <p className="text-rose-700">
                      {importResults.failed} courses could not be added.
                    </p>
                  )}
                  {importResults.errors.length > 0 && (
                    <div className="max-h-24 overflow-y-auto bg-white/70 p-2 rounded-lg border border-slate-200 font-mono text-[10px] text-rose-700 space-y-0.5">
                      {importResults.errors.map((e, idx) => (
                        <div key={idx}>{e}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isImporting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
          >
            {importResults?.completed ? 'Close' : 'Cancel'}
          </button>

          {!importResults?.completed ? (
            <button
              type="button"
              disabled={validRowsCount === 0 || isImporting}
              onClick={handleExecuteImport}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Add {validRowsCount} Courses
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

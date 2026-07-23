import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, HelpCircle, FileSpreadsheet, FileJson } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MasterBulkUploadProps {
  typeLabel: string;
  expectedHeaders: string[];
  sampleRows: string[][];
  onDataUploaded: (parsedData: any[], mode: 'append' | 'replace') => void;
}

export default function MasterBulkUpload({
  typeLabel,
  expectedHeaders,
  sampleRows,
  onDataUploaded,
}: MasterBulkUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [showInstructions, setShowInstructions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pure JavaScript CSV/TSV Parser (supports quotes, escapes, commas/semicolons/tabs)
  const parseCSV = (text: string): string[][] => {
    const result: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let entry = '';

    // Standardize line endings
    const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const nextChar = cleanText[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          entry += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((char === ',' || char === ';' || char === '\t') && !inQuotes) {
        row.push(entry.trim());
        entry = '';
      } else if (char === '\n' && !inQuotes) {
        row.push(entry.trim());
        if (row.length > 0 && (row.length > 1 || row[0] !== '')) {
          result.push(row);
        }
        row = [];
        entry = '';
      } else {
        entry += char;
      }
    }
    if (entry || row.length > 0) {
      row.push(entry.trim());
      if (row.length > 0 && (row.length > 1 || row[0] !== '')) {
        result.push(row);
      }
    }
    return result;
  };

  const processFile = async (file: File) => {
    setError(null);
    setSuccess(null);

    try {
      let text = await file.text();
      // Remove UTF-8 BOM if present
      if (text.startsWith('\uFEFF')) {
        text = text.substring(1);
      }
      let parsedData: any[] = [];

      if (file.name.endsWith('.json')) {
        // Parse as JSON
        const rawJson = JSON.parse(text);
        const jsonArray = Array.isArray(rawJson) ? rawJson : [rawJson];

        // Validate JSON fields
        for (let idx = 0; idx < jsonArray.length; idx++) {
          const item = jsonArray[idx];
          const missing = expectedHeaders.filter(h => !(h in item));
          if (missing.length > 0 && expectedHeaders.length > 0) {
            throw new Error(`Item at index ${idx} is missing required fields: ${missing.join(', ')}`);
          }
          parsedData.push(item);
        }
      } else {
        // Parse as CSV/TSV
        const csvRows = parseCSV(text);
        if (csvRows.length < 2) {
          throw new Error('CSV file must contain a header row and at least one data row.');
        }

        const cleanHeader = (h: string) => h.replace(/^["']|["']$/g, '').trim().toLowerCase();
        const headers = csvRows[0].map(h => cleanHeader(h));
        
        // Find positions of expected headers
        const headerIndices: { [key: string]: number } = {};
        expectedHeaders.forEach(eh => {
          const cleanExpected = eh.toLowerCase().trim();
          const cleanExpectedAlpha = cleanExpected.replace(/[^a-z0-9]/g, '');

          const matchedIdx = headers.findIndex(h => {
            const cleanH = h.toLowerCase().trim();
            const cleanHAlpha = cleanH.replace(/[^a-z0-9]/g, '');
            return cleanH === cleanExpected || cleanHAlpha === cleanExpectedAlpha;
          });

          if (matchedIdx === -1) {
            throw new Error(`CSV is missing required column: "${eh}". Available columns: ${headers.map(h => `"${h}"`).join(', ')}`);
          }
          headerIndices[eh] = matchedIdx;
        });

        // Map data rows to objects
        for (let i = 1; i < csvRows.length; i++) {
          const row = csvRows[i];
          // Skip empty lines
          if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;

          const obj: any = {};
          expectedHeaders.forEach(eh => {
            const idx = headerIndices[eh];
            obj[eh] = row[idx] !== undefined ? row[idx] : '';
          });
          parsedData.push(obj);
        }
      }

      if (parsedData.length === 0) {
        throw new Error('No valid master data rows found in the file.');
      }

      onDataUploaded(parsedData, importMode);
      setSuccess(`Successfully imported ${parsedData.length} records! Choose "Save Changes" to commit.`);
    } catch (err: any) {
      console.error('Master bulk upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse file. Please verify formatting.');
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
      {/* Top Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
            <UploadCloud className="h-4 w-4 text-blue-500" />
            Bulk Upload {typeLabel}
          </h4>
          <p className="text-[10px] text-slate-500 font-medium">
            Upload CSV or JSON files to rapidly update your configurations.
          </p>
        </div>
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
          title="Show expected file format"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </div>

      {/* Instructions Accordion */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white border border-slate-150 rounded-xl p-3 text-[10px] text-slate-600 space-y-2.5 font-sans"
          >
            <div className="font-bold text-slate-700 uppercase tracking-wider text-[9px] flex items-center gap-1">
              <FileSpreadsheet className="h-3 w-3 text-emerald-500" /> Expected File Requirements:
            </div>
            <div className="space-y-1">
              <p>• <strong>CSV Format:</strong> Ensure headers match column names exactly (case-insensitive).</p>
              <p>• <strong>JSON Format:</strong> Upload a flat JSON array of objects with matching keys.</p>
              <p>• <strong>Columns / Keys Required:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-mono font-bold">{expectedHeaders.join(', ')}</code></p>
            </div>
            
            <div className="space-y-1">
              <div className="font-bold text-slate-700 uppercase tracking-wider text-[9px]">Sample CSV Preview:</div>
              <pre className="bg-slate-50 border border-slate-150 p-2 rounded text-[9px] font-mono leading-tight text-slate-500 whitespace-pre overflow-x-auto">
                {expectedHeaders.join(',')}{'\n'}
                {sampleRows.map(row => row.join(',')).join('\n')}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode Selectors */}
      <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 bg-white border border-slate-200/80 p-2.5 rounded-xl">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Import Behavior:</span>
        <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900 transition-colors">
          <input
            type="radio"
            name={`import-mode-${typeLabel}`}
            checked={importMode === 'append'}
            onChange={() => setImportMode('append')}
            className="text-blue-600 focus:ring-blue-500"
          />
          Append Rows
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900 transition-colors text-amber-700">
          <input
            type="radio"
            name={`import-mode-${typeLabel}`}
            checked={importMode === 'replace'}
            onChange={() => setImportMode('replace')}
            className="text-amber-600 focus:ring-amber-500"
          />
          Replace Existing
        </label>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
            : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50/50'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv,.json,.tsv"
          className="hidden"
        />
        <UploadCloud className={`h-8 w-8 ${isDragOver ? 'text-blue-600 animate-bounce' : 'text-slate-400'}`} />
        <div className="text-center">
          <span className="text-xs font-bold text-slate-700">Drag & drop your file here, or <span className="text-blue-600 hover:underline">browse</span></span>
          <p className="text-[10px] text-slate-450 mt-1 font-mono font-medium">Supports .csv, .tsv, or .json</p>
        </div>
      </div>

      {/* Message Notifications */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-start gap-2 font-semibold"
          >
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-extrabold uppercase tracking-wider text-[9px] text-rose-800">Upload Error</span>
              <p className="text-[11px] leading-relaxed">{error}</p>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-xl flex items-start gap-2 font-semibold"
          >
            <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-extrabold uppercase tracking-wider text-[9px] text-emerald-800">Success</span>
              <p className="text-[11px] leading-relaxed">{success}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

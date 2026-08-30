'use client';

import { useState } from 'react';
import { exportSessions, importSessions } from '@/lib/sessionManager';
import type { Session } from '@/types';

interface ExportImportProps {
  sessions: Session[];
  onImportComplete?: (count: number) => void;
}

export default function ExportImport({ sessions, onImportComplete }: ExportImportProps) {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{ success: boolean; count: number; error?: string } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = () => {
    const json = exportSessions();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brainstormin-sessions-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    
    setIsImporting(true);
    try {
      const text = await importFile.text();
      const result = importSessions(text);
      setImportResult(result);
      if (result.success && onImportComplete) {
        onImportComplete(result.count);
      }
    } catch (error) {
      setImportResult({
        success: false,
        count: 0,
        error: error instanceof Error ? error.message : 'Import failed',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        📁 Session Backup & Restore
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Section */}
        <section className="p-4 border border-gray-200 rounded-xl bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Export Sessions</h3>
          <p className="text-sm text-gray-600 mb-4">
            Download all your brainstorming sessions as a JSON file for backup or transfer.
            <br />
            <strong>Current sessions: {sessions.length}</strong>
          </p>
          <button
            onClick={handleExport}
            disabled={sessions.length === 0}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-xl font-bold hover:from-blue-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sessions.length === 0 ? 'No sessions to export' : 'Export to JSON File'}
          </button>
        </section>

        {/* Import Section */}
        <section className="p-4 border border-gray-200 rounded-xl bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Import Sessions</h3>
          <p className="text-sm text-gray-600 mb-4">
            Upload a previously exported JSON file to restore your sessions.
            Existing sessions will be merged (duplicates by ID are skipped).
          </p>
          
          <input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            disabled={isImporting}
          />
          
          <button
            onClick={handleImport}
            disabled={!importFile || isImporting}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 rounded-xl font-bold hover:from-green-600 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isImporting ? 'Importing...' : 'Import Sessions'}
          </button>

          {importResult && (
            <div className={`mt-4 p-3 rounded-lg ${importResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <p className="font-medium">
                {importResult.success 
                  ? `✅ Successfully imported ${importResult.count} session(s)`
                  : `❌ Import failed: ${importResult.error}`}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
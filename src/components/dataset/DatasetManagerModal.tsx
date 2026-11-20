'use client';

import React, { useState } from 'react';
import {
  exportUnifiedDatasetJSON,
  exportFlightsCSV,
  parseUnifiedDatasetJSON,
  parseFlightsCSV,
  CompleteDatasetPackage,
} from '../../services/dataset-loader';
import { Airport, Flight, Aircraft, PassengerConnection, CrewAssignment } from '../../types/aviation';
import {
  X,
  Upload,
  Download,
  Database,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileText,
  FileCode,
} from 'lucide-react';

interface DatasetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAirportsCount: number;
  currentFlightsCount: number;
  currentAircraftCount: number;
  onLoadCustomDataset: (pkg: CompleteDatasetPackage) => void;
  onResetOfficialDataset: () => void;
}

export const DatasetManagerModal: React.FC<DatasetManagerModalProps> = ({
  isOpen,
  onClose,
  currentAirportsCount,
  currentFlightsCount,
  currentAircraftCount,
  onLoadCustomDataset,
  onResetOfficialDataset,
}) => {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  if (!isOpen) return null;

  const handleDownloadJSON = () => {
    const jsonStr = exportUnifiedDatasetJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'domino-sky-official-dataset.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    const csvStr = exportFlightsCSV();
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'domino-sky-flights.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const text = evt.target?.result as string;
      if (file.name.endsWith('.json')) {
        const res = parseUnifiedDatasetJSON(text);
        if (res.success && res.data) {
          onLoadCustomDataset(res.data);
          setUploadStatus({
            success: true,
            message: `Successfully loaded custom dataset: ${res.data.airports.length} airports, ${res.data.flights.length} flights!`,
          });
        } else {
          setUploadStatus({ success: false, message: res.error });
        }
      } else if (file.name.endsWith('.csv')) {
        const flights = parseFlightsCSV(text);
        if (flights.length > 0) {
          setUploadStatus({
            success: true,
            message: `Successfully parsed ${flights.length} flights from CSV!`,
          });
        } else {
          setUploadStatus({ success: false, message: 'Could not parse flights from CSV.' });
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 text-xs select-none">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-white">Dataset Management & File I/O</h3>
              <p className="text-xs text-slate-400 font-mono">
                Single Source of Truth: 16 Airports | 70 Flights | 16 Aircraft
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Active Dataset Status Box */}
          <div className="bg-slate-900/60 rounded-xl p-3.5 border border-slate-800">
            <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold block mb-1">
              Active Network Database Status
            </span>
            <div className="grid grid-cols-3 gap-3 font-mono text-xs mt-2">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-slate-500 block text-[9px]">AIRPORTS</span>
                <span className="text-white font-bold text-sm">{currentAirportsCount} Stations</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-slate-500 block text-[9px]">FLIGHTS</span>
                <span className="text-white font-bold text-sm">{currentFlightsCount} Scheduled</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-slate-500 block text-[9px]">AIRCRAFT TAILS</span>
                <span className="text-white font-bold text-sm">{currentAircraftCount} Active + 3 Spares</span>
              </div>
            </div>
          </div>

          {/* Export Dataset Options */}
          <div>
            <span className="text-xs font-bold text-slate-200 block mb-2 uppercase font-mono">
              Export Verified Dataset
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleDownloadJSON}
                className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition-all flex items-start gap-2.5"
              >
                <FileCode className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-100 text-xs">Unified JSON Package</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Airports, rotations, crew, spares & connections in one file.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleDownloadCSV}
                className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition-all flex items-start gap-2.5"
              >
                <FileText className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-100 text-xs">70-Flight Schedule CSV</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Standard comma-separated table for Excel / Python analysis.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Import Custom File */}
          <div>
            <span className="text-xs font-bold text-slate-200 block mb-2 uppercase font-mono">
              Import External CSV / JSON Dataset
            </span>
            <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-5 text-center bg-slate-900/30 transition-colors">
              <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <label className="cursor-pointer">
                <span className="text-cyan-400 font-semibold hover:underline">Choose file</span>
                <span className="text-slate-400"> or drag and drop</span>
                <input
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-[10px] text-slate-500 mt-1 font-mono">
                Supports .json (full package) or .csv (flight timetable)
              </p>
            </div>

            {uploadStatus && (
              <div
                className={`mt-2.5 p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                  uploadStatus.success
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-950/20 border-red-500/30 text-red-300'
                }`}
              >
                {uploadStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                )}
                <span>{uploadStatus.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onResetOfficialDataset();
              setUploadStatus({
                success: true,
                message: 'Reset network database to official single source of truth (70 flights, 16 airports).',
              });
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg font-medium text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Official Dataset
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ Header.tsx ============
import { TrendingUp, Download, FileText, Info } from "lucide-react";
import { memo, useCallback } from "react";

/**
 * Props for the Header component
 */
interface HeaderProps {
  /** Whether data is available for download */
  hasData: boolean;
  /** Callback function to handle PDF download */
  onDownloadPDF: () => void;
  /** Optional loading state for download */
  isDownloading?: boolean;
}

/**
 * Header component for the Vehicle Performance Dashboard
 * Displays title, description, formulas, and download functionality
 */
export const Header = memo(function Header({
  hasData,
  onDownloadPDF,
  isDownloading = false,
}: HeaderProps) {
  const handleDownloadClick = useCallback(() => {
    if (hasData && !isDownloading) {
      onDownloadPDF();
    }
  }, [hasData, isDownloading, onDownloadPDF]);

  return (
    <header className="mb-10" role="banner">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <DashboardTitle />
        {hasData && (
          <DownloadButton
            onClick={handleDownloadClick}
            isLoading={isDownloading}
          />
        )}
      </div>
      <FormulaExplanation />
    </header>
  );
});

/**
 * Dashboard title and branding component
 */
const DashboardTitle = memo(function DashboardTitle() {
  return (
    <div className="flex items-center gap-4">
      <div
        className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg"
        aria-hidden="true"
      >
        <TrendingUp className="w-8 h-8 text-white" />
      </div>
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Vehicle Performance Dashboard
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Physical Availability (PA) and Utilization Availability (UA) Analytics
        </p>
      </div>
    </div>
  );
});

/**
 * Download button component with loading states
 */
interface DownloadButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

const DownloadButton = memo(function DownloadButton({
  onClick,
  isLoading,
}: DownloadButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`
        flex items-center gap-2 px-4 sm:px-6 py-3 
        bg-gradient-to-r from-blue-600 to-blue-700 
        text-white font-semibold rounded-xl shadow-lg 
        hover:from-blue-700 hover:to-blue-800 
        transition-all hover:shadow-xl transform hover:scale-105
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      `}
      aria-label={isLoading ? "Generating PDF report" : "Download PDF report"}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Generating...</span>
        </>
      ) : (
        <>
          <Download className="w-5 h-5" aria-hidden="true" />
          <span>Download PDF</span>
        </>
      )}
    </button>
  );
});

/**
 * Formula explanation component with detailed tooltips
 */
const FormulaExplanation = memo(function FormulaExplanation() {
  return (
    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
      <div className="flex items-start gap-3">
        <Info
          className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0"
          aria-hidden="true"
        />
        <div className="text-xs text-slate-700 leading-relaxed space-y-2">
          <p>
            <strong className="text-blue-700 font-semibold">PA Formula:</strong>{" "}
            <span className="font-mono">(MOHH − Breakdown) / MOHH × 100</span>
            <span className="ml-2 text-slate-500">
              – Measures equipment availability excluding breakdowns
            </span>
          </p>
          <p>
            <strong className="text-blue-700 font-semibold">UA Formula:</strong>{" "}
            <span className="font-mono">
              (MOHH − Breakdown − Delay/Idle) / (MOHH − Breakdown) × 100
            </span>
            <span className="ml-2 text-slate-500">
              – Measures utilization of available equipment
            </span>
          </p>
        </div>
      </div>
    </div>
  );
});

Header.displayName = "Header";

// ============ FileUpload.tsx ============
import { Upload } from "lucide-react";

type FileUploadProps = {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export function FileUpload({ onFileChange }: FileUploadProps) {
  return (
    <section className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 mb-10 hover:shadow-2xl transition-shadow">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Upload className="w-5 h-5 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Upload Data File</h2>
      </div>
      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={onFileChange}
        className="block w-full text-sm text-slate-600 file:mr-4 file:py-4 file:px-8 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-600 file:to-blue-700 file:text-white hover:file:from-blue-700 hover:file:to-blue-800 file:transition-all file:shadow-md hover:file:shadow-lg cursor-pointer"
      />
    </section>
  );
}

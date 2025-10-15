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

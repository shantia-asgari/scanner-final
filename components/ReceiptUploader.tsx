import React, { useCallback, useState } from 'react';
import { Upload, X, FileImage, AlertCircle, CheckCircle2, ImagePlus, Scan } from 'lucide-react';

interface ReceiptUploaderProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

const ReceiptUploader: React.FC<ReceiptUploaderProps> = ({ onFileSelect, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
      setFileName(file.name);
      onFileSelect(file);
    } else {
      alert("لطفا یک فایل تصویر معتبر بارگذاری کنید.");
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setPreview(null);
    setFileName(null);
  };

  if (preview) {
    return (
      <div className="relative w-full rounded-[2rem] overflow-hidden group transition-all duration-500 shadow-[0_20px_40px_rgba(0,0,0,0.3)] border border-white/20">
        
        {/* Glossy Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-20"></div>
        
        <div className="relative h-96 w-full bg-slate-900/50 backdrop-blur-xl flex items-center justify-center p-8">
          <img src={preview} alt="Receipt Preview" className="h-full w-full object-contain rounded-xl drop-shadow-[0_15px_35px_rgba(0,0,0,0.6)] transform transition-transform duration-700 group-hover:scale-[1.03] relative z-10" />
          
          {!isLoading && (
            <button 
              onClick={clearFile}
              className="absolute top-6 right-6 p-3 bg-black/40 hover:bg-red-500/80 text-white rounded-2xl border border-white/20 backdrop-blur-md transition-all duration-300 transform hover:scale-110 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] z-30"
              title="حذف تصویر"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* File Info Bar - Glass Strip */}
        <div className="px-6 py-5 bg-white/5 border-t border-white/10 flex items-center justify-between backdrop-blur-2xl relative z-20">
            <div className="flex items-center gap-4">
                <div className="p-2.5 bg-gradient-to-br from-white/10 to-transparent text-white rounded-xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]">
                    <FileImage className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 mb-0.5 uppercase tracking-wider">نام فایل</span>
                    <span className="text-sm font-bold text-white truncate dir-ltr max-w-[200px] drop-shadow-md">{fileName}</span>
                </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-300 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <CheckCircle2 className="w-4 h-4" />
                آماده تحلیل
            </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-80 flex flex-col items-center justify-center rounded-[2.5rem] transition-all duration-500 cursor-pointer overflow-hidden group
        ${dragActive 
            ? "border-2 border-dashed border-white/50 bg-white/10 shadow-[0_0_50px_rgba(255,255,255,0.2)]" 
            : "border-2 border-dashed border-white/5 bg-transparent hover:border-white/20 hover:bg-white/5"}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        onChange={handleChange}
        accept="image/*"
        disabled={isLoading}
      />
      
      {/* Liquid Animation Elements (Reduced opacity for cleaner look) */}
      <div className="absolute inset-0 overflow-hidden rounded-[2.5rem]">
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent rotate-45 transform translate-y-full group-hover:translate-y-[-100%] transition-transform duration-[1.5s] ease-in-out pointer-events-none"></div>
      </div>

      <div className="flex flex-col items-center text-center p-6 relative z-10 transition-transform duration-500 group-hover:-translate-y-2">
        
        {/* Upload Icon Container - Advanced Graphic */}
        <div className={`w-28 h-28 rounded-[2rem] flex items-center justify-center mb-8 transition-all duration-500 relative border overflow-hidden
            ${dragActive 
                ? "bg-white shadow-[0_0_60px_rgba(255,255,255,0.6)] border-white scale-110" 
                : "bg-slate-950/50 border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.4)] group-hover:border-white/40 group-hover:shadow-[0_0_50px_rgba(255,255,255,0.15)] group-hover:bg-slate-900"}`}>
          
          {/* Gloss sheen base */}
          <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
          
          {/* Hover Glow Gradient */}
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/0 via-purple-500/0 to-cyan-500/0 opacity-0 group-hover:opacity-100 group-hover:from-indigo-500/20 group-hover:via-purple-500/10 group-hover:to-cyan-500/20 transition-all duration-700"></div>
          
          {/* Animated Ring */}
          <div className="absolute inset-2 rounded-[1.5rem] border border-white/5 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500 ease-out"></div>

          {/* Main Icon */}
          <div className="relative z-10">
             <Upload className={`w-12 h-12 transition-all duration-500 ease-out
                ${dragActive 
                    ? "text-slate-900 animate-bounce" 
                    : "text-slate-500 group-hover:text-white group-hover:scale-110 group-hover:-translate-y-2 group-hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]"}`} />
             
             {/* Ghost Icon for Motion Blur Effect */}
             {!dragActive && (
                 <Upload className="absolute top-0 left-0 w-12 h-12 text-cyan-400 opacity-0 group-hover:opacity-30 group-hover:translate-y-2 group-hover:blur-sm transition-all duration-500" />
             )}
          </div>
          
          {/* Corner Decorations (Tech look) */}
          <div className="absolute top-4 right-4 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 shadow-[0_0_5px_white]"></div>
          <div className="absolute bottom-4 left-4 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200 shadow-[0_0_5px_white]"></div>

        </div>
        
        <h3 className="text-2xl font-bold text-white mb-3 transition-colors duration-300 drop-shadow-md group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300">تصویر را رها کنید</h3>
        <p className="text-sm text-slate-400 mb-8 font-medium group-hover:text-slate-300 transition-colors">یا کلیک کنید برای انتخاب فایل</p>
        
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 bg-white/5 border border-white/10 px-4 py-2 rounded-full transition-all duration-300 group-hover:bg-white/10 group-hover:border-white/30 group-hover:text-white backdrop-blur-md shadow-lg">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>JPG, PNG Supported</span>
        </div>
      </div>
    </div>
  );
};

export default ReceiptUploader;
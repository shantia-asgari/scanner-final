import React, { useState } from 'react';
import { ScanLine, Sparkles, Loader2, AlertTriangle, ShieldCheck, Cpu, Database, Activity, Wallet } from 'lucide-react';
import ReceiptUploader from './components/ReceiptUploader';
import ExtractionResults from './components/ResultCard';
import { extractReceiptData } from './services/gemini';
import { ReceiptData } from './types';

const App: React.FC = () => {
  const [data, setData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const result = await extractReceiptData(file);
      setData(result);
    } catch (err) {
      console.error(err);
      setError("خطا در پردازش تصویر. لطفا مطمئن شوید تصویر رسید خوانا است و دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-white/40 selection:text-slate-900 relative overflow-hidden">
      
      {/* Background - Deep Liquid Flow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-800 via-zinc-900 to-slate-950"></div>
        
        {/* Shiny Silver/Blue Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-slate-400/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-white/10 rounded-full blur-[80px]"></div>
        <div className="absolute top-[40%] left-[30%] w-[30vw] h-[30vw] bg-cyan-900/20 rounded-full blur-[90px]"></div>
        
        {/* Glass Noise Texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] brightness-125 contrast-150 mix-blend-overlay"></div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Header with Chic Minimal Scanner */}
        <div className="text-center mb-10 animate-fade-in-down flex flex-col items-center">
          
          <div className="relative mb-6">
             {/* Subtle Back Glow */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-cyan-500/20 blur-2xl rounded-full"></div>

             {/* Minimalist Container */}
             <div className="relative w-16 h-16 bg-white/5 rounded-2xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.2)] flex items-center justify-center backdrop-blur-md overflow-hidden group">
                
                {/* Clean Scanning Beam Animation */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent -translate-y-full group-hover:translate-y-full transition-transform duration-1000 ease-in-out"></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-tr from-cyan-500/5 to-purple-500/5"></div>

                {/* Icon */}
                <ScanLine className="w-7 h-7 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] relative z-10" strokeWidth={1.5} />
             </div>
             
             {/* Simple Accent Dots */}
             <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-1 h-1 bg-white/30 rounded-full"></div>
             <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-1 bg-white/30 rounded-full"></div>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 tracking-tight drop-shadow-sm">
            دستیار هوشمند <span className="text-white/90 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">رسید بانکی والکس</span>
          </h1>
        </div>

        {/* Main Liquid Glass Container */}
        <div className="relative rounded-[3.5rem] p-1 bg-gradient-to-b from-white/30 via-white/5 to-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          
          {/* Inner Content - Darker Glass */}
          <div className="bg-slate-900/40 rounded-[3.3rem] overflow-hidden relative">
            
            {/* Top Gloss Highlight */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-70"></div>
            
            <div className="p-8 sm:p-14 space-y-14">
              
              {/* Upload Section */}
              <div className="space-y-8">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xl font-bold text-white flex items-center gap-3 drop-shadow-md">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center border border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)]">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    بارگذاری تصویر
                  </h2>
                  {loading && (
                    <div className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-full border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span className="text-xs font-bold text-slate-200">در حال پردازش نوری...</span>
                    </div>
                  )}
                </div>
                <ReceiptUploader onFileSelect={handleFileSelect} isLoading={loading} />
              </div>

              {/* Error State */}
              {error && (
                <div className="relative bg-red-500/10 border border-red-500/40 p-6 rounded-3xl flex items-center gap-5 shadow-[0_0_30px_rgba(220,38,38,0.1)] overflow-hidden">
                  <div className="absolute inset-0 bg-red-500/5 backdrop-blur-sm"></div>
                  <div className="relative z-10 p-3 bg-gradient-to-br from-red-500/20 to-transparent rounded-2xl border border-red-500/20">
                     <AlertTriangle className="w-6 h-6 text-red-200" />
                  </div>
                  <div className="relative z-10">
                      <h4 className="text-base font-bold text-red-100 mb-1">خطا در سیستم</h4>
                      <p className="text-sm text-red-200/80">{error}</p>
                  </div>
                </div>
              )}

              {/* Results Section */}
              {data && (
                <div className="animate-fade-in space-y-8">
                   <div className="flex items-center gap-4 px-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400/20 to-emerald-500/5 flex items-center justify-center border border-emerald-400/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]">
                          <ShieldCheck className="w-5 h-5 text-emerald-300" />
                      </div>
                      <h3 className="text-xl font-bold text-white drop-shadow-md">نتایج تحلیل</h3>
                      <div className="flex-grow h-px bg-gradient-to-l from-transparent via-white/30 to-transparent"></div>
                   </div>
                   
                   {/* Results Container */}
                   <div className="p-1">
                      <ExtractionResults data={data} />
                   </div>
                </div>
              )}

               {/* Useful Information Badge (Replaces System Ready) */}
               {!data && !loading && !error && (
                <div className="py-8 flex justify-center">
                    <div className="relative group cursor-default">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        <div className="relative bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl px-6 py-4 flex items-center gap-5 shadow-2xl transition-transform duration-300 hover:scale-[1.02]">
                            
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/10 flex items-center justify-center border border-indigo-400/20 shadow-inner">
                                <Wallet className="w-5 h-5 text-indigo-300" />
                            </div>

                            <div className="flex flex-col">
                                <h4 className="text-sm font-bold text-white mb-0.5 flex items-center gap-2">
                                    بانک‌های پشتیبانی شده
                                    <span className="flex h-2 w-2 relative">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                </h4>
                                <p className="text-[11px] text-slate-400 leading-relaxed max-w-[240px] opacity-80">
                                    ملی • ملت • صادرات • پاسارگاد • سامان • تجارت • بلو و سایر بانک‌های عضو شتاب
                                </p>
                            </div>

                        </div>
                    </div>
                </div>
              )}

            </div>
            
            {/* Glossy Footer */}
            <div className="bg-gradient-to-r from-white/5 via-white/10 to-white/5 backdrop-blur-md px-10 py-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold tracking-widest text-slate-400 uppercase">
              <span className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-emerald-500" />
                Liquid Glass UI 3.0
              </span>
              <span className="flex items-center gap-2 text-slate-200">
                  Powered by Gemini AI
                  <Sparkles className="w-3 h-3 text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
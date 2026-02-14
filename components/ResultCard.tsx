import React, { useState } from 'react';
import { Copy, Check, Hash, CreditCard, FileText, Calendar, Building2, Search, Clock } from 'lucide-react';

interface ResultCardProps {
  label: string;
  value: string | null;
  icon: React.ReactNode;
  delay?: number;
  highlight?: boolean;
}

const ResultCard: React.FC<ResultCardProps> = ({ label, value, icon, delay = 0, highlight = false }) => {
  const [copied, setCopied] = useState(false);

  // --- تغییرات شروع شد (اصلاح تابع کپی) ---
  const handleCopy = () => {
    if (!value) return;

    // روش fallback: ساخت یک المنت متنی مخفی برای کپی کردن در محیط‌های غیر امن (HTTP)
    const textArea = document.createElement("textarea");
    textArea.value = value;
    
    // استایل‌دهی برای مخفی کردن المنت از دید کاربر
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      // این دستور در همه محیط‌ها (HTTP و HTTPS) کار می‌کند
      const successful = document.execCommand('copy');
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        console.error("Copy command failed.");
      }
    } catch (err) {
      console.error("Oops, unable to copy", err);
    }
    
    // پاک کردن المنت موقت
    document.body.removeChild(textArea);
  };
  // --- تغییرات تمام شد ---

  if (!value) return null;

  return (
    <div 
      onClick={handleCopy}
      className={`group relative flex items-center p-4 rounded-2xl transition-all duration-300 ease-out animate-fade-in-up cursor-pointer select-none border overflow-hidden
        ${highlight 
            ? "bg-gradient-to-br from-white/10 to-transparent border-white/20 shadow-lg" 
            : "bg-white/5 border-white/5 hover:bg-white/[0.08] hover:border-white/20 hover:shadow-md hover:-translate-y-0.5"}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      
      {/* Success Flash Overlay */}
      <div className={`absolute inset-0 bg-emerald-500/10 transition-opacity duration-300 pointer-events-none ${copied ? 'opacity-100' : 'opacity-0'}`}></div>

      <div className="flex items-center gap-4 w-full relative z-10">
        
        {/* Icon */}
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 border
            ${highlight 
                ? "bg-slate-800 text-white border-white/10 shadow-inner" 
                : "bg-white/5 text-slate-400 border-white/5 group-hover:bg-white/10 group-hover:text-slate-200"}`}>
          {copied ? (
             <Check className="w-5 h-5 text-emerald-400 animate-[zoom-in_0.2s_ease-out]" />
          ) : (
             <div className="transform group-hover:scale-110 transition-transform duration-300">{icon}</div>
          )}
        </div>
        
        {/* Text Content */}
        <div className="flex flex-col flex-grow min-w-0 justify-center">
            
            <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300
                    ${highlight ? "text-slate-400" : "text-slate-500 group-hover:text-slate-400"}`}>
                    {label}
                </span>
                
                {/* Hover Copy Label */}
                <div className={`flex items-center gap-1.5 transition-all duration-300 transform
                    ${copied 
                        ? "opacity-100 translate-x-0" 
                        : "opacity-0 translate-x-2 group-hover:translate-x-0 group-hover:opacity-100"}`}>
                    <span className={`text-[9px] font-bold ${copied ? "text-emerald-400" : "text-slate-400"}`}>
                        {copied ? 'کپی شد' : 'کپی'}
                    </span>
                    {!copied && <Copy className="w-3 h-3 text-slate-400" />}
                </div>
            </div>

            <span className={`text-base sm:text-lg font-mono font-medium tracking-wide dir-ltr text-right truncate mt-0.5 transition-colors duration-300
                ${highlight ? "text-white" : "text-slate-300 group-hover:text-white"}`}>
                {value}
            </span>
        </div>
      </div>
    </div>
  );
};

interface ExtractionResultsProps {
  data: {
    amount: string | null;
    depositId: string | null;
    trackingCode: string | null;
    referenceNumber: string | null;
    bankName: string | null;
    date: string | null;
    time: string | null;
  };
}

const ExtractionResults: React.FC<ExtractionResultsProps> = ({ data }) => {
  const hasData = Object.values(data).some(val => val !== null);

  if (!hasData) {
    return (
      <div className="text-center p-8 bg-white/5 rounded-2xl border border-dashed border-white/10 backdrop-blur-sm">
        <p className="text-slate-400 text-sm font-medium">هیچ داده‌ای قابل شناسایی در تصویر یافت نشد.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 w-full">
      {/* Amount - Main Highlight */}
      <ResultCard 
        label="مبلغ تراکنش (ریال)" 
        value={data.amount} 
        icon={<CreditCard className="w-5 h-5" />} 
        delay={100}
        highlight
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ResultCard 
            label="شناسه واریز" 
            value={data.depositId} 
            icon={<Hash className="w-4 h-4" />} 
            delay={200}
          />
          <ResultCard 
            label="کد رهگیری" 
            value={data.trackingCode} 
            icon={<Search className="w-4 h-4" />} 
            delay={300}
          />
      </div>

      <ResultCard 
        label="شماره پیگیری / ارجاع" 
        value={data.referenceNumber} 
        icon={<FileText className="w-4 h-4" />} 
        delay={400}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ResultCard 
            label="نام بانک" 
            value={data.bankName} 
            icon={<Building2 className="w-4 h-4" />} 
            delay={500}
        />
        <div className="flex gap-3">
             <div className="flex-1">
                <ResultCard 
                    label="تاریخ" 
                    value={data.date} 
                    icon={<Calendar className="w-4 h-4" />} 
                    delay={600}
                />
             </div>
             {data.time && (
                 <div className="flex-1">
                    <ResultCard 
                        label="ساعت" 
                        value={data.time} 
                        icon={<Clock className="w-4 h-4" />} 
                        delay={650}
                    />
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default ExtractionResults;

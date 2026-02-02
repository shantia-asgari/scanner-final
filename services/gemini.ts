import { ReceiptData } from "../types";

// دریافت کلید
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;

export const extractReceiptData = async (file: File): Promise<ReceiptData> => {
  console.log("🚀 شروع پردازش با مدل جدید...");

  // 1. تبدیل عکس به فرمت گوگل
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });

  // 2. بدنه درخواست
  const requestBody = {
    contents: [{
      parts: [
        { text: "Analyze receipt. Extract JSON: amount, depositId, trackingCode, referenceNumber, bankName, date, time. No markdown." },
        { inline_data: { mime_type: file.type, data: base64Data } }
      ]
    }]
  };

  try {
    // ============================================================
    // تغییر مهم: استفاده از مدل جدید gemini-2.0-flash
    // اگر باز هم خطا داد، از 'gemini-1.5-flash-latest' استفاده کنید
    // ============================================================
    const MODEL_NAME = "gemini-2.0-flash-exp"; 
    // نکته: اگر این نام هم کار نکرد، نام دقیق را از AI Studio (بخش Get Code) چک کنید.
    // گزینه‌های جایگزین احتمالی: "gemini-2.0-flash" یا "gemini-1.5-pro-latest"

    console.log(`🌐 در حال ارسال به مدل: ${MODEL_NAME}`);
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ خطای گوگل:", errorText);
      throw new Error(`Google Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ پاسخ گوگل دریافت شد:", data);
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const cleanJson = text.replace(/```json|```/g, '').replace(/json/g, '').trim();
    
    return JSON.parse(cleanJson) as ReceiptData;

  } catch (error) {
    console.error("❌ خطای نهایی:", error);
    throw error;
  }
};
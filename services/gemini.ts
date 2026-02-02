import { ReceiptData } from "../types";

// دریافت کلید
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;

export const extractReceiptData = async (file: File): Promise<ReceiptData> => {
  console.log("🚀 شروع پردازش...");

  // 1. بررسی وجود کلید API
  if (!API_KEY) {
    console.error("❌ کلید API یافت نشد! مشکل از تنظیمات گیت‌هاب است.");
    throw new Error("API Key is missing in the app.");
  } else {
    console.log("✅ کلید API شناسایی شد (شروع با):", API_KEY.substring(0, 5) + "...");
  }

  // 2. تبدیل عکس به فرمت گوگل
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });

  // 3. بدنه درخواست (دقیقاً کپی شده از AI Studio)
  const requestBody = {
    contents: [{
      parts: [
        { text: "Analyze receipt. Extract JSON: amount, depositId, trackingCode, referenceNumber, bankName, date, time. No markdown." },
        { inline_data: { mime_type: file.type, data: base64Data } }
      ]
    }]
  };

  try {
    console.log("🌐 در حال ارسال درخواست به گوگل...");
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      }
    );

    console.log("Status Code:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ خطای گوگل:", errorText);
      throw new Error(`Google Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ پاسخ گوگل دریافت شد:", data);
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const cleanJson = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson) as ReceiptData;

  } catch (error) {
    console.error("❌ خطای نهایی:", error);
    throw error;
  }
};
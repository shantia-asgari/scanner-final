import { ReceiptData } from "../types";

const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;

export const extractReceiptData = async (file: File): Promise<ReceiptData> => {
  // 1. تبدیل عکس به Base64
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });

  // 2. ساخت بدنه درخواست
  const requestBody = {
    contents: [{
      parts: [
        {
          text: `Extract data from this receipt (Persian/Iranian) into raw JSON. 
                 Fields: amount (digits only), depositId, trackingCode, referenceNumber, bankName, date, time.
                 Do not use markdown blocks.`
        },
        { inline_data: { mime_type: file.type, data: base64Data } }
      ]
    }]
  };

  try {
    // ============================================================
    // تغییر حیاتی: ارسال درخواست به تونل Netlify (نه مستقیم به گوگل)
    // این کار باعث می‌شود مشکل CORS و فیلترینگ دور زده شود.
    // ============================================================
    const response = await fetch(
      `/api/google/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("خطای ارتباط با سرور:", errorText);
      throw new Error(`Server Error: ${response.status}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) throw new Error("No data received");

    const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson) as ReceiptData;

  } catch (error) {
    console.error("Extraction failed:", error);
    throw error;
  }
};
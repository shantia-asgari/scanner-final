import { ReceiptData } from "../types";

const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;

export const extractReceiptData = async (file: File): Promise<ReceiptData> => {
  // 1. تبدیل فایل به Base64
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });

  // 2. ساخت درخواست دقیقاً مشابه AI Studio
  const requestBody = {
    contents: [{
      parts: [
        {
          text: "Extract amount (digits only), depositId, trackingCode, referenceNumber, bankName, date, time from this receipt image. Return valid JSON only."
        },
        {
          inline_data: {
            mime_type: file.type,
            data: base64Data
          }
        }
      ]
    }]
  };

  try {
    // 3. ارسال درخواست به آدرس اصلی گوگل (بدون پروکسی)
    // دقت کنید: از v1beta و مدل flash استفاده می‌کنیم
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      }
    );

    // 4. نمایش دقیق خطا اگر گوگل ارور داد
    if (!response.ok) {
      const errorText = await response.text();
      console.error("GOOGLE API ERROR:", errorText);
      throw new Error(`Google Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // 5. استخراج متن پاسخ
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) throw new Error("No text returned from AI");

    // تمیزکاری جیسون
    const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanJson) as ReceiptData;

  } catch (error) {
    console.error("FINAL ERROR DETAILS:", error);
    throw error;
  }
};
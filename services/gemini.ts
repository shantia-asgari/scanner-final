import { ReceiptData } from "../types";

// ✅ انتخابی از لیست شما (شماره 2 در لیست)
const MODEL_NAME = "gemini-2.0-flash"; 

const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;

export const extractReceiptData = async (file: File): Promise<ReceiptData> => {
  console.log(`🚀 در حال اتصال به مدل: ${MODEL_NAME}`);

  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });

  const requestBody = {
    contents: [{
      parts: [
        { 
          text: "Extract data from receipt (Persian/Iranian) into JSON: amount (digits only), depositId, trackingCode, referenceNumber, bankName, date, time. Return ONLY JSON." 
        },
        { inline_data: { mime_type: file.type, data: base64Data } }
      ]
    }]
  };

  try {
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
      // چاپ خطای دقیق برای دیباگ
      console.error(`❌ خطا (${response.status}):`, errorText);
      throw new Error(`Google Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ گوگل پاسخ داد!");
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const cleanJson = text.replace(/```json|```/g, '').replace(/json/g, '').trim();
    
    return JSON.parse(cleanJson) as ReceiptData;

  } catch (error) {
    console.error("❌ خطای نهایی:", error);
    throw error;
  }
};
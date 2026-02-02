import { ReceiptData } from "../types";

// ===========================================================================
// ✅ نام مدل دقیقاً طبق چیزی که شما از AI Studio پیدا کردید
const MODEL_NAME = "gemini-3-flash-preview";
// ===========================================================================

const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;

export const extractReceiptData = async (file: File): Promise<ReceiptData> => {
  console.log(`🚀 شروع اسکن با مدل قدرتمند: ${MODEL_NAME}`);

  // 1. تبدیل عکس به فرمت مورد نیاز گوگل
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });

  // 2. آماده‌سازی درخواست
  const requestBody = {
    contents: [{
      parts: [
        { 
          text: `Extract the following fields from this bank receipt (Persian/Iranian) into a raw JSON object:
                 - amount (digits only, remove commas)
                 - depositId (شناسه واریز)
                 - trackingCode (کد رهگیری)
                 - referenceNumber (شماره پیگیری / ارجاع)
                 - bankName (نام بانک)
                 - date (YYYY/MM/DD)
                 - time (HH:MM)
                 
                 Return ONLY the JSON. No Markdown formatting.` 
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
    // 3. ارسال درخواست به آدرس دقیق گوگل با مدل جدید
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      }
    );

    // 4. بررسی خطا
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ خطای گوگل:", errorText);
      throw new Error(`Google Error (${response.status}): ${errorText}`);
    }

    // 5. دریافت نتیجه
    const data = await response.json();
    console.log("✅ پاسخ با موفقیت دریافت شد!");
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) throw new Error("پاسخی از هوش مصنوعی نیامد.");

    // تمیزکاری جیسون (حذف ```json و فاصله اضافی)
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanJson) as ReceiptData;

  } catch (error) {
    console.error("❌ خطا در عملیات:", error);
    throw error;
  }
};
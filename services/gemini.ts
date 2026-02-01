import { ReceiptData } from "../types";

// دریافت کلید API (این خط تضمین می‌کند که کلید درست خوانده شود)
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;

export const extractReceiptData = async (file: File): Promise<ReceiptData> => {
  console.log("Starting processing with Direct API...");

  // 1. تبدیل عکس به فرمت متنی (Base64)
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // حذف قسمت های اضافی هدر فایل برای ارسال تمیز به گوگل
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // 2. دستور (Prompt) دقیق برای استخراج اطلاعات
  const requestBody = {
    contents: [{
      parts: [
        {
          text: `Extract the following data from this bank receipt (Iranian/Persian) into a raw JSON object:
                 - amount (digits only, remove separators)
                 - depositId (شناسه واریز)
                 - trackingCode (کد رهگیری)
                 - referenceNumber (شماره پیگیری / ارجاع)
                 - bankName (نام بانک)
                 - date (YYYY/MM/DD)
                 - time (HH:MM)
                 
                 Return ONLY the JSON. Do not use Markdown block codes.`
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
    // 3. ارسال درخواست مستقیم به گوگل (بدون نیاز به نصب هیچ پکیجی!)
    // از مدل gemini-1.5-flash استفاده می‌کنیم که سریع و دقیق است
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      }
    );

    // 4. چک کردن نتیجه
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Google API Error: ${errorData.error?.message || response.status}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) throw new Error("No response text from AI");

    // تمیزکاری متن برای اینکه جیسون خالص باشد
    const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanJson) as ReceiptData;

  } catch (error) {
    console.error("AI Error:", error);
    throw error;
  }
};
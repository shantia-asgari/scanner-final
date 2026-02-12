import { ReceiptData } from "../types";

const MODEL_NAME = "gemini-2.5-flash"; 
const API_BASE_URL = "https://api.gapgpt.app/v1/chat/completions";
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;

export const extractReceiptData = async (file: File): Promise<ReceiptData> => {
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

  const requestBody = {
    model: MODEL_NAME,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Extract Iranian receipt data to JSON. 
            Fields: amount, trackingCode, referenceNumber, date, time, depositId (return "ثبت" or "عدم ثبت"), bankName (return "-").
            Important: Return ONLY the JSON object starting with { and ending with }.`
          },
          {
            type: "image_url",
            image_url: { url: base64Data }
          }
        ]
      }
    ],
    max_tokens: 1000,
    temperature: 0
  };

  try {
    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}` },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    let text = data.choices?.[0]?.message?.content || "";

    // 🛡️ تکنیک فوق امن برای استخراج JSON از هر متنی
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}') + 1;
    
    if (start === -1 || end === 0) {
      throw new Error("خروجی معتبری از هوش مصنوعی دریافت نشد.");
    }

    let cleanJson = text.substring(start, end);
    
    // اصلاح دستی اگر رشته ناتمام بود (برای جلوگیری از SyntaxError)
    if (!cleanJson.endsWith('}')) cleanJson += '"}'; 

    try {
      return JSON.parse(cleanJson);
    } catch (e) {
      // تلاش مجدد برای تمیزکاری کاراکترهای غیرمجاز
      const fixedJson = cleanJson.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
      return JSON.parse(fixedJson);
    }

  } catch (error) {
    console.error("❌ Fatal Error:", error);
    throw error;
  }
};

import { ReceiptData } from "../types";

// ✅ استفاده از مدل نسل جدید طبق لیست پنل شما
const MODEL_NAME = "gemini-2.5-flash"; 
const API_BASE_URL = "https://api.gapgpt.app/v1/chat/completions";
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;

export const extractReceiptData = async (file: File): Promise<ReceiptData> => {
  console.log(`🚀 شروع اسکن فوق دقیق با مدل: ${MODEL_NAME}`);

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
            text: `Act as a high-precision OCR expert. Your life depends on the accuracy of EVERY SINGLE DIGIT.

            ANALYSIS STEPS:
            1. Scan the image for ALL numerical strings.
            2. Identify 'شماره پیگیری' (Tracking) and 'شماره رهگیری' (Reference).
            3. FOR THE SHORTER NUMBER (trackingCode): Read it digit-by-digit slowly. (Example: 5 4 5 1 0 1 8 8 6 5).
            4. FOR THE LONGER NUMBER (referenceNumber): Read it digit-by-digit slowly.

            STRICT DATA MAPPING:
            - trackingCode: The 6-11 digit identification number. MUST BE FULLY EXTRACTED.
            - referenceNumber: The 14-20 digit identification number. MUST BE FULLY EXTRACTED.
            - amount: Digits only.
            - depositId: If 'شناسه واریز/پرداخت' exists, return "ثبت", else "عدم ثبت".
            - bankName: Always return "-".
            - date & time: Exact strings.

            Return ONLY raw JSON object. NO markdown tags.`
          },
          {
            type: "image_url",
            image_url: { url: base64Data }
          }
        ]
      }
    ],
    max_tokens: 1500,
    temperature: 0 // صلب‌ترین حالت برای جلوگیری از جا انداختن اعداد
  };

  try {
    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}` 
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    
    if (!text) throw new Error("پاسخ خالی");

    const cleanJson = text.replace(/```json|```/gi, '').replace(/json/gi, '').trim();
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("❌ خطا در استخراج:", error);
    throw error;
  }
};

import { ReceiptData } from "../types";

// ✅ سوییچ به جدیدترین و دقیق‌ترین مدل موجود در پنل شما
const MODEL_NAME = "gemini-2.5-flash"; 
const API_BASE_URL = "https://api.gapgpt.app/v1/chat/completions";
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;

export const extractReceiptData = async (file: File): Promise<ReceiptData> => {
  console.log(`🚀 شروع اسکن با مدل نسل جدید: ${MODEL_NAME}`);

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
            text: `Extract data from this Iranian bank receipt. 
            
            STRICT NUMERIC RULES:
            1. You MUST find TWO different identification numbers if they exist.
            2. referenceNumber: The LONGER string of digits (e.g., 14-20 digits). 
            3. trackingCode: The SHORTER string of digits (e.g., 6-10 digits). 
            4. If only one is found, put it in referenceNumber.
            5. amount: Digits only.
            
            LOGIC RULES:
            - bankName: Always return "-".
            - depositId: If 'شناسه واریز' or 'شناسه پرداخت' is visible, return "ثبت", else "عدم ثبت".
            - date & time: Extract carefully (Solar Hijri).

            Return ONLY raw JSON object. NO markdown.`
          },
          {
            type: "image_url",
            image_url: { url: base64Data }
          }
        ]
      }
    ],
    max_tokens: 1000,
    temperature: 0 // صلب‌ترین حالت برای جلوگیری از جا انداختن ارقام
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

    if (!response.ok) throw new Error(`GapGPT Error: ${response.status}`);

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    
    if (!text) throw new Error("پاسخ خالی");

    const cleanJson = text.replace(/```json|```/gi, '').replace(/json/gi, '').trim();
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("❌ خطا:", error);
    throw error;
  }
};

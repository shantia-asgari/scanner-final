import { ReceiptData } from "../types";

// ✅ دقیقاً همان بدنه اصلی کد شما بدون تغییر در ساختار
const MODEL_NAME = "gpt-4o"; 
const API_BASE_URL = "https://api.gapgpt.app/v1/chat/completions";
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;

export const extractReceiptData = async (file: File): Promise<ReceiptData> => {
  console.log(`🚀 شروع اسکن با تمرکز بر دقت ۱۰۰٪ ارقام (مدل: ${MODEL_NAME})...`);

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
            text: `Extract data from this receipt into a JSON object. 
            CRITICAL INSTRUCTION: You must be a 'Digit-by-Digit' OCR. 
            - For 'trackingCode' and 'referenceNumber', count the digits carefully. 
            - DO NOT skip any digits. 
            - DO NOT hallucinate or shorten long numbers. 
            - Read every single character one by one.

            Fields:
            - amount: (digits only)
            - depositId: (exact digits)
            - trackingCode: (exact digits)
            - referenceNumber: (exact digits)
            - bankName: (Persian)
            - date: (YYYY/MM/DD)
            - time: (HH:MM)

            Return ONLY the raw JSON string.`
          },
          {
            type: "image_url",
            image_url: {
              url: base64Data
            }
          }
        ]
      }
    ],
    max_tokens: 1000,
    temperature: 0 // صفر کردن دما برای جلوگیری از هرگونه حدس یا خطا در ارقام
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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GapGPT Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    
    if (!text) throw new Error("پاسخ خالی دریافت شد.");

    const cleanJson = text.replace(/```json|```/gi, '').replace(/json/gi, '').trim();
    
    return JSON.parse(cleanJson) as ReceiptData;

  } catch (error) {
    console.error("❌ خطای نهایی:", error);
    throw error;
  }
};

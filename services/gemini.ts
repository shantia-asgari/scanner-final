import { ReceiptData } from "../types";

// ✅ استفاده از مدل پیشنهادی پنل برای دقت بالا
const MODEL_NAME = "gemini-1.5-pro"; 
const API_BASE_URL = "https://api.gapgpt.app/v1/chat/completions";
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;

export const extractReceiptData = async (file: File): Promise<ReceiptData> => {
  console.log(`🚀 شروع اسکن با مدل قدرتمند: ${MODEL_NAME}`);

  const base64DataWithPrefix = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

  // ⚠️ اصلاح مهم: برخی مدل‌ها پیش‌وند data:image را قبول نمی‌کنند
  // ما آدرس کامل را می‌فرستیم اما در دستور تاکید می‌کنیم
  
  const requestBody = {
    model: MODEL_NAME,
    messages: [
      {
        role: "system",
        content: `You are a precise Persian Receipt OCR. 
        Extract these specific fields from the image with 100% accuracy:
        - amount: Pure digits (Example from image: 999000000)
        - trackingCode: The 10-digit 'شماره پیگیری' (Example: 5451018865)
        - referenceNumber: The long 'شماره رهگیری' (Example: 140407141824322587)
        - depositId: The 'شناسه واریز' (Example: 1080505121)
        - bankName: Persian bank name (Example: بانک تجارت)
        - date: Solar Hijri date (YYYY/MM/DD)
        - time: (HH:MM)

        CRITICAL: Return ONLY a raw JSON object. No words, no markdown.`
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract all numbers exactly as they appear in this receipt. Do not skip any digit."
          },
          {
            type: "image_url",
            image_url: { url: base64DataWithPrefix }
          }
        ]
      }
    ],
    temperature: 0, // کمترین میزان خطا برای استخراج اعداد
    top_p: 0.1
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
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "خطا در ارتباط با سرور");
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    
    if (!text) throw new Error("پاسخ دریافتی خالی بود.");

    // تمیزکاری نهایی برای جلوگیری از خطای JSON.parse
    const cleanJson = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson) as ReceiptData;

  } catch (error) {
    console.error("❌ خطای نهایی:", error);
    throw error;
  }
};

import { ReceiptData } from "../types";

// ✅ تنظیمات سرویس GapGPT
// مدل پیشنهادی: gpt-4o (چون قوی‌ترین مدل برای خواندن عکس است)
// اگر اشتراک جمینای دارید می‌توانید بنویسید: gemini-1.5-pro
const MODEL_NAME = "gpt-4o"; 

// آدرس پایه سرویس گپ جی‌پی‌تی
const API_BASE_URL = "https://api.gapgpt.app/v1/chat/completions";

const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;

export const extractReceiptData = async (file: File): Promise<ReceiptData> => {
  console.log(`🚀 شروع اسکن با سرویس GapGPT (مدل: ${MODEL_NAME})...`);

  // تبدیل عکس به Base64
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

  // آماده‌سازی درخواست به فرمت OpenAI (که GapGPT از آن پشتیبانی می‌کند)
  const requestBody = {
    model: MODEL_NAME,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract data from this bank receipt (Persian/Iranian) into a JSON object with these fields: amount (digits only, no commas), depositId, trackingCode, referenceNumber, bankName, date (YYYY/MM/DD), time (HH:MM). Return ONLY the raw JSON string. No markdown formatting like ```json."
          },
          {
            type: "image_url",
            image_url: {
              url: base64Data // ارسال عکس به صورت Base64
            }
          }
        ]
      }
    ],
    max_tokens: 1000,
    temperature: 0.1 // دمای پایین برای دقت بیشتر
  };

  try {
    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}` // احراز هویت با کلید شما
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ خطا از سمت GapGPT (${response.status}):`, errorText);
      throw new Error(`GapGPT Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ پاسخ دریافت شد!");

    // استخراج متن از فرمت OpenAI
    const text = data.choices?.[0]?.message?.content;
    
    if (!text) throw new Error("پاسخ خالی از سرویس دریافت شد.");

    // تمیزکاری جیسون
    const cleanJson = text.replace(/```json|```/g, '').replace(/json/g, '').trim();
    
    return JSON.parse(cleanJson) as ReceiptData;

  } catch (error) {
    console.error("❌ خطای نهایی:", error);
    throw error;
  }
};

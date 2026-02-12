import { ReceiptData } from "../types";

// ✅ بازگشت به کد پایدار شما با تقویت دستورات استخراج
const MODEL_NAME = "gpt-4o"; 
const API_BASE_URL = "https://api.gapgpt.app/v1/chat/completions";
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;

export const extractReceiptData = async (file: File): Promise<ReceiptData> => {
  console.log(`🚀 شروع اسکن فوق‌دقیق (مدل: ${MODEL_NAME})...`);

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
            text: `Act as a high-precision OCR for Iranian bank receipts. 
            
            GOAL: Extract numbers with 100% accuracy.
            
            INSTRUCTIONS:
            1. Find all identification numbers (شماره پیگیری, شماره رهگیری, مرجع, ارجاع).
            2. For the LONGEST number (usually 14+ digits), put it in "referenceNumber".
            3. For the SHORTER number (usually 6-10 digits), put it in "trackingCode".
            4. If only one number exists, put it in "referenceNumber".
            5. amount: Digits only, no commas.
            6. depositId: If 'شناسه واریز' or 'شناسه پرداخت' is visible, return "ثبت", otherwise "عدم ثبت".
            7. bankName: Always return "-".
            
            STRICT RULE: Read digits one-by-one. DO NOT skip any digit. 
            Check this example from your target image: If you see '140411160172713240', do NOT return '1404111601727...'. Return EVERY digit.
            
            Return ONLY raw JSON object.`
          },
          {
            type: "image_url",
            image_url: { url: base64Data }
          }
        ]
      }
    ],
    max_tokens: 1000,
    temperature: 0 // صفر مطلق برای جلوگیری از هرگونه تغییر در اعداد
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

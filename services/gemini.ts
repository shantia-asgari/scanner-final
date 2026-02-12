import { ReceiptData } from "../types";

// ✅ نسخه نهایی با منطق تشخیص دوگانه اعداد
const MODEL_NAME = "gpt-4o"; 
const API_BASE_URL = "https://api.gapgpt.app/v1/chat/completions";
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;

export const extractReceiptData = async (file: File): Promise<ReceiptData> => {
  console.log(`🚀 شروع اسکن هوشمند اعداد (مدل: ${MODEL_NAME})...`);

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
            text: `Analyze this Iranian bank receipt. Extract data into a JSON object.
            
            STRICT RULES FOR NUMBERS:
            1. Look for ALL identification numbers (شماره پیگیری، شماره رهگیری، شماره مرجع، کد ارجاع).
            2. If you find TWO different numbers:
               - Put the LONGER one in "referenceNumber".
               - Put the SHORTER one in "trackingCode".
            3. If you find only ONE number, put it in both fields or prioritize "referenceNumber".
            4. Extract every single digit with 100% accuracy. Do not skip any character.
            
            OTHER FIELDS:
            - amount: Digits only.
            - date & time: Exactly as printed.
            - depositId: If 'شناسه واریز' or 'شناسه پرداخت' exists, return "ثبت", otherwise "عدم ثبت".
            - bankName: Always return "-".
            
            Output ONLY raw JSON:
            {
              "amount": "",
              "trackingCode": "",
              "referenceNumber": "",
              "date": "",
              "time": "",
              "depositId": "",
              "bankName": "-"
            }`
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
    console.error("❌ خطا:", error);
    throw error;
  }
};

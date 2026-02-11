import { ReceiptData } from "../types";

// ✅ همان بدنه اصلی و ساختار مورد تایید شما
const MODEL_NAME = "gpt-4o"; 
const API_BASE_URL = "https://api.gapgpt.app/v1/chat/completions";
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;

export const extractReceiptData = async (file: File): Promise<ReceiptData> => {
  console.log(`🚀 اسکن متمرکز با مدل: ${MODEL_NAME}...`);

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
            text: `Analyze this Iranian bank receipt with high focus on numbers. 
            
            STRICT RULES:
            1. amount: Extract total amount in digits only.
            2. trackingCode: Extract 'شماره پیگیری' digit-by-digit.
            3. referenceNumber: Extract 'شماره رهگیری' digit-by-digit. (Do NOT mix these two).
            4. date & time: Extract exactly as printed.
            5. depositId: DO NOT extract the number. Instead, return 'true' if any 'شناسه واریز' or 'شناسه پرداخت' exists in the image, otherwise 'false'.
            6. IGNORE: Do NOT extract bank name or source account numbers.
            
            Output ONLY this JSON format:
            {
              "amount": "",
              "trackingCode": "",
              "referenceNumber": "",
              "date": "",
              "time": "",
              "hasDepositId": true/false
            }`
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
    temperature: 0 // صلب‌ترین حالت برای جلوگیری از جابجایی فیلدها
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
      throw new Error(`GapGPT Error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    
    if (!text) throw new Error("پاسخ خالی");

    const cleanJson = text.replace(/```json|```/gi, '').replace(/json/gi, '').trim();
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("❌ خطای نهایی:", error);
    throw error;
  }
};

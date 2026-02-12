import { ReceiptData } from "../types";

// ✅ استفاده از مدل نسل جدید برای تشخیص دقیق روابط متنی و تصویری
const MODEL_NAME = "gemini-2.5-flash"; 
const API_BASE_URL = "https://api.gapgpt.app/v1/chat/completions";
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;

export const extractReceiptData = async (file: File): Promise<ReceiptData> => {
  console.log(`🚀 شروع اسکن هوشمند و تفکیک شده (مدل: ${MODEL_NAME})...`);

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
            text: `You are a professional OCR for ANY Iranian bank receipt. 
            Extract data based on VISUAL PROXIMITY to labels, NOT digit length.

            STRICT EXTRACTION RULES:
            1. amount: Find the number strictly associated with labels like 'مبلغ' or 'مبلغ تراکنش'.
            2. trackingCode: Find the number strictly associated with labels like 'شماره پیگیری' or 'کد پیگیری'.
            3. referenceNumber: Find the number strictly associated with labels like 'شماره رهگیری', 'شماره ارجاع', or 'کد مرجع'.
            4. depositId: DO NOT extract the number. If 'شناسه واریز' or 'شناسه پرداخت' is present, return "ثبت", else return "عدم ثبت".
            5. bankName: Always return "-".
            6. date & time: Extract from their respective labels.

            IMPORTANT: 
            - If a label (e.g., trackingCode) is missing in the receipt, return an empty string "" for it.
            - Never put the 'amount' digits into 'trackingCode' or 'referenceNumber' fields.
            
            Return ONLY raw JSON.`
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
    console.error("❌ خطای نهایی:", error);
    throw error;
  }
};

import { ReceiptData } from "../types";

// ✅ قوی‌ترین مدل برای خواندن متون فشرده و متنوع بانکی
const MODEL_NAME = "gemini-2.5-flash"; 
const API_BASE_URL = "https://api.gapgpt.app/v1/chat/completions";
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;

export const extractReceiptData = async (file: File): Promise<ReceiptData> => {
  console.log(`🚀 اسکن نهایی و سراسری واحد مالی (مدل: ${MODEL_NAME})...`);

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
            text: `You are a professional Financial Auditor OCR. 
            Extract data with 100% precision from ANY Iranian bank receipt.

            MAPPING RULES (Label-to-Value):
            1. amount: Find 'مبلغ' or 'مبلغ تراکنش'. Extract digits only.
            2. trackingCode: Find 'شماره پیگیری' or 'کد پیگیری' or 'پیگیری'. Extract every single digit.
            3. referenceNumber: Find 'شماره رهگیری' or 'شماره ارجاع' or 'کد مرجع' or 'مرجع'. Extract every single digit.
            4. depositId: If 'شناسه واریز' or 'شناسه پرداخت' exists -> "ثبت", else -> "عدم ثبت".
            5. bankName: Always return "-".
            6. date & time: Extract from labels 'زمان', 'تاریخ', 'تاریخ و ساعت'.

            CRITICAL FOR FINANCIAL ACCURACY:
            - Do NOT skip any digits in long numbers.
            - Do NOT confuse 'amount' with ID numbers.
            - If a receipt only has one ID number, put it in 'referenceNumber'.
            - Work regardless of background color, font, or bank brand (Melli, Saderat, etc).

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
    
    if (!text) throw new Error("پاسخ دریافتی معتبر نیست.");

    const cleanJson = text.replace(/```json|```/gi, '').replace(/json/gi, '').trim();
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("❌ خطای اسکن:", error);
    throw error;
  }
};

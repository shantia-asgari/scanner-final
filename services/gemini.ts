import { ReceiptData } from "../types";

const MODEL_NAME = "gemini-2.5-flash"; 
const API_BASE_URL = "https://api.gapgpt.app/v1/chat/completions";
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;

export const extractReceiptData = async (file: File): Promise<ReceiptData> => {
  console.log(`🚀 پردازش نهایی با مدل: ${MODEL_NAME}`);

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
            text: `Extract data from this Iranian bank receipt. Precision is non-negotiable for financial auditing.
            
            RULES:
            1. amount: Digits only.
            2. trackingCode: Extract digits of 'شماره پیگیری' with 100% accuracy.
            3. referenceNumber: Extract digits of 'شماره رهگیری' or 'مرجع' with 100% accuracy.
            4. depositId: If 'شناسه واریز' or 'شناسه پرداخت' exists return "ثبت", else "عدم ثبت".
            5. bankName: Always return "-".
            6. date & time: Extract exactly.
            
            If a field is not found, return "". Return ONLY a valid JSON object.`
          },
          {
            type: "image_url",
            image_url: { url: base64Data }
          }
        ]
      }
    ],
    // افزایش توکن برای جلوگیری از خطای قطع شدن JSON
    max_tokens: 2000, 
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

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const data = await response.json();
    let text = data.choices?.[0]?.message?.content || "";
    
    // تمیزکاری هوشمندانه برای جلوگیری از خطای SyntaxError
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    const cleanJson = text.substring(jsonStart, jsonEnd);
    
    console.log("✅ خروجی نهایی مدل:", cleanJson);
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("❌ خطای پردازش:", error);
    throw error;
  }
};

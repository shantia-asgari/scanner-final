import { ReceiptData } from "../types";

const MODEL_NAME = "gemini-2.5-flash"; 
const API_BASE_URL = "https://api.gapgpt.app/v1/chat/completions";
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;

export const extractReceiptData = async (file: File): Promise<ReceiptData> => {
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
            text: `Analyze this Iranian receipt. Extract these fields using this exact format:
            AMOUNT: (digits)
            TRACKING: (digits)
            REFERENCE: (digits)
            DATE: (YYYY/MM/DD)
            TIME: (HH:MM)
            DEPOSIT_ID: (If exists return 'ثبت' otherwise 'عدم ثبت')
            
            RULES: 100% precision for digits. bankName is always '-'.`
          },
          {
            type: "image_url",
            image_url: { url: base64Data }
          }
        ]
      }
    ],
    temperature: 0
  };

  try {
    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}` },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // 🛠️ استخراج دستی اطلاعات بدون نیاز به JSON.parse (روش ضد خطا)
    const getValue = (label: string) => {
      const regex = new RegExp(`${label}:\\s*(.*)`, "i");
      const match = content.match(regex);
      return match ? match[1].trim() : "";
    };

    return {
      amount: getValue("AMOUNT"),
      trackingCode: getValue("TRACKING"),
      referenceNumber: getValue("REFERENCE"),
      date: getValue("DATE"),
      time: getValue("TIME"),
      depositId: getValue("DEPOSIT_ID"),
      bankName: "-"
    };

  } catch (error) {
    console.error("❌ Error:", error);
    throw new Error("خطا در پردازش اطلاعات. لطفا دوباره تلاش کنید.");
  }
};

import { ReceiptData } from "../types";

const MODEL_NAME = "gemini-2.5-flash"; 
// استفاده از پروکسی AllOrigins که پایداری بیشتری نسبت به نسخه قبلی دارد
const API_BASE_URL = "https://api.allorigins.win/raw?url=" + encodeURIComponent("https://api.gapgpt.app/v1/chat/completions");
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
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${API_KEY}` 
      },
      body: JSON.stringify(requestBody)
    });

    // مدیریت خطای 503 و عدم در دسترس بودن سرور
    if (response.status === 503 || response.status === 500) {
      throw new Error("سرور واسطه موقتاً در دسترس نیست. لطفاً چند لحظه دیگر دوباره تلاش کنید.");
    }

    if (!response.ok) {
      throw new Error(`خطای شبکه: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
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

  } catch (error: any) {
    console.error("❌ Critical Error:", error.message);
    throw new Error(error.message || "خطا در ارتباط با سرور هوش مصنوعی.");
  }
};

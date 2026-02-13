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
            text: `Analyze this Iranian receipt. Extract exactly:
            AMOUNT: (digits)
            TRACKING: (digits)
            REFERENCE: (digits)
            DATE: (YYYY/MM/DD)
            TIME: (HH:MM)
            DEPOSIT_ID: (If exists 'ثبت' else 'عدم ثبت')`
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
    // 🛡️ استفاده از یک پروکسی جایگزین با متد متفاوت برای عبور از CORS
    const proxyUrl = "https://api.allorigins.win/get?url=" + encodeURIComponent(API_BASE_URL);

    const response = await fetch(proxyUrl, {
      method: "POST", // AllOrigins در حالت POST داده‌ها را به خوبی عبور می‌دهد
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify(requestBody)
      })
    });

    const wrapperData = await response.json();
    // استخراج پاسخ اصلی از داخل محفظه AllOrigins
    const data = JSON.parse(wrapperData.contents);
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
    console.error("❌ ابزار با اختلال شبکه مواجه شد:", error);
    throw new Error("خطا در ارتباط با سرور هوش مصنوعی (اختلال CORS). لطفاً از VPN استفاده کنید یا لحظاتی دیگر تلاش کنید.");
  }
};

import { ReceiptData } from "../types";

const MODEL_NAME = "gemini-2.5-flash"; 
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;
const TARGET_URL = "https://api.gapgpt.app/v1/chat/completions";

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
            text: `Extract Iranian receipt data: AMOUNT, TRACKING, REFERENCE, DATE, TIME. 
            For DEPOSIT_ID: if exists return 'ثبت' else 'عدم ثبت'. BankName is always '-'.`
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
    // 🛡️ استفاده از AllOrigins به صورت GET برای دور زدن کامل محدودیت CORS کنسول
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(TARGET_URL)}`;

    const response = await fetch(proxyUrl, {
      method: "POST", // AllOrigins اجازه POST را از این طریق می‌دهد
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`
        },
        method: "POST",
        body: JSON.stringify(requestBody)
      })
    });

    const wrapper = await response.json();
    
    // 🔍 بررسی اینکه آیا پاسخ معتبر است یا خطای HTML دریافت شده
    if (!wrapper.contents || wrapper.contents.startsWith("<!DOCTYPE")) {
      throw new Error("اختلال در دریافت پاسخ از سرور. لطفا از VPN استفاده کنید.");
    }

    const data = JSON.parse(wrapper.contents);
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
    console.error("❌ بن‌بست فنی در کنسول:", error.message);
    throw new Error(error.message.includes("Unexpected token") 
      ? "سرور هوش مصنوعی پاسخی ارسال نکرد. لطفا دوباره تلاش کنید." 
      : error.message);
  }
};

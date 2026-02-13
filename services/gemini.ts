import { ReceiptData } from "../types";

const MODEL_NAME = "gemini-2.5-flash"; 
// استفاده از پروکسی AllOrigins برای دور زدن محدودیت CORS مرورگر
const TARGET_URL = "https://api.gapgpt.app/v1/chat/completions";
const API_BASE_URL = `https://api.allorigins.win/raw?url=${encodeURIComponent(TARGET_URL)}`;

// فراخوانی ایمن کلید از تنظیمات گیت‌هاب
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const extractReceiptData = async (file: File): Promise<ReceiptData> => {
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

  try {
    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${API_KEY}` 
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [{
          role: "user",
          content: [
            { type: "text", text: "Analyze receipt. Extract: AMOUNT, TRACKING, REFERENCE, DATE, TIME, DEPOSIT_ID (ثبت/عدم ثبت). Format: LABEL: VALUE" },
            { type: "image_url", image_url: { url: base64Data } }
          ]
        }],
        temperature: 0
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      // تشخیص اگر پاسخ به جای دیتا، صفحه خطای HTML بود
      if (errorText.includes("<!DOCTYPE")) {
        throw new Error("سد امنیتی فایروال مانع شد. لطفاً از VPN استفاده کنید.");
      }
      throw new Error(`خطای شبکه: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    const getValue = (label: string) => {
      const regex = new RegExp(`${label}:\\s*(.*)`, "i");
      const match = content.match(regex);
      return match ? match[1].trim() : "-";
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
    throw new Error(error.message);
  }
};

import { ReceiptData } from "../types";

// 👇 آدرس کپی شده از Hugging Face را اینجا بگذارید و /proxy را به ته آن اضافه کنید
// مثال صحیح: https://shantia-gapgpt-proxy-server.hf.space/proxy
const PROXY_URL = "https://shantia-asgari-gapgpt-proxy-server.hf.space/proxy"; 

// کلید API را از متغیرهای محیطی می‌خوانیم (مثل قبل)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const extractReceiptData = async (file: File): Promise<ReceiptData> => {
  // تبدیل تصویر به Base64
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

  try {
    console.log("در حال ارسال به پروکسی:", PROXY_URL);

    const response = await fetch(PROXY_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}` // کلید را به پروکسی می‌فرستیم
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
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
      throw new Error(`خطای سرور (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // استخراج داده‌ها
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
    console.error("❌ Error:", error.message);
    throw new Error("خطا در ارتباط با سرور. لطفاً کنسول را چک کنید.");
  }
};

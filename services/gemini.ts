import { ReceiptData } from "../types";

// :rocket: آدرس را به آی‌پی سرور آروان خودتان تغییر دهید
const PROXY_URL = "http://188.213.196.62:3000/proxy"; 

export const extractReceiptData = async (file: File): Promise<ReceiptData> => {
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

  const requestBody = {
    model: "gemini-2.5-flash", // طبق مستندات GapGPT
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
    const response = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" }, // نیازی به Authorization در اینجا نیست
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) throw new Error(`Server Error: ${response.status}`);

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

  } catch (error) {
    console.error("❌ Error:", error);
    throw new Error("خطا در ارتباط با سرور واسط ایران. لطفا تنظیمات VPS را چک کنید.");
  }
};

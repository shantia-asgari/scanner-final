import { ReceiptData } from "../types";

// ✅ آدرس جدید Worker شما جایگزین شد
const WORKER_URL = "https://divine-fire-5ef3.shntiaasgariiii.workers.dev"; 

export const extractReceiptData = async (file: File): Promise<ReceiptData> => {
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

  try {
    // ارسال به Worker (بدون ارسال کلید API، چون در سرور امن است)
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
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
    throw new Error("خطا در ارتباط با سرور. لطفاً مطمئن شوید عکس واضح است.");
  }
};

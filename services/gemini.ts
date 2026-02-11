const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// تغییر به قوی‌ترین مدل پیشنهادی پنل برای دقت بیشتر
const MODEL_NAME = "gemini-1.5-pro"; 

export async function extractReceiptData(imageFile: File): Promise<any> {
  if (!API_KEY) throw new Error("کلید API یافت نشد.");

  const base64Image = await fileToBase64(imageFile);

  const payload = {
    model: MODEL_NAME,
    messages: [
      {
        role: "system",
        content: `You are a precision data extraction tool for Persian banking receipts.
        
        CRITICAL INSTRUCTIONS:
        1. **Tracking vs Reference:** This receipt has BOTH "شماره پیگیری" (shomare peygiri) and "شماره رهگیری" (shomare rahgiri). You MUST extract both accurately.
        2. **No Rounding:** Write every single digit of the numbers. Do not omit zeros.
        3. **Language:** Extract bank name and receiver name in Persian.
        
        JSON Fields to fill:
        - amount: (The total amount in Rials/Tomans as a string)
        - date: (Solar Hijri date e.g. 1404/07/14)
        - time: (e.g. 12:39)
        - source_bank: (e.g. بانک تجارت)
        - dest_name: (Receiver name)
        - tracking_code: (Extract 'شماره پیگیری بانک مرکزی')
        - reference_id: (Extract 'شماره رهگیری بانک مرکزی')
        - payment_id: (Extract 'شناسه واریز' if exists)`
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Carefully analyze this receipt and return ONLY the JSON." },
          { type: "image_url", image_url: { url: base64Image } }
        ]
      }
    ],
    temperature: 0.1 // تعادل بین دقت و درک بصری
  };

  try {
    const response = await fetch("https://api.gapgpt.app/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    const resultText = data.choices[0]?.message?.content || "{}";
    const cleanJson = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("AI Error:", error);
    throw error;
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

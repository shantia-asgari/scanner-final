const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL_NAME = "gpt-4o"; 

export async function extractReceiptData(imageFile: File): Promise<any> {
  if (!API_KEY) throw new Error("کلید API یافت نشد.");

  const base64Image = await fileToBase64(imageFile);

  const payload = {
    model: MODEL_NAME,
    messages: [
      {
        role: "system",
        content: `You are an expert Iranian Receipt Analyzer. Extract ALL available data.
        
        STRICT RULES FOR NUMBERS:
        - Extract Tracking/Reference numbers EXACTLY as printed. 
        - Do NOT miss any digits. 
        - If there are multiple numbers (like 'پیگیری' and 'رهگیری'), extract BOTH into their respective fields.
        
        JSON STRUCTURE:
        {
          "amount": "Pure number string",
          "date": "Solar Hijri date",
          "time": "Time string",
          "source_bank": "Bank name",
          "source_card": "Source card/account",
          "dest_name": "Receiver name",
          "dest_card": "Destination card/IBAN",
          "tracking_code": "Extract 'شماره پیگیری' or 'کد پیگیری'",
          "reference_id": "Extract 'شماره رهگیری' or 'شماره ارجاع'",
          "payment_id": "Extract 'شناسه واریز' or 'شناسه پرداخت' if exists"
        }`
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Carefully read this receipt. Find 'شماره پیگیری', 'شماره رهگیری', and 'شناسه واریز'. Output ONLY JSON." },
          { type: "image_url", image_url: { url: base64Image } }
        ]
      }
    ],
    // بالا بردن کمی خلاقیت برای درک بهتر دست‌خط‌ها یا فونت‌های مختلف
    temperature: 0.2, 
    top_p: 0.9
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

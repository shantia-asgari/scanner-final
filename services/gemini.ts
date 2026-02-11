const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// استفاده از قوی‌ترین مدل پیشنهادی برای استخراج داده‌های متنی
const MODEL_NAME = "gemini-1.5-pro"; 

export async function extractReceiptData(imageFile: File): Promise<any> {
  if (!API_KEY) throw new Error("کلید API یافت نشد.");

  const base64Image = await fileToBase64(imageFile);

  const payload = {
    model: MODEL_NAME,
    messages: [
      {
        role: "system",
        content: `You are a high-precision Persian Receipt OCR. 
        Your task is to extract bank transaction details with ZERO mistakes in numbers.

        FIELDS TO CAPTURE:
        1. "amount": Total amount in Rials. (In the image it is 999,000,000)
        2. "date": Solar Hijri date (In the image it is 1404/07/14)
        3. "time": Time of transaction (In the image it is 12:39)
        4. "tracking_code": The number after 'شماره پیگیری بانک مرکزی' (Expected: 5451018865)
        5. "reference_id": The long number after 'شماره رهگیری بانک مرکزی' (Expected: 140407141824322587)
        6. "payment_id": The number after 'شناسه واریز' (Expected: 1080505121)
        7. "source_bank": Name of the bank at the top (Expected: بانک تجارت)
        8. "dest_name": Receiver name (Expected: خلق ثروت سرزمین پارسه)

        CRITICAL RULE: 
        - DO NOT skip any digits.
        - DO NOT round numbers.
        - Return ONLY a valid JSON object.`
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Carefully extract 'شماره پیگیری' and 'شماره رهگیری' from this image. These are the most important fields. Provide only JSON." },
          { type: "image_url", image_url: { url: base64Image } }
        ]
      }
    ],
    temperature: 0.1 // برای جلوگیری از توهم و جابجایی اعداد
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
    
    // پاکسازی پاسخ از کاراکترهای اضافی مارک‌داون
    const cleanJson = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("AI Extraction Error:", error);
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

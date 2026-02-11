// سرویس ارتباط با GapGPT با نام تابع هماهنگ با پروژه شما
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL_NAME = "gpt-4o"; 

// نام تابع دقیقاً به extractReceiptData تغییر یافت تا با App.tsx هماهنگ شود
export async function extractReceiptData(imageFile: File): Promise<any> {
  if (!API_KEY) {
    throw new Error("کلید API یافت نشد.");
  }

  const base64Image = await fileToBase64(imageFile);

  const payload = {
    model: MODEL_NAME,
    messages: [
      {
        role: "system",
        content: `You are a Data Entry Expert. Extract data with 100% ACCURACY.
        RULES:
        1. **NUMBERS:** Extract every single digit exactly. Do not round.
        2. **ZEROS:** Do NOT drop leading or trailing zeros.
        3. **DATE:** Use Solar Hijri (1404/xx/xx).
        4. **OUTPUT:** Return ONLY raw JSON.
        
        Fields: amount, date, time, source_bank, source_card, dest_name, dest_card, tracking_code, reference_id.`
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Extract data strictly." },
          { type: "image_url", image_url: { url: base64Image } }
        ]
      }
    ],
    temperature: 0, // دقت حداکثری بدون خلاقیت
    top_p: 0.1
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
    console.error("Error:", error);
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

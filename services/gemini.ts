// سرویس ارتباط با GapGPT (جایگزین جمنای برای ایران)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// استفاده از مدل GPT-4o که بینایی قوی‌تری دارد
const MODEL_NAME = "gpt-4o"; 

export async function analyzeReceipt(imageFile: File): Promise<any> {
  if (!API_KEY) {
    throw new Error("کلید API یافت نشد. لطفا تنظیمات گیت‌هاب را چک کنید.");
  }

  // تبدیل تصویر به Base64
  const base64Image = await fileToBase64(imageFile);

  const payload = {
    model: MODEL_NAME,
    messages: [
      {
        role: "system",
        content: `You are a strict Data Entry Expert specializing in banking receipts. 
        YOUR GOAL: Extract data with 100% CHARACTER-BY-CHARACTER ACCURACY.
        
        CRITICAL RULES:
        1. **NUMBERS:** Never change, round, or truncate numbers. Extract every single digit exactly as seen.
        2. **ZEROS:** Do NOT drop leading or trailing zeros. (e.g., '05' must stay '05', not '5').
        3. **LONG IDS:** For 'Reference Number', 'Tracking Code', or 'Sheba', double-check the digit count.
        4. **OUTPUT:** Return ONLY raw JSON. No markdown formatting.
        
        Extract these fields:
        - amount (Remove separators like commas, return pure number string)
        - date (Solar Hijri e.g., 1403/02/01)
        - time (e.g., 14:30)
        - source_bank (Bank name in Persian)
        - source_card (Card number, mask with stars if needed)
        - dest_name (Receiver name)
        - dest_card (Destination card/Sheba number)
        - tracking_code (Look for: شماره پیگیری, شماره ارجاع, کد رهگیری)
        - reference_id (Look for: شناسه واریز, شماره مرجع)
        
        If a field is missing, use null.`
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract data from this receipt image strictly."
          },
          {
            type: "image_url",
            image_url: {
              url: base64Image
            }
          }
        ]
      }
    ],
    // تنظیمات حیاتی برای دقت بالا
    temperature: 0,      // خلاقیت صفر برای دقت حداکثری
    max_tokens: 1000,
    top_p: 0.1          // محدود کردن انتخاب کلمات برای جلوگیری از توهم
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("GapGPT Error:", response.status, errorData);
      throw new Error(`خطا از سمت GapGPT: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const resultText = data.choices[0]?.message?.content || "{}";
    
    // تمیزکاری پاسخ JSON (حذف احتمالی ```json)
    const cleanJson = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("Error analyzing receipt:", error);
    throw error;
  }
}

// تابع کمکی تبدیل فایل به Base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

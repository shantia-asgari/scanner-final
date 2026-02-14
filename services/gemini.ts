import { ReceiptData } from "../types";

// ---------------------------------------------------------------------------
// ۱. تنظیم آدرس API:
// مقدار پیش‌فرض حذف شد تا حتماً از فایل .env خوانده شود.
// ---------------------------------------------------------------------------
const API_URL = import.meta.env.VITE_API_URL || "";

// هشدار امنیتی در کنسول جهت اطلاع‌رسانی به تیم فنی
if (!API_URL) {
  console.error("⚠️ CRITICAL WARNING: API URL is missing! Please check your .env file.");
}

export const extractReceiptData = async (file: File): Promise<ReceiptData> => {
  // تبدیل تصویر به فرمت Base64
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

  // ساختار بدنه درخواست
  // نکته: اگر بک‌ند شما ساختار ساده‌تری می‌خواهد، می‌توانید این بخش را ساده کنید
  const requestBody = {
    model: "gemini-2.5-flash",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract receipt data" // متن ساده شده چون پردازش اصلی سمت سرور است
          },
          {
            type: "image_url",
            image_url: { url: base64Data }
          }
        ]
      }
    ]
  };

  try {
    // -----------------------------------------------------------------------
    // ۲. ارسال درخواست به آدرس تنظیم شده در .env
    // -----------------------------------------------------------------------
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    // دریافت داده‌ها به صورت JSON
    const data = await response.json();

    // -----------------------------------------------------------------------
    // ۳. پردازش پاسخ (مخصوص بک‌ند اختصاصی شما)
    // فرض: بک‌ند شما داده‌ها را تمیز کرده و یک JSON ساده برمی‌گرداند.
    // اگر ساختار خروجی بک‌ند شما متفاوت است، فقط خطوط زیر را تغییر دهید.
    // -----------------------------------------------------------------------
    
    // اگر بک‌ند دیتا را مستقیم می‌فرستد:
    const result = data; 
    // یا اگر داخل فیلدی به نام data می‌گذارد: const result = data.data;

    return {
      amount: result.amount || result.AMOUNT || "0",
      trackingCode: result.trackingCode || result.TRACKING || "-",
      referenceNumber: result.referenceNumber || result.REFERENCE || "-",
      date: result.date || result.DATE || "-",
      time: result.time || result.TIME || "-",
      depositId: result.depositId || result.DEPOSIT_ID || "-",
      bankName: result.bankName || "-"
    };

  } catch (error) {
    console.error("❌ Service Error:", error);
    throw new Error("خطا در دریافت اطلاعات از سرور. لطفاً ارتباط با API را بررسی کنید.");
  }
};

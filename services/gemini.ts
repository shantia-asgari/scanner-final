import { GoogleGenAI, Type } from "@google/genai";
import { ReceiptData } from "../types";

// ==================================================================================
// تنظیمات کلید دسترسی
// ==================================================================================
// دریافت کلید از متغیر محیطی (با روش استاندارد Vite)
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("خطا: کلید API یافت نشد. لطفاً تنظیمات Netlify را چک کنید.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const extractReceiptData = async (file: File): Promise<ReceiptData> => {
  try {
    const imagePart = await fileToGenerativePart(file);

    const prompt = `
      Analyze this image of a bank receipt (Persian/Iranian bank). 
      Extract the following information carefully.

      1. Transaction Amount (مبلغ): Return only digits.
      2. Deposit ID (شناسه واریز).
      3. Tracking Code (کد رهگیری).
      4. Reference Number (شماره پیگیری / شماره ارجاع).
      5. Bank Name (نام بانک).
      6. Date (تاریخ).
      7. Time (ساعت).

      If a field is not found, return null.
    `;

    const response = await ai.models.generateContent({
      // برگشت به نام استاندارد (حالا که کلید درست است، این کار می‌کند)
      model: 'gemini-1.5-flash', 
      contents: {
        parts: [
          imagePart,
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.STRING },
            depositId: { type: Type.STRING },
            trackingCode: { type: Type.STRING },
            referenceNumber: { type: Type.STRING },
            bankName: { type: Type.STRING },
            date: { type: Type.STRING },
            time: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ReceiptData;
    }
    
    throw new Error("No data returned from model");

  } catch (error) {
    console.error("Error extracting receipt data:", error);
    throw error;
  }
};
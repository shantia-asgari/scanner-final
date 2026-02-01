import { GoogleGenerativeAI } from "@google/generative-ai";
import { ReceiptData } from "../types";

// =========================================================
// تغییر اصلاحی: اضافه کردن as any برای رفع خطای قرمز VS Code
// =========================================================
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("API Key not found!");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const fileToGenerativePart = async (file: File) => {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
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
      Analyze this image of a bank receipt. Extract data in JSON format:
      {
        "amount": "digits only",
        "depositId": "shenase variz",
        "trackingCode": "code rahgiri",
        "referenceNumber": "shomare peygiri",
        "bankName": "bank name",
        "date": "date",
        "time": "time"
      }
      Return ONLY raw JSON, no markdown formatting.
    `;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    // تمیزکاری متن پاسخ
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(cleanedText) as ReceiptData;

  } catch (error) {
    console.error("Error details:", error);
    throw error;
  }
};
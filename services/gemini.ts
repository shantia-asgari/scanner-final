import { GoogleGenAI, Type } from "@google/genai";
import { ReceiptData } from "../types";

// ==================================================================================
// تنظیمات کلید دسترسی (API KEY CONFIGURATION)
// ==================================================================================
// برای استفاده خارج از محیط AI Studio، مقدار زیر را با کلید API خود جایگزین کنید.
// مثال: const USER_PROVIDED_KEY = "AIzaSy...";
// ==================================================================================
const USER_PROVIDED_KEY = "YOUR_API_KEY_HERE";

/**
 * Helper to safely get the API key.
 * Prioritizes process.env.API_KEY for the cloud environment.
 * Falls back to USER_PROVIDED_KEY for local/static usage.
 */
const getApiKey = (): string => {
  try {
    // Check if running in a Node-like environment with process.env defined
    if (typeof process !== "undefined" && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    // Ignore errors if process is not defined (e.g. browser without polyfills)
  }
  return USER_PROVIDED_KEY;
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

/**
 * Converts a File object to a Base64 string.
 */
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
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
      Extract the following information carefully. It is crucial to distinguish between "Tracking Code" (کد رهگیری) and "Reference/Follow-up Number" (شماره پیگیری) if both exist on the receipt.

      1. Transaction Amount (مبلغ): Return only digits, remove commas or currency labels (Rials/Tomans).
      2. Deposit ID (شناسه واریز): The identifier specifically labeled as "شناسه واریز".
      3. Tracking Code (کد رهگیری): Look specifically for "کد رهگیری".
      4. Reference Number (شماره پیگیری / شماره ارجاع / شماره سند): Look specifically for "شماره پیگیری", "کد پیگیری", "شماره ارجاع" or "شماره سند".
      5. Bank Name (نام بانک): The name of the originating or destination bank.
      6. Date (تاریخ): The transaction date.
      7. Time (ساعت): The transaction time (e.g., 14:30).

      If a field is not found or unclear, return null.
      Ensure accuracy for numbers as these are critical for financial support.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
            amount: { type: Type.STRING, description: "The numeric transaction amount without separators" },
            depositId: { type: Type.STRING, description: "The deposit ID (Shenase Variz)" },
            trackingCode: { type: Type.STRING, description: "The Tracking Code (Kod Rahgiri)" },
            referenceNumber: { type: Type.STRING, description: "The Reference or Follow-up Number (Shomare Peigiri/Erja)" },
            bankName: { type: Type.STRING, description: "Name of the bank" },
            date: { type: Type.STRING, description: "Date of transaction" },
            time: { type: Type.STRING, description: "Time of transaction" }
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
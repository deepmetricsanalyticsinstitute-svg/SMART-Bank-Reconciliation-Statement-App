import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Transaction, TransactionType } from "../types";

// Define the response schema for parsing transactions
const transactionSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      date: { type: Type.STRING, description: "Date of transaction in YYYY-MM-DD format" },
      description: { type: Type.STRING, description: "Description or payee of the transaction" },
      amount: { type: Type.NUMBER, description: "Absolute numeric value of the transaction amount" },
      type: { type: Type.STRING, enum: ["DEBIT", "CREDIT"], description: "Whether money is leaving (DEBIT) or entering (CREDIT)" },
      reference: { type: Type.STRING, description: "Any reference number, check number, or ID found" }
    },
    required: ["date", "description", "amount", "type"]
  }
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Converts a File object to a Base64 string for Gemini
 */
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data URL prefix (e.g., "data:application/pdf;base64,")
      const base64Content = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Content,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Parses a document (PDF/CSV) using Gemini to extract standardized transactions
 */
export const parseDocumentWithGemini = async (
  file: File, 
  source: 'BANK' | 'LEDGER'
): Promise<Transaction[]> => {
  try {
    const filePart = await fileToGenerativePart(file);

    const prompt = `
      Analyze this ${source === 'BANK' ? 'Bank Statement' : 'General Ledger'} file.
      Extract all financial transactions into a structured list.
      
      Rules:
      1. Normalize all dates to YYYY-MM-DD.
      2. Ensure 'amount' is a positive number. Determine 'type' (DEBIT/CREDIT) based on columns like "Withdrawal/Deposit" or signed values.
      3. If the description is messy, clean it up slightly but keep key identifiers.
      4. Ignore header rows, page numbers, or summary lines. Only extract individual transaction rows.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [filePart, { text: prompt }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: transactionSchema,
        systemInstruction: "You are an expert financial data extraction assistant. Your job is to convert messy PDF/CSV financial documents into strict JSON data."
      }
    });

    if (!response.text) {
      throw new Error("No data returned from Gemini");
    }

    const rawData = JSON.parse(response.text);
    
    // Post-process to add IDs and Source
    return rawData.map((t: any, index: number) => ({
      ...t,
      id: `${source}-${Date.now()}-${index}`, // Generate a temporary unique ID
      source: source
    }));

  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    throw new Error(`Failed to parse ${source} file. Please ensure it is a legible PDF or CSV.`);
  }
};

export interface ReceiptData {
  amount: string | null;
  depositId: string | null;
  trackingCode: string | null;
  referenceNumber: string | null;
  bankName: string | null;
  date: string | null;
  time: string | null;
}

export interface ExtractionResult {
  data: ReceiptData | null;
  rawText?: string;
}
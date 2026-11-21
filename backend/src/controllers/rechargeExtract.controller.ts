import type { Request, Response } from "express";
import { runOcr } from "../lib/ocr.js";
import { parseOcrText } from "../lib/ocrParser.js";

/**
 * POST /api/shop/recharge/extract
 * Body: multipart/form-data with field "screenshot"
 * Response: { trxId, account, amount, confidence, rawText? }
 *
 * Does NOT save anything. Stateless — extract → return → discard.
 */
export async function extractRechargeDetails(req: Request, res: Response) {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No screenshot uploaded." });
  }

  try {
    const rawText = await runOcr(req.file.buffer);
    const result = parseOcrText(rawText);

    return res.json({
      success: true,
      data: {
        trxId: result.trxId,
        account: result.account,
        amount: result.amount,
        confidence: result.confidence,
        // rawText useful for debugging — hide in production if desired
        rawText: result.rawText,
      },
    });
  } catch (error) {
    console.error("OCR extraction failed:", error);
    const message =
      error instanceof Error && error.message === "OCR timed out"
        ? "Screenshot took too long to process. Please try a smaller image."
        : "Failed to read screenshot. Please enter details manually.";
    return res.status(500).json({ success: false, message });
  }
}

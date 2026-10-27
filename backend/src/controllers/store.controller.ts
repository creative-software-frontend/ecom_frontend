import type { Request, Response } from "express";
import { readJsonFile } from "../services/db.service.js";

export async function getStoreSettings(req: Request, res: Response) {
  try {
    const store = await readJsonFile("store.json");
    return res.status(200).json({ success: true, data: store });
  } catch (error) {
    console.error("Error fetching store settings:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

import fs from "fs/promises";
import path from "path";

const dataDir = path.join(import.meta.dirname, "../data");
export async function readJsonFile(filename: string) {
  const filePath = path.join(dataDir, filename);
  const data = await fs.readFile(filePath, "utf-8");
  return JSON.parse(data);
}

export async function writeJsonFile(filename: string, data: any) {
  const filePath = path.join(dataDir, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/** Bangladesh administrative divisions — mirrors the backend enum. */
export const BD_DIVISIONS = [
  "Dhaka",
  "Chattogram",
  "Sylhet",
  "Rajshahi",
  "Khulna",
  "Barishal",
  "Rangpur",
  "Mymensingh",
] as const

export type BdDivision = (typeof BD_DIVISIONS)[number]

export function isBdDivision(value: string): value is BdDivision {
  return (BD_DIVISIONS as readonly string[]).includes(value)
}

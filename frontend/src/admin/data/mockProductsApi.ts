import type { ProductCreateInput } from "../types/product"
import { products } from "./products"

export const PRODUCTS_WITH_ORDERS = ["product-002", "product-005"] as const

const DELETE_DELAY_MS = 500
const GET_DELAY_MS = 400
const UPDATE_DELAY_MS = 600

export class MockProductApiError extends Error {
  public readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "MockProductApiError"
    this.status = status
  }
}

export class DeleteProductError extends Error {
  public readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "DeleteProductError"
    this.status = status
  }
}

export async function mockSubmitProduct(
  product: ProductCreateInput
): Promise<ProductCreateInput> {
  return new Promise<ProductCreateInput>((resolve) => {
    window.setTimeout(() => resolve(product), 600)
  })
}

export async function getProduct(id: string) {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, GET_DELAY_MS)
  })

  const product = products.find((candidate) => candidate.id === id)
  if (!product) {
    throw new MockProductApiError("Product not found.", 404)
  }

  return product
}

export async function updateProduct(
  _id: string,
  input: ProductCreateInput
): Promise<ProductCreateInput> {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, UPDATE_DELAY_MS)
  })

  return input
}

export async function deleteProduct(id: string): Promise<void> {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, DELETE_DELAY_MS)
  })

  if ((PRODUCTS_WITH_ORDERS as readonly string[]).includes(id)) {
    throw new DeleteProductError(
      "This product has orders and cannot be deleted.",
      409
    )
  }
}

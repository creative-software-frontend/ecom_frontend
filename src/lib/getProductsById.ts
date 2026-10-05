import productData from "../data/ProductData.json"

const getProductsById = (id: string) => {
  const product = productData.products.find((product) => product.id === id)
  return product || null
}
export default getProductsById

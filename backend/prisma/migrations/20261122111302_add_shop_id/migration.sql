/*
  Warnings:

  - Made the column `product_id` on table `product_variants` required. This step will fail if there are existing NULL values in that column.
  - Made the column `price` on table `product_variants` required. This step will fail if there are existing NULL values in that column.
  - Made the column `shop_id` on table `products` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `product_variants` DROP FOREIGN KEY `product_variants_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `products` DROP FOREIGN KEY `products_shop_id_fkey`;

-- AlterTable
ALTER TABLE `product_variants` MODIFY `product_id` INTEGER NOT NULL,
    MODIFY `price` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `products` MODIFY `shop_id` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - Added the required column `shop_id` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `products` ADD COLUMN `badge` VARCHAR(191) NULL,
    ADD COLUMN `buying_price` INTEGER NULL,
    ADD COLUMN `color_options` JSON NULL,
    ADD COLUMN `description` LONGTEXT NULL,
    ADD COLUMN `enable_stock_alert` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `is_blocked` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `is_featured` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `is_free_shipping` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `is_public` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `max_order_qty` INTEGER NULL,
    ADD COLUMN `product_type` VARCHAR(191) NOT NULL DEFAULT 'single',
    ADD COLUMN `rank` INTEGER NULL,
    ADD COLUMN `sales_count` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `section` VARCHAR(191) NULL,
    ADD COLUMN `seo` JSON NULL,
    ADD COLUMN `shop_id` INTEGER NULL,
    ADD COLUMN `short_description` TEXT NULL,
    ADD COLUMN `size_options` JSON NULL,
    ADD COLUMN `sku` VARCHAR(191) NULL,
    ADD COLUMN `specifications` JSON NULL,
    ADD COLUMN `stock_alert_qty` INTEGER NULL,
    ADD COLUMN `subcategory` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `product_variants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NULL,
    `size` VARCHAR(191) NULL,
    `color` VARCHAR(191) NULL,
    `sku` VARCHAR(191) NULL,
    `price` INTEGER NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `product_variants_product_id_idx`(`product_id`),
    UNIQUE INDEX `product_variants_product_id_size_color_key`(`product_id`, `size`, `color`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `products_shop_id_is_active_idx` ON `products`(`shop_id`, `is_active`);

-- CreateIndex
CREATE INDEX `products_shop_id_is_blocked_idx` ON `products`(`shop_id`, `is_blocked`);

-- CreateIndex
CREATE INDEX `products_sales_count_idx` ON `products`(`sales_count`);

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE `orders` ADD COLUMN `shop_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `orders_shop_id_created_at_idx` ON `orders`(`shop_id`, `created_at`);

-- Backfill: existing orders belong to the default Power Zenox shop.
UPDATE `orders`
SET `shop_id` = (SELECT `id` FROM `shops` WHERE `slug` = 'power-zenox' LIMIT 1)
WHERE `shop_id` IS NULL;

-- Verification: this must return 0 before the NOT NULL migration runs.
SELECT COUNT(*) AS `orders_with_null_shop_id` FROM `orders` WHERE `shop_id` IS NULL;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

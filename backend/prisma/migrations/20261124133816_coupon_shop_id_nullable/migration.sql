-- AlterTable
ALTER TABLE `coupons` ADD COLUMN `shop_id` INTEGER NULL;

-- Backfill: existing coupons belong to the default Power Zenox shop.
UPDATE `coupons`
SET `shop_id` = (SELECT `id` FROM `shops` WHERE `slug` = 'power-zenox' LIMIT 1)
WHERE `shop_id` IS NULL;

-- Verification: this must return 0 before the NOT NULL migration runs.
SELECT COUNT(*) AS `coupons_with_null_shop_id` FROM `coupons` WHERE `shop_id` IS NULL;

-- AddForeignKey
ALTER TABLE `coupons` ADD CONSTRAINT `coupons_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

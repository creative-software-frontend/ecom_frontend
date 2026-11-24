-- AlterTable
ALTER TABLE `pages` ADD COLUMN `shop_id` INTEGER NULL;

-- Backfill: existing pages belong to the default Power Zenox shop.
UPDATE `pages`
SET `shop_id` = (SELECT `id` FROM `shops` WHERE `slug` = 'power-zenox' LIMIT 1)
WHERE `shop_id` IS NULL;

-- Verification: this must return 0 before the NOT NULL migration runs.
SELECT COUNT(*) AS `pages_with_null_shop_id` FROM `pages` WHERE `shop_id` IS NULL;

-- AddForeignKey
ALTER TABLE `pages` ADD CONSTRAINT `pages_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

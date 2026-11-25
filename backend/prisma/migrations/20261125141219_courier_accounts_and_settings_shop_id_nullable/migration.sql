/*
  Warnings:

  - A unique constraint covering the columns `[shop_id]` on the table `courier_settings` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `courier_settings` ADD COLUMN `shop_id` INTEGER NULL;

-- Backfill: the existing singleton row belongs to the default Power Zenox shop.
-- No courier account rows are seeded; ensureShopCourierAccounts() creates four
-- clean (disabled / not_connected / no credentials) rows per shop on first read.
UPDATE `courier_settings`
SET `shop_id` = (SELECT `id` FROM `shops` WHERE `slug` = 'power-zenox' LIMIT 1)
WHERE `shop_id` IS NULL;

-- Verification: this must return 0 before the NOT NULL migration runs.
SELECT COUNT(*) AS `courier_settings_with_null_shop_id` FROM `courier_settings` WHERE `shop_id` IS NULL;

-- CreateTable
CREATE TABLE `courier_accounts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shop_id` INTEGER NOT NULL,
    `slug` VARCHAR(30) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT false,
    `base_url` VARCHAR(255) NULL,
    `api_key` TEXT NULL,
    `secret_key` TEXT NULL,
    `client_id` VARCHAR(255) NULL,
    `client_secret` TEXT NULL,
    `username` VARCHAR(255) NULL,
    `password` TEXT NULL,
    `store_id` VARCHAR(255) NULL,
    `access_token` TEXT NULL,
    `client_context` VARCHAR(255) NULL,
    `credentials_legacy` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'not_connected',
    `status_message` VARCHAR(255) NULL,
    `balance` DECIMAL(12, 2) NULL,
    `checked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `courier_accounts_shop_id_enabled_idx`(`shop_id`, `enabled`),
    UNIQUE INDEX `courier_accounts_shop_id_slug_key`(`shop_id`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `courier_settings_shop_id_key` ON `courier_settings`(`shop_id`);

-- AddForeignKey
ALTER TABLE `courier_settings` ADD CONSTRAINT `courier_settings_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `courier_accounts` ADD CONSTRAINT `courier_accounts_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

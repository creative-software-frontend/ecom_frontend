/*
  Warnings:

  - Made the column `shop_id` on table `courier_settings` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `courier_settings` DROP FOREIGN KEY `courier_settings_shop_id_fkey`;

-- AlterTable
ALTER TABLE `courier_settings` MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `shop_id` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `courier_settings` ADD CONSTRAINT `courier_settings_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

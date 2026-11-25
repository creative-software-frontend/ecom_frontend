/*
  Warnings:

  - A unique constraint covering the columns `[shop_id,code]` on the table `coupons` will be added. If there are existing duplicate values, this will fail.
  - Made the column `shop_id` on table `coupons` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `coupons` DROP FOREIGN KEY `coupons_shop_id_fkey`;

-- DropIndex
DROP INDEX `coupons_code_key` ON `coupons`;

-- DropIndex
DROP INDEX `coupons_shop_id_fkey` ON `coupons`;

-- DropIndex
DROP INDEX `coupons_status_idx` ON `coupons`;

-- AlterTable
ALTER TABLE `coupons` MODIFY `shop_id` INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX `coupons_shop_id_status_idx` ON `coupons`(`shop_id`, `status`);

-- CreateIndex
CREATE UNIQUE INDEX `coupons_shop_id_code_key` ON `coupons`(`shop_id`, `code`);

-- AddForeignKey
ALTER TABLE `coupons` ADD CONSTRAINT `coupons_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

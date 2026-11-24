/*
  Warnings:

  - A unique constraint covering the columns `[shop_id,slug]` on the table `pages` will be added. If there are existing duplicate values, this will fail.
  - Made the column `shop_id` on table `pages` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `pages` DROP FOREIGN KEY `pages_shop_id_fkey`;

-- DropIndex
DROP INDEX `pages_shop_id_fkey` ON `pages`;

-- DropIndex
DROP INDEX `pages_slug_key` ON `pages`;

-- AlterTable
ALTER TABLE `pages` MODIFY `shop_id` INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX `pages_shop_id_status_idx` ON `pages`(`shop_id`, `status`);

-- CreateIndex
CREATE UNIQUE INDEX `pages_shop_id_slug_key` ON `pages`(`shop_id`, `slug`);

-- AddForeignKey
ALTER TABLE `pages` ADD CONSTRAINT `pages_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

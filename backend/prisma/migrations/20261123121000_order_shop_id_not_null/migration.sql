-- DropForeignKey
ALTER TABLE `orders` DROP FOREIGN KEY `orders_shop_id_fkey`;

-- AlterTable
ALTER TABLE `orders` MODIFY `shop_id` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

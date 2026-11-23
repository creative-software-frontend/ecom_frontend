-- AlterTable
ALTER TABLE `orders` ADD COLUMN `shop_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `orders_shop_id_created_at_idx` ON `orders`(`shop_id`, `created_at`);

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

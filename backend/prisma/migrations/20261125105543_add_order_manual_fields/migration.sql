-- AlterTable
ALTER TABLE `orders` ADD COLUMN `advance` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `assigned_to_id` INTEGER NULL,
    ADD COLUMN `courier` VARCHAR(191) NULL,
    ADD COLUMN `courier_note` TEXT NULL,
    ADD COLUMN `discount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `source` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `orders_assigned_to_id_idx` ON `orders`(`assigned_to_id`);

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_assigned_to_id_fkey` FOREIGN KEY (`assigned_to_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

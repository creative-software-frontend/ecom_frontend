-- AlterTable
ALTER TABLE `shops` ADD COLUMN `division` VARCHAR(191) NOT NULL DEFAULT 'Dhaka',
    ADD COLUMN `owner_name` VARCHAR(191) NULL;

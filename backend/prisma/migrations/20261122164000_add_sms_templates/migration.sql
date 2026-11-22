CREATE TABLE `sms_templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shop_id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `sms_templates_shop_id_created_at_idx`(`shop_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `sms_templates`
    ADD CONSTRAINT `sms_templates_shop_id_fkey`
    FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

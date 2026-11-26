-- CreateTable
CREATE TABLE `courier_shipments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `shop_id` INTEGER NOT NULL,
    `courier_slug` VARCHAR(30) NOT NULL,
    `is_sandbox` BOOLEAN NOT NULL DEFAULT false,
    `consignment_id` VARCHAR(120) NULL,
    `tracking_code` VARCHAR(120) NULL,
    `courier_status` VARCHAR(60) NULL,
    `delivery_fee` INTEGER NULL,
    `city_id` INTEGER NULL,
    `zone_id` INTEGER NULL,
    `area_id` INTEGER NULL,
    `area_name` VARCHAR(150) NULL,
    `error_message` VARCHAR(255) NULL,
    `raw_response` JSON NULL,
    `dispatched_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `courier_shipments_order_id_created_at_idx`(`order_id`, `created_at`),
    INDEX `courier_shipments_shop_id_courier_slug_idx`(`shop_id`, `courier_slug`),
    INDEX `courier_shipments_consignment_id_idx`(`consignment_id`),
    INDEX `courier_shipments_tracking_code_idx`(`tracking_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `courier_shipments` ADD CONSTRAINT `courier_shipments_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `courier_shipments` ADD CONSTRAINT `courier_shipments_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

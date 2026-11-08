-- CreateTable
CREATE TABLE `courier_settings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `flat_fee_enabled` BOOLEAN NOT NULL DEFAULT true,
    `inside_dhaka_fee` INTEGER NOT NULL DEFAULT 60,
    `sub_dhaka_fee` INTEGER NOT NULL DEFAULT 100,
    `outside_dhaka_fee` INTEGER NOT NULL DEFAULT 130,
    `free_delivery_above` INTEGER NOT NULL DEFAULT 2000,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

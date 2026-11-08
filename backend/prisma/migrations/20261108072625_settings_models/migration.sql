-- CreateTable
CREATE TABLE `store_settings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `name` VARCHAR(191) NOT NULL,
    `tagline` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `logo` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NOT NULL,
    `phone_2` VARCHAR(191) NULL,
    `whatsapp` VARCHAR(191) NOT NULL,
    `whatsapp_2` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `address` TEXT NOT NULL,
    `google_maps_url` TEXT NULL,
    `facebook` VARCHAR(191) NULL,
    `instagram` VARCHAR(191) NULL,
    `youtube` VARCHAR(191) NULL,
    `tiktok` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `storefront_settings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `announcement_enabled` BOOLEAN NOT NULL DEFAULT false,
    `announcement_text` TEXT NULL,
    `order_note` TEXT NULL,
    `primary_color` VARCHAR(191) NOT NULL DEFAULT '#0D9488',
    `background_color` VARCHAR(191) NOT NULL DEFAULT '#FAF8FF',
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_settings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `duplicate_block_enabled` BOOLEAN NOT NULL DEFAULT true,
    `duplicate_block_minutes` INTEGER NOT NULL DEFAULT 15,
    `location_fields_enabled` BOOLEAN NOT NULL DEFAULT true,
    `delivery_inside_dhaka` INTEGER NOT NULL DEFAULT 70,
    `delivery_outside_dhaka` INTEGER NOT NULL DEFAULT 120,
    `free_delivery_above` INTEGER NOT NULL DEFAULT 2000,
    `mobile_verification_enabled` BOOLEAN NOT NULL DEFAULT false,
    `sms_confirmation_enabled` BOOLEAN NOT NULL DEFAULT false,
    `vpn_protection_enabled` BOOLEAN NOT NULL DEFAULT false,
    `courier_protection_enabled` BOOLEAN NOT NULL DEFAULT false,
    `courier_min_success_ratio` INTEGER NOT NULL DEFAULT 65,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `marketing_settings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `facebook_enabled` BOOLEAN NOT NULL DEFAULT false,
    `facebook_pixel_id` VARCHAR(191) NULL,
    `facebook_test_event_code` VARCHAR(191) NULL,
    `facebook_token_encrypted` TEXT NULL,
    `facebook_token_updated_at` DATETIME(3) NULL,
    `tiktok_enabled` BOOLEAN NOT NULL DEFAULT false,
    `tiktok_pixel_id` VARCHAR(191) NULL,
    `tiktok_token_encrypted` TEXT NULL,
    `tiktok_token_updated_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `banners` (
    `id` VARCHAR(191) NOT NULL,
    `image_url` TEXT NOT NULL,
    `alt_text` VARCHAR(191) NULL,
    `link_url` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `position` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `banners_is_active_position_idx`(`is_active`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coupons` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `discount_type` VARCHAR(191) NOT NULL,
    `discount_value` INTEGER NOT NULL,
    `note` VARCHAR(191) NULL,
    `used` INTEGER NOT NULL DEFAULT 0,
    `usage_limit` INTEGER NULL,
    `max_discount_value` INTEGER NULL,
    `min_purchase_value` INTEGER NULL,
    `expires_at` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `coupons_code_key`(`code`),
    INDEX `coupons_status_idx`(`status`),
    INDEX `coupons_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pages` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `content_html` LONGTEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `language` VARCHAR(191) NOT NULL DEFAULT 'EN',
    `last_edited_by` VARCHAR(191) NOT NULL,
    `revision_count` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pages_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `page_revisions` (
    `id` VARCHAR(191) NOT NULL,
    `page_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content_html` LONGTEXT NOT NULL,
    `edited_by` VARCHAR(191) NOT NULL,
    `edited_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `page_revisions_page_id_edited_at_idx`(`page_id`, `edited_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `page_revisions` ADD CONSTRAINT `page_revisions_page_id_fkey` FOREIGN KEY (`page_id`) REFERENCES `pages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

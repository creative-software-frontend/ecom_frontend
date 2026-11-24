-- CreateTable
CREATE TABLE `brands` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shop_id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `logo_url` TEXT NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `brands_shop_id_is_active_idx`(`shop_id`, `is_active`),
    UNIQUE INDEX `brands_shop_id_slug_key`(`shop_id`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shop_id` INTEGER NOT NULL,
    `parent_id` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `categories_shop_id_parent_id_is_active_idx`(`shop_id`, `parent_id`, `is_active`),
    UNIQUE INDEX `categories_shop_id_slug_key`(`shop_id`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `brands` ADD CONSTRAINT `brands_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill catalog terms already used by products. All statements are
-- idempotent: INSERT IGNORE + deterministic slugs keep re-runs harmless.
-- A short MD5 suffix guarantees (shop_id, slug) uniqueness even when two
-- different names slugify identically or a name has no latin characters.

-- Brands from distinct, non-empty product brand_name values.
INSERT IGNORE INTO `brands` (`shop_id`, `name`, `slug`, `is_active`, `created_at`, `updated_at`)
SELECT
    src.shop_id,
    src.name,
    CASE
        WHEN src.base_slug = '' THEN CONCAT('brand-', LOWER(SUBSTRING(MD5(CONCAT(src.shop_id, ':', src.name)), 1, 8)))
        ELSE CONCAT(LEFT(src.base_slug, 54), '-', LOWER(SUBSTRING(MD5(CONCAT(src.shop_id, ':', src.name)), 1, 6)))
    END,
    1,
    NOW(3),
    NOW(3)
FROM (
    SELECT
        p.shop_id,
        TRIM(p.brand_name) AS name,
        TRIM(BOTH '-' FROM LEFT(REGEXP_REPLACE(LOWER(TRIM(p.brand_name)), '[^a-z0-9]+', '-'), 60)) AS base_slug
    FROM `products` p
    WHERE p.brand_name IS NOT NULL AND TRIM(p.brand_name) <> ''
    GROUP BY p.shop_id, TRIM(p.brand_name)
) src;

-- Top-level categories from distinct, non-empty product category values.
INSERT IGNORE INTO `categories` (`shop_id`, `parent_id`, `name`, `slug`, `is_active`, `created_at`, `updated_at`)
SELECT
    src.shop_id,
    NULL,
    src.name,
    CASE
        WHEN src.base_slug = '' THEN CONCAT('category-', LOWER(SUBSTRING(MD5(CONCAT('parent:', src.shop_id, ':', src.name)), 1, 8)))
        ELSE CONCAT(LEFT(src.base_slug, 54), '-', LOWER(SUBSTRING(MD5(CONCAT('parent:', src.shop_id, ':', src.name)), 1, 6)))
    END,
    1,
    NOW(3),
    NOW(3)
FROM (
    SELECT
        p.shop_id,
        TRIM(p.category) AS name,
        TRIM(BOTH '-' FROM LEFT(REGEXP_REPLACE(LOWER(TRIM(p.category)), '[^a-z0-9]+', '-'), 60)) AS base_slug
    FROM `products` p
    WHERE p.category IS NOT NULL AND TRIM(p.category) <> ''
    GROUP BY p.shop_id, TRIM(p.category)
) src;

-- Subcategories linked to their parent category from the same shop.
INSERT IGNORE INTO `categories` (`shop_id`, `parent_id`, `name`, `slug`, `is_active`, `created_at`, `updated_at`)
SELECT
    src.shop_id,
    parent.id,
    src.name,
    CASE
        WHEN src.base_slug = '' THEN CONCAT('category-', LOWER(SUBSTRING(MD5(CONCAT('sub:', src.shop_id, ':', src.name)), 1, 8)))
        ELSE CONCAT(LEFT(src.base_slug, 54), '-', LOWER(SUBSTRING(MD5(CONCAT('sub:', src.shop_id, ':', src.name)), 1, 6)))
    END,
    1,
    NOW(3),
    NOW(3)
FROM (
    SELECT DISTINCT
        p.shop_id,
        TRIM(p.category) AS category_name,
        TRIM(p.subcategory) AS name,
        TRIM(BOTH '-' FROM LEFT(REGEXP_REPLACE(LOWER(TRIM(p.subcategory)), '[^a-z0-9]+', '-'), 60)) AS base_slug
    FROM `products` p
    WHERE p.subcategory IS NOT NULL AND TRIM(p.subcategory) <> ''
      AND p.category IS NOT NULL AND TRIM(p.category) <> ''
) src
JOIN `categories` parent
  ON parent.shop_id = src.shop_id
 AND parent.parent_id IS NULL
 AND parent.name = src.category_name;

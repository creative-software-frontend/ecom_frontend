-- =====================================================
-- STEP 1: Create new tables (safe — empty tables)
-- =====================================================

CREATE TABLE `shops` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'active',
  `trial_ends_at` DATETIME(3) NULL,
  `expiry_date` DATETIME(3) NULL,
  `mobile` VARCHAR(191) NULL,
  `address` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `shops_slug_key`(`slug`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `roles` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `display_name` VARCHAR(191) NOT NULL,
  `scope` VARCHAR(191) NOT NULL,
  `permissions` JSON NOT NULL,
  `is_system` BOOLEAN NOT NULL DEFAULT false,
  `description` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `roles_name_key`(`name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `audit_logs` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `shop_id` VARCHAR(191) NULL,
  `action` VARCHAR(191) NOT NULL,
  `entity_type` VARCHAR(191) NULL,
  `entity_id` VARCHAR(191) NULL,
  `metadata` JSON NULL,
  `ip_address` VARCHAR(191) NULL,
  `user_agent` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `audit_logs_created_at_idx`(`created_at`),
  INDEX `audit_logs_user_id_idx`(`user_id`),
  INDEX `audit_logs_shop_id_idx`(`shop_id`),
  INDEX `audit_logs_action_idx`(`action`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =====================================================
-- STEP 2: Rename admins → users (⚠️ CRITICAL)
-- =====================================================

RENAME TABLE `admins` TO `users`;

-- =====================================================
-- STEP 3: Add new columns to users (nullable initially)
-- =====================================================

ALTER TABLE `users`
  ADD COLUMN `name` VARCHAR(191) NOT NULL DEFAULT 'Admin',
  ADD COLUMN `mobile` VARCHAR(191) NULL,
  ADD COLUMN `role_id` VARCHAR(191) NULL,
  ADD COLUMN `shop_id` VARCHAR(191) NULL,
  ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'active',
  ADD COLUMN `email_verified_at` DATETIME(3) NULL,
  ADD COLUMN `last_login_at` DATETIME(3) NULL;

-- =====================================================
-- STEP 4: Insert 6 system roles (idempotent UUID)
-- =====================================================

INSERT INTO `roles` (`id`, `name`, `display_name`, `scope`, `permissions`, `is_system`, `created_at`, `updated_at`) VALUES
  (UUID(), 'super_admin', 'Super Admin', 'platform', '{"*":["*"]}', true, NOW(3), NOW(3)),
  (UUID(), 'platform_manager', 'Platform Manager', 'platform', '{"users":["read"],"audit":["read"]}', true, NOW(3), NOW(3)),
  (UUID(), 'shop_admin', 'Shop Admin', 'shop', '{"products":["*"],"orders":["*"],"settings":["*"],"coupons":["*"],"pages":["*"],"marketing":["*"],"courier":["*"]}', true, NOW(3), NOW(3)),
  (UUID(), 'salesman', 'Salesman', 'shop', '{"orders":["read","update"]}', true, NOW(3), NOW(3)),
  (UUID(), 'order_handler', 'Order Handler', 'shop', '{"orders":["read","update"]}', true, NOW(3), NOW(3)),
  (UUID(), 'product_uploader', 'Product Uploader', 'shop', '{"products":["read","create","update"]}', true, NOW(3), NOW(3));

-- =====================================================
-- STEP 5: Insert "Power Zenox" shop
-- =====================================================

INSERT INTO `shops` (`id`, `name`, `slug`, `status`, `created_at`, `updated_at`) VALUES
  (UUID(), 'Power Zenox', 'power-zenox', 'active', NOW(3), NOW(3));

-- =====================================================
-- STEP 6: Backfill existing admin(s) → super_admin role
-- =====================================================

UPDATE `users` SET
  `role_id` = (SELECT id FROM `roles` WHERE name = 'super_admin' LIMIT 1),
  `shop_id` = NULL,
  `status` = 'active'
WHERE `role_id` IS NULL;

-- =====================================================
-- STEP 7: Make role_id NOT NULL (all users now have a role)
-- =====================================================

ALTER TABLE `users` MODIFY `role_id` VARCHAR(191) NOT NULL;

-- =====================================================
-- STEP 8: Add foreign keys
-- =====================================================

ALTER TABLE `users`
  ADD CONSTRAINT `users_role_id_fkey`
    FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `users_shop_id_fkey`
    FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `audit_logs_shop_id_fkey`
    FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
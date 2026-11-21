CREATE TABLE `mobile_verifications` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `mobile` VARCHAR(20) NOT NULL,
  `code_hash` CHAR(64) NOT NULL,
  `verification_token_hash` CHAR(64) NULL,
  `attempts` INTEGER NOT NULL DEFAULT 0,
  `expires_at` DATETIME(3) NOT NULL,
  `verified_at` DATETIME(3) NULL,
  `consumed_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `mobile_verifications_mobile_created_at_idx`(`mobile`, `created_at`),
  INDEX `mobile_verifications_expires_at_idx`(`expires_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `users`
  ADD COLUMN `mobile_verified_at` DATETIME(3) NULL;

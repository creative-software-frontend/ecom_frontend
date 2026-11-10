-- Replace UUID primary keys with sequential integer IDs while preserving
-- each table's rows and its foreign-key relationships.
-- audit_logs.entity_id stays text because it is a polymorphic historical
-- reference and may point to records that have since been deleted.

ALTER TABLE `order_items` DROP FOREIGN KEY `order_items_product_id_fkey`;
ALTER TABLE `reviews` DROP FOREIGN KEY `reviews_product_id_fkey`;
ALTER TABLE `users`
  DROP FOREIGN KEY `users_role_id_fkey`,
  DROP FOREIGN KEY `users_shop_id_fkey`;
ALTER TABLE `audit_logs`
  DROP FOREIGN KEY `audit_logs_user_id_fkey`,
  DROP FOREIGN KEY `audit_logs_shop_id_fkey`;
ALTER TABLE `page_revisions` DROP FOREIGN KEY `page_revisions_page_id_fkey`;

ALTER TABLE `products` ADD COLUMN `id_new` INTEGER NOT NULL AUTO_INCREMENT UNIQUE FIRST;
ALTER TABLE `order_items` ADD COLUMN `id_new` INTEGER NOT NULL AUTO_INCREMENT UNIQUE FIRST;
ALTER TABLE `reviews` ADD COLUMN `id_new` INTEGER NOT NULL AUTO_INCREMENT UNIQUE FIRST;
ALTER TABLE `users` ADD COLUMN `id_new` INTEGER NOT NULL AUTO_INCREMENT UNIQUE FIRST;
ALTER TABLE `roles` ADD COLUMN `id_new` INTEGER NOT NULL AUTO_INCREMENT UNIQUE FIRST;
ALTER TABLE `shops` ADD COLUMN `id_new` INTEGER NOT NULL AUTO_INCREMENT UNIQUE FIRST;
ALTER TABLE `audit_logs` ADD COLUMN `id_new` INTEGER NOT NULL AUTO_INCREMENT UNIQUE FIRST;
ALTER TABLE `banners` ADD COLUMN `id_new` INTEGER NOT NULL AUTO_INCREMENT UNIQUE FIRST;
ALTER TABLE `coupons` ADD COLUMN `id_new` INTEGER NOT NULL AUTO_INCREMENT UNIQUE FIRST;
ALTER TABLE `pages` ADD COLUMN `id_new` INTEGER NOT NULL AUTO_INCREMENT UNIQUE FIRST;
ALTER TABLE `page_revisions` ADD COLUMN `id_new` INTEGER NOT NULL AUTO_INCREMENT UNIQUE FIRST;

UPDATE `order_items` oi
INNER JOIN `products` p ON oi.`product_id` = p.`id`
SET oi.`product_id` = p.`id_new`;

UPDATE `reviews` r
INNER JOIN `products` p ON r.`product_id` = p.`id`
SET r.`product_id` = p.`id_new`;

UPDATE `users` u
INNER JOIN `roles` r ON u.`role_id` = r.`id`
SET u.`role_id` = r.`id_new`;

UPDATE `users` u
INNER JOIN `shops` s ON u.`shop_id` = s.`id`
SET u.`shop_id` = s.`id_new`;

UPDATE `audit_logs` a
INNER JOIN `users` u ON a.`user_id` = u.`id`
SET a.`user_id` = u.`id_new`;

UPDATE `audit_logs` a
INNER JOIN `shops` s ON a.`shop_id` = s.`id`
SET a.`shop_id` = s.`id_new`;

UPDATE `page_revisions` pr
INNER JOIN `pages` p ON pr.`page_id` = p.`id`
SET pr.`page_id` = p.`id_new`;

ALTER TABLE `order_items` MODIFY `product_id` INTEGER NOT NULL;
ALTER TABLE `reviews` MODIFY `product_id` INTEGER NOT NULL;
ALTER TABLE `users`
  MODIFY `role_id` INTEGER NOT NULL,
  MODIFY `shop_id` INTEGER NULL;
ALTER TABLE `audit_logs`
  MODIFY `user_id` INTEGER NOT NULL,
  MODIFY `shop_id` INTEGER NULL;
ALTER TABLE `page_revisions` MODIFY `page_id` INTEGER NOT NULL;

ALTER TABLE `products`
  DROP PRIMARY KEY,
  DROP COLUMN `id`,
  CHANGE COLUMN `id_new` `id` INTEGER NOT NULL AUTO_INCREMENT,
  ADD PRIMARY KEY (`id`);
ALTER TABLE `products` DROP INDEX `id_new`;

ALTER TABLE `order_items`
  DROP PRIMARY KEY,
  DROP COLUMN `id`,
  CHANGE COLUMN `id_new` `id` INTEGER NOT NULL AUTO_INCREMENT,
  ADD PRIMARY KEY (`id`);
ALTER TABLE `order_items` DROP INDEX `id_new`;

ALTER TABLE `reviews`
  DROP PRIMARY KEY,
  DROP COLUMN `id`,
  CHANGE COLUMN `id_new` `id` INTEGER NOT NULL AUTO_INCREMENT,
  ADD PRIMARY KEY (`id`);
ALTER TABLE `reviews` DROP INDEX `id_new`;

ALTER TABLE `users`
  DROP PRIMARY KEY,
  DROP COLUMN `id`,
  CHANGE COLUMN `id_new` `id` INTEGER NOT NULL AUTO_INCREMENT,
  ADD PRIMARY KEY (`id`);
ALTER TABLE `users` DROP INDEX `id_new`;

ALTER TABLE `roles`
  DROP PRIMARY KEY,
  DROP COLUMN `id`,
  CHANGE COLUMN `id_new` `id` INTEGER NOT NULL AUTO_INCREMENT,
  ADD PRIMARY KEY (`id`);
ALTER TABLE `roles` DROP INDEX `id_new`;

ALTER TABLE `shops`
  DROP PRIMARY KEY,
  DROP COLUMN `id`,
  CHANGE COLUMN `id_new` `id` INTEGER NOT NULL AUTO_INCREMENT,
  ADD PRIMARY KEY (`id`);
ALTER TABLE `shops` DROP INDEX `id_new`;

ALTER TABLE `audit_logs`
  DROP PRIMARY KEY,
  DROP COLUMN `id`,
  CHANGE COLUMN `id_new` `id` INTEGER NOT NULL AUTO_INCREMENT,
  ADD PRIMARY KEY (`id`);
ALTER TABLE `audit_logs` DROP INDEX `id_new`;

ALTER TABLE `banners`
  DROP PRIMARY KEY,
  DROP COLUMN `id`,
  CHANGE COLUMN `id_new` `id` INTEGER NOT NULL AUTO_INCREMENT,
  ADD PRIMARY KEY (`id`);
ALTER TABLE `banners` DROP INDEX `id_new`;

ALTER TABLE `coupons`
  DROP PRIMARY KEY,
  DROP COLUMN `id`,
  CHANGE COLUMN `id_new` `id` INTEGER NOT NULL AUTO_INCREMENT,
  ADD PRIMARY KEY (`id`);
ALTER TABLE `coupons` DROP INDEX `id_new`;

ALTER TABLE `pages`
  DROP PRIMARY KEY,
  DROP COLUMN `id`,
  CHANGE COLUMN `id_new` `id` INTEGER NOT NULL AUTO_INCREMENT,
  ADD PRIMARY KEY (`id`);
ALTER TABLE `pages` DROP INDEX `id_new`;

ALTER TABLE `page_revisions`
  DROP PRIMARY KEY,
  DROP COLUMN `id`,
  CHANGE COLUMN `id_new` `id` INTEGER NOT NULL AUTO_INCREMENT,
  ADD PRIMARY KEY (`id`);
ALTER TABLE `page_revisions` DROP INDEX `id_new`;

ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_product_id_fkey`
  FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_product_id_fkey`
  FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `users`
  ADD CONSTRAINT `users_role_id_fkey`
  FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `users_shop_id_fkey`
  FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `audit_logs_shop_id_fkey`
  FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `page_revisions`
  ADD CONSTRAINT `page_revisions_page_id_fkey`
  FOREIGN KEY (`page_id`) REFERENCES `pages` (`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

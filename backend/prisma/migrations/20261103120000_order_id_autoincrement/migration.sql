-- Align orders.id / order_items.order_id with schema.prisma
-- (Int auto-increment instead of UUID strings).

-- Remove the foreign key while the key type is being changed.
ALTER TABLE `order_items` DROP FOREIGN KEY `order_items_order_id_fkey`;

-- Give every existing order a numeric id and copy it onto its items.
ALTER TABLE `orders` ADD COLUMN `id_int` INTEGER NOT NULL AUTO_INCREMENT UNIQUE FIRST;

UPDATE `order_items` oi
INNER JOIN `orders` o ON oi.order_id = o.id
SET oi.order_id = CAST(o.id_int AS CHAR);

-- Replace the UUID primary key with the integer key.
ALTER TABLE `orders`
  DROP PRIMARY KEY,
  DROP COLUMN `id`;

ALTER TABLE `orders`
  CHANGE COLUMN `id_int` `id` INTEGER NOT NULL AUTO_INCREMENT,
  ADD PRIMARY KEY (`id`);

ALTER TABLE `orders` DROP INDEX `id_int`;

-- Convert the foreign key column to match.
ALTER TABLE `order_items` MODIFY `order_id` INTEGER NOT NULL;

-- Restore the foreign key.
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_fkey`
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

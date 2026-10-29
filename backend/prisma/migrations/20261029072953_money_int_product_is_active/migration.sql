-- AlterTable
ALTER TABLE `order_items` MODIFY `unit_price` INTEGER NOT NULL,
    MODIFY `line_total` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `orders` MODIFY `delivery_charge` INTEGER NOT NULL,
    MODIFY `subtotal` INTEGER NOT NULL,
    MODIFY `total` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `products` ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true,
    MODIFY `current_price` INTEGER NOT NULL,
    MODIFY `regular_price` INTEGER NOT NULL;

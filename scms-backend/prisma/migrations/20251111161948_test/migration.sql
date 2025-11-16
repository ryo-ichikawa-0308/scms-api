/*
  Warnings:

  - The primary key for the `contracts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `services` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user_services` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE `contracts` DROP FOREIGN KEY `contracts_user_services_id_fkey`;

-- DropForeignKey
ALTER TABLE `contracts` DROP FOREIGN KEY `contracts_users_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_services` DROP FOREIGN KEY `user_services_services_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_services` DROP FOREIGN KEY `user_services_users_id_fkey`;

-- DropIndex
DROP INDEX `users_email_key` ON `users`;

-- AlterTable
ALTER TABLE `contracts` DROP PRIMARY KEY,
    MODIFY `id` CHAR(36) NOT NULL,
    MODIFY `users_id` CHAR(36) NOT NULL,
    MODIFY `user_services_id` CHAR(36) NOT NULL,
    ALTER COLUMN `quantity` DROP DEFAULT,
    MODIFY `registered_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `registered_by` CHAR(36) NOT NULL,
    MODIFY `updated_at` TIMESTAMP(3) NULL,
    MODIFY `updated_by` CHAR(36) NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `services` DROP PRIMARY KEY,
    MODIFY `id` CHAR(36) NOT NULL,
    MODIFY `name` VARCHAR(256) NOT NULL,
    MODIFY `description` VARCHAR(256) NOT NULL,
    ALTER COLUMN `price` DROP DEFAULT,
    MODIFY `registered_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `registered_by` CHAR(36) NOT NULL,
    MODIFY `updated_at` TIMESTAMP(3) NULL,
    MODIFY `updated_by` CHAR(36) NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `user_services` DROP PRIMARY KEY,
    MODIFY `id` CHAR(36) NOT NULL,
    MODIFY `users_id` CHAR(36) NOT NULL,
    MODIFY `services_id` CHAR(36) NOT NULL,
    ALTER COLUMN `stock` DROP DEFAULT,
    MODIFY `registered_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `registered_by` CHAR(36) NOT NULL,
    MODIFY `updated_at` TIMESTAMP(3) NULL,
    MODIFY `updated_by` CHAR(36) NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `users` DROP PRIMARY KEY,
    ADD COLUMN `token` VARCHAR(2048) NULL,
    MODIFY `id` CHAR(36) NOT NULL,
    MODIFY `name` VARCHAR(256) NOT NULL,
    MODIFY `email` VARCHAR(256) NOT NULL,
    MODIFY `password` VARCHAR(256) NOT NULL,
    MODIFY `registered_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `registered_by` CHAR(36) NOT NULL,
    MODIFY `updated_at` TIMESTAMP(3) NULL,
    MODIFY `updated_by` CHAR(36) NULL,
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `user_services` ADD CONSTRAINT `user_services_users_id_fkey` FOREIGN KEY (`users_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_services` ADD CONSTRAINT `user_services_services_id_fkey` FOREIGN KEY (`services_id`) REFERENCES `services`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_users_id_fkey` FOREIGN KEY (`users_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_user_services_id_fkey` FOREIGN KEY (`user_services_id`) REFERENCES `user_services`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- RenameIndex
ALTER TABLE `services` RENAME INDEX `services_name_is_deleted_key` TO `idx_services_name_available`;

-- RenameIndex
ALTER TABLE `user_services` RENAME INDEX `user_services_users_id_services_id_key` TO `idx_user_services_unique`;

-- RenameIndex
ALTER TABLE `users` RENAME INDEX `users_email_is_deleted_key` TO `idx_users_available_email`;

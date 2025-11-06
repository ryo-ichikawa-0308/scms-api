-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `registered_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `registered_by` VARCHAR(36) NOT NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `updated_by` VARCHAR(36) NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `idx_users_name`(`name`),
    UNIQUE INDEX `users_email_is_deleted_key`(`email`, `is_deleted`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `services` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `price` INTEGER NOT NULL DEFAULT 0,
    `unit` VARCHAR(16) NOT NULL,
    `registered_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `registered_by` VARCHAR(36) NOT NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `updated_by` VARCHAR(36) NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `services_name_is_deleted_key`(`name`, `is_deleted`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contracts` (
    `id` VARCHAR(36) NOT NULL,
    `users_id` VARCHAR(36) NOT NULL,
    `user_services_id` VARCHAR(36) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `registered_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `registered_by` VARCHAR(36) NOT NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `updated_by` VARCHAR(36) NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    INDEX `idx_users_id`(`users_id`),
    INDEX `idx_user_services_id`(`user_services_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_services` (
    `id` VARCHAR(36) NOT NULL,
    `users_id` VARCHAR(36) NOT NULL,
    `services_id` VARCHAR(36) NOT NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `registered_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `registered_by` VARCHAR(36) NOT NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `updated_by` VARCHAR(36) NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    INDEX `idx_user_services_users_id`(`users_id`),
    INDEX `idx_user_services_services_id`(`services_id`),
    UNIQUE INDEX `user_services_users_id_services_id_key`(`users_id`, `services_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_users_id_fkey` FOREIGN KEY (`users_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_user_services_id_fkey` FOREIGN KEY (`user_services_id`) REFERENCES `user_services`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_services` ADD CONSTRAINT `user_services_users_id_fkey` FOREIGN KEY (`users_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_services` ADD CONSTRAINT `user_services_services_id_fkey` FOREIGN KEY (`services_id`) REFERENCES `services`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

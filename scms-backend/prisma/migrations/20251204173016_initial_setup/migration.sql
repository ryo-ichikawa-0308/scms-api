-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(256) NOT NULL,
    `email` VARCHAR(256) NOT NULL,
    `password` VARCHAR(256) NOT NULL,
    `token` VARCHAR(2048) NULL,
    `registered_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `registered_by` CHAR(36) NOT NULL,
    `updated_at` TIMESTAMP(3) NULL,
    `updated_by` CHAR(36) NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    INDEX `idx_users_name`(`name`),
    UNIQUE INDEX `idx_users_available_email`(`email` ASC, `is_deleted` ASC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `services` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(256) NOT NULL,
    `description` VARCHAR(256) NOT NULL,
    `price` INTEGER NOT NULL,
    `unit` VARCHAR(16) NOT NULL,
    `registered_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `registered_by` CHAR(36) NOT NULL,
    `updated_at` TIMESTAMP(3) NULL,
    `updated_by` CHAR(36) NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `idx_services_name_available`(`name` ASC, `is_deleted` ASC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_services` (
    `id` CHAR(36) NOT NULL,
    `users_id` CHAR(36) NOT NULL,
    `services_id` CHAR(36) NOT NULL,
    `stock` INTEGER NOT NULL,
    `registered_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `registered_by` CHAR(36) NOT NULL,
    `updated_at` TIMESTAMP(3) NULL,
    `updated_by` CHAR(36) NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    INDEX `idx_user_services_users_id`(`users_id` ASC),
    INDEX `idx_user_services_services_id`(`services_id` ASC),
    UNIQUE INDEX `idx_user_services_unique`(`users_id` ASC, `services_id` ASC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contracts` (
    `id` CHAR(36) NOT NULL,
    `users_id` CHAR(36) NOT NULL,
    `user_services_id` CHAR(36) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `registered_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `registered_by` CHAR(36) NOT NULL,
    `updated_at` TIMESTAMP(3) NULL,
    `updated_by` CHAR(36) NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    INDEX `idx_users_id`(`users_id` ASC),
    INDEX `idx_user_services_id`(`user_services_id` ASC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_services` ADD CONSTRAINT `user_services_users_id_fkey` FOREIGN KEY (`users_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_services` ADD CONSTRAINT `user_services_services_id_fkey` FOREIGN KEY (`services_id`) REFERENCES `services`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_users_id_fkey` FOREIGN KEY (`users_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_user_services_id_fkey` FOREIGN KEY (`user_services_id`) REFERENCES `user_services`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

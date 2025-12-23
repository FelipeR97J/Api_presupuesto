-- ============================================
-- RESET COMPLETO DE BASE DE DATOS
-- Elimina y recrea todas las tablas
-- ============================================

-- Desactivar verificación de claves foráneas temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar todas las tablas
DROP TABLE IF EXISTS `user_roles`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `estados`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `instruments`;
DROP TABLE IF EXISTS `incomes`;
DROP TABLE IF EXISTS `expenses`;
DROP TABLE IF EXISTS `debts`;
DROP TABLE IF EXISTS `credit_cards`;
DROP TABLE IF EXISTS `banks`;
DROP TABLE IF EXISTS `income_categories`;
DROP TABLE IF EXISTS `expense_categories`;
DROP TABLE IF EXISTS `inventory_items`;

-- ============================================
-- CREAR TABLA: estados (Mantenedor centralizado)
-- ============================================
CREATE TABLE `estados` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` INT NOT NULL UNIQUE,
  `description` VARCHAR(255),
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar estados base
INSERT INTO `estados` (name, description) VALUES
  (0, 'Activo'),
  (1, 'Inactivo');

-- ============================================
-- CREAR TABLA: roles
-- ============================================
CREATE TABLE `roles` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255),
  `permissions` JSON,
  `id_estado` INT DEFAULT 0,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` TIMESTAMP NULL,
  FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CREAR TABLA: users (CON id_rol Y id_estado)
-- ============================================
CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT 'ID único del usuario - NO MODIFICABLE',
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `firstName` VARCHAR(100) NOT NULL,
  `paternalLastName` VARCHAR(100) NOT NULL,
  `maternalLastName` VARCHAR(100),
  `rut` VARCHAR(20) NOT NULL UNIQUE,
  `birthDate` DATE,
  `phoneNumber` VARCHAR(20),
  `id_rol` INT,
  `id_estado` INT DEFAULT 0,
  `lastLoginAt` TIMESTAMP NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` TIMESTAMP NULL,
  FOREIGN KEY (`id_rol`) REFERENCES `roles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CREAR TABLA: categories
-- ============================================
CREATE TABLE `categories` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255),
  `id_estado` INT DEFAULT 0,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` TIMESTAMP NULL,
  FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CREAR TABLA: instruments
-- ============================================
CREATE TABLE `instruments` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT 'ID único - NO MODIFICABLE',
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255),
  `id_estado` INT DEFAULT 0,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` TIMESTAMP NULL,
  FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CREAR TABLA: income_categories
-- ============================================
CREATE TABLE `income_categories` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT 'ID único - NO MODIFICABLE',
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255),
  `id_estado` INT DEFAULT 0,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` TIMESTAMP NULL,
  FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CREAR TABLA: incomes
-- ============================================
CREATE TABLE `incomes` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT 'ID único - NO MODIFICABLE',
  `amount` DECIMAL(10, 2) NOT NULL,
  `description` VARCHAR(255),
  `categoryId` INT,
  `id_estado` INT DEFAULT 0,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` TIMESTAMP NULL,
  FOREIGN KEY (`categoryId`) REFERENCES `income_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CREAR TABLA: expense_categories
-- ============================================
CREATE TABLE `expense_categories` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT 'ID único - NO MODIFICABLE',
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255),
  `id_estado` INT DEFAULT 0,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` TIMESTAMP NULL,
  FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CREAR TABLA: banks
-- ============================================
CREATE TABLE `banks` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `id_estado` INT DEFAULT 0,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` TIMESTAMP NULL,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CREAR TABLA: credit_cards
-- ============================================
CREATE TABLE `credit_cards` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `bankId` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `id_estado` INT DEFAULT 0,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` TIMESTAMP NULL,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`bankId`) REFERENCES `banks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CREAR TABLE: debts
-- ============================================
CREATE TABLE `debts` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `creditCardId` INT NOT NULL,
  `totalAmount` DECIMAL(10, 2) NOT NULL,
  `installments` INT NOT NULL,
  `description` VARCHAR(255),
  `startDate` DATE,
  `id_estado` INT DEFAULT 0,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` TIMESTAMP NULL,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`creditCardId`) REFERENCES `credit_cards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CREAR TABLA: expenses
-- ============================================
CREATE TABLE `expenses` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT 'ID único - NO MODIFICABLE',
  `amount` DECIMAL(10, 2) NOT NULL,
  `description` VARCHAR(255),
  `categoryId` INT,
  `debtId` INT,
  `id_estado` INT DEFAULT 0,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` TIMESTAMP NULL,
  FOREIGN KEY (`categoryId`) REFERENCES `expense_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (`debtId`) REFERENCES `debts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CREAR TABLA: inventory_items
-- ============================================
CREATE TABLE `inventory_items` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT 'ID único - NO MODIFICABLE',
  `name` VARCHAR(100) NOT NULL,
  `quantity` INT DEFAULT 0,
  `description` VARCHAR(255),
  `id_estado` INT DEFAULT 0,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` TIMESTAMP NULL,
  FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reactivar verificación de claves foráneas
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- VERIFICACIÓN: Ver estado de las tablas
-- ============================================
SELECT 
  TABLE_NAME,
  TABLE_ROWS,
  AUTO_INCREMENT
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'buncluster'
ORDER BY TABLE_NAME;

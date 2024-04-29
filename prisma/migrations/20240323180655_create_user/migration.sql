/*
  Warnings:

  - Added the required column `kundenNummer` to the `createKunde` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `createkunde` ADD COLUMN `kundenNummer` VARCHAR(191) NOT NULL;

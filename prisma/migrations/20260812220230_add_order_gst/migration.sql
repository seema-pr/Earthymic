/*
  Warnings:

  - Added the required column `gstAmount` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "gstAmount" DECIMAL(10,2) NOT NULL;

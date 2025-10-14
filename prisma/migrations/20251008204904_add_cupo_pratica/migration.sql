/*
  Warnings:

  - Added the required column `cupo` to the `practicas_deportivas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "practicas_deportivas" ADD COLUMN     "cupo" INTEGER NOT NULL;

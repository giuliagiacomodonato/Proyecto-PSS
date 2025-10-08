/*
  Warnings:

  - You are about to drop the column `numero` on the `canchas` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nombre]` on the table `canchas` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nombre` to the `canchas` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."canchas_numero_key";

-- AlterTable: Primero agregamos la columna nombre permitiendo NULL temporalmente
ALTER TABLE "canchas" ADD COLUMN "nombre" TEXT;

-- Copiamos los datos de numero a nombre (convirtiéndolos a texto)
UPDATE "canchas" SET "nombre" = CAST("numero" AS TEXT);

-- Ahora hacemos la columna NOT NULL
ALTER TABLE "canchas" ALTER COLUMN "nombre" SET NOT NULL;

-- Eliminamos la columna numero
ALTER TABLE "canchas" DROP COLUMN "numero";

-- CreateIndex
CREATE UNIQUE INDEX "canchas_nombre_key" ON "canchas"("nombre");

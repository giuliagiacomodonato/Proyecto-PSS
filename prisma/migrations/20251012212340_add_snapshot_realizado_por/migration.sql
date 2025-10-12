/*
  Warnings:

  - Added the required column `realizadoPorDni` to the `usuarios_bajas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `realizadoPorNombre` to the `usuarios_bajas` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "usuarios_bajas" DROP CONSTRAINT "usuarios_bajas_realizadoPorId_fkey";

-- AlterTable: Agregar columnas con valores por defecto temporales
ALTER TABLE "usuarios_bajas" ADD COLUMN "realizadoPorDni" TEXT NOT NULL DEFAULT 'DESCONOCIDO',
ADD COLUMN "realizadoPorNombre" TEXT NOT NULL DEFAULT 'Usuario Desconocido',
ALTER COLUMN "realizadoPorId" DROP NOT NULL;

-- Actualizar registros existentes con datos del usuario que realizó la baja (si existe)
UPDATE "usuarios_bajas" ub
SET "realizadoPorNombre" = u.nombre,
    "realizadoPorDni" = u.dni
FROM "usuarios" u
WHERE ub."realizadoPorId" = u.id;

-- Remover los valores por defecto
ALTER TABLE "usuarios_bajas" ALTER COLUMN "realizadoPorDni" DROP DEFAULT;
ALTER TABLE "usuarios_bajas" ALTER COLUMN "realizadoPorNombre" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "usuarios_bajas" ADD CONSTRAINT "usuarios_bajas_realizadoPorId_fkey" FOREIGN KEY ("realizadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

/*
  Warnings:

  - Changed the type of `tipo` on the `canchas` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TipoCancha" AS ENUM ('FUTBOL_5', 'FUTBOL', 'BASQUET');

-- AlterTable
ALTER TABLE "canchas" DROP COLUMN "tipo",
ADD COLUMN     "tipo" "TipoCancha" NOT NULL;

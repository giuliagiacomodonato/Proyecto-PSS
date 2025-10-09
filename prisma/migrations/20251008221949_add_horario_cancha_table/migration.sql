/*
  Warnings:

  - You are about to drop the column `horariosFin` on the `canchas` table. All the data in the column will be lost.
  - You are about to drop the column `horariosInicio` on the `canchas` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "canchas" DROP COLUMN "horariosFin",
DROP COLUMN "horariosInicio";

-- CreateTable
CREATE TABLE "horarios_cancha" (
    "id" SERIAL NOT NULL,
    "canchaId" INTEGER NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,

    CONSTRAINT "horarios_cancha_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "horarios_cancha" ADD CONSTRAINT "horarios_cancha_canchaId_fkey" FOREIGN KEY ("canchaId") REFERENCES "canchas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

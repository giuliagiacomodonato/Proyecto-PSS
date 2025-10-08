-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMIN', 'SOCIO', 'ENTRENADOR');

-- CreateEnum
CREATE TYPE "TipoSocio" AS ENUM ('INDIVIDUAL', 'FAMILIAR');

-- CreateEnum
CREATE TYPE "DiaSemana" AS ENUM ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "rol" "RolUsuario" NOT NULL,
    "nombre" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "contraseña" TEXT NOT NULL,
    "fechaAlta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipoSocio" "TipoSocio",
    "direccion" TEXT,
    "familiarId" INTEGER,
    "practicaDeportivaId" INTEGER,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practicas_deportivas" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "precio" INTEGER NOT NULL,

    CONSTRAINT "practicas_deportivas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horarios" (
    "id" SERIAL NOT NULL,
    "dia" "DiaSemana" NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "practicaDeportivaId" INTEGER NOT NULL,

    CONSTRAINT "horarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canchas" (
    "id" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "precio" INTEGER NOT NULL,
    "capacidad" INTEGER NOT NULL,
    "horariosInicio" TEXT NOT NULL,
    "horariosFin" TEXT NOT NULL,
    "practicaDeportivaId" INTEGER,

    CONSTRAINT "canchas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turnos" (
    "id" SERIAL NOT NULL,
    "canchaId" INTEGER NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "reservado" BOOLEAN NOT NULL DEFAULT false,
    "usuarioSocioId" INTEGER,

    CONSTRAINT "turnos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_dni_key" ON "usuarios"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "practicas_deportivas_nombre_key" ON "practicas_deportivas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "canchas_numero_key" ON "canchas"("numero");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_familiarId_fkey" FOREIGN KEY ("familiarId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_practicaDeportivaId_fkey" FOREIGN KEY ("practicaDeportivaId") REFERENCES "practicas_deportivas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horarios" ADD CONSTRAINT "horarios_practicaDeportivaId_fkey" FOREIGN KEY ("practicaDeportivaId") REFERENCES "practicas_deportivas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canchas" ADD CONSTRAINT "canchas_practicaDeportivaId_fkey" FOREIGN KEY ("practicaDeportivaId") REFERENCES "practicas_deportivas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_canchaId_fkey" FOREIGN KEY ("canchaId") REFERENCES "canchas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_usuarioSocioId_fkey" FOREIGN KEY ("usuarioSocioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

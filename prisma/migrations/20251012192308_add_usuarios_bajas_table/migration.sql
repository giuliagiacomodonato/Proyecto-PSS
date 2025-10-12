-- CreateTable
CREATE TABLE "usuarios_bajas" (
    "id" SERIAL NOT NULL,
    "usuarioEliminadoId" INTEGER NOT NULL,
    "usuarioEliminadoNombre" TEXT NOT NULL,
    "usuarioEliminadoDni" TEXT NOT NULL,
    "usuarioEliminadoEmail" TEXT NOT NULL,
    "rolUsuarioEliminado" "RolUsuario" NOT NULL,
    "fechaBaja" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo" TEXT,
    "realizadoPorId" INTEGER NOT NULL,

    CONSTRAINT "usuarios_bajas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "usuarios_bajas" ADD CONSTRAINT "usuarios_bajas_realizadoPorId_fkey" FOREIGN KEY ("realizadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

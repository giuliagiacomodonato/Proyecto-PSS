import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params
    const id = Number.parseInt(idParam)
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const body = await request.json()
    const { email, telefono, practicaDeportivaId, contraseña, direccion } = body

    // Validaciones del servidor
    if (!email || !telefono || !practicaDeportivaId) {
      return NextResponse.json({ error: "Email, teléfono y práctica deportiva son requeridos" }, { status: 400 })
    }

    // Validar email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "El correo electrónico no es válido" }, { status: 400 })
    }

    // Validar teléfono (solo números)
    if (!/^\d+$/.test(telefono)) {
      return NextResponse.json({ error: "El teléfono solo debe contener números" }, { status: 400 })
    }

    // Validar contraseña solo si se proporciona una nueva
    let hashedPassword: string | undefined
    if (contraseña) {
      if (contraseña.length < 8) {
        return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 })
      }

      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@\$%*?&._\-!]).+$/.test(contraseña)) {
        return NextResponse.json(
          { error: "La contraseña debe contener mayúscula, minúscula, número y carácter especial" },
          { status: 400 },
        )
      }

      hashedPassword = await bcrypt.hash(contraseña, 10)
    }

    // Verificar que el entrenador existe
    const entrenador = await prisma.usuario.findUnique({
      where: { id },
    })

    if (!entrenador) {
      return NextResponse.json({ error: "Entrenador no encontrado" }, { status: 404 })
    }

    // Verificar que la práctica deportiva existe
    const practicaDeportiva = await prisma.practicaDeportiva.findUnique({
      where: { id: practicaDeportivaId },
    })

    if (!practicaDeportiva) {
      return NextResponse.json({ error: "La práctica deportiva seleccionada no existe" }, { status: 400 })
    }

    // Verificar que el nuevo email no esté en uso por otro usuario (si cambió)
    if (email !== entrenador.email) {
      const existingUserByEmail = await prisma.usuario.findFirst({
        where: {
          email,
          NOT: { id },
        },
      })

      if (existingUserByEmail) {
        return NextResponse.json({ error: "Ya existe un usuario con ese correo electrónico" }, { status: 400 })
      }
    }

    // Actualizar el entrenador
    const updateData: Record<string, unknown> = {
      email,
      telefono,
      practicaDeportivaId,
    }

    if (direccion) {
      updateData.direccion = direccion
    }

    if (hashedPassword) {
      updateData.contraseña = hashedPassword
    }

    const entrenadorActualizado = await prisma.usuario.update({
      where: { id },
      data: updateData,
      include: {
        practicaDeportiva: true,
      },
    })

    // No devolver la contraseña en la respuesta
    const { contraseña: _, ...entrenadorSinPassword } = entrenadorActualizado

    return NextResponse.json(
      {
        message: "Entrenador actualizado exitosamente",
        entrenador: entrenadorSinPassword,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Error al actualizar entrenador:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

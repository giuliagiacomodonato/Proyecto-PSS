import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dni = searchParams.get("dni")

    if (!dni) {
      return NextResponse.json({ error: "DNI es requerido" }, { status: 400 })
    }

    const entrenador = await prisma.usuario.findUnique({
      where: { dni },
      include: { practicaDeportiva: true },
    })

    if (!entrenador) {
      return NextResponse.json({ error: "Entrenador no encontrado" }, { status: 404 })
    }

    // No devolver la contraseña
    const { contraseña: _, ...entrenadorSinPassword } = entrenador
    return NextResponse.json(entrenadorSinPassword)
  } catch (error) {
    console.error("[v0] Error al buscar entrenador:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, dni, fechaNacimiento, email, telefono, practicaDeportivaId, contraseña } = body

    // Validaciones del servidor
    if (!nombre || !dni || !fechaNacimiento || !email || !telefono || !practicaDeportivaId || !contraseña) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    // Validar nombre (solo caracteres)
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) {
      return NextResponse.json({ error: "El nombre solo debe contener letras" }, { status: 400 })
    }

    // Validar DNI (7-8 dígitos)
    if (!/^\d{7,8}$/.test(dni)) {
      return NextResponse.json({ error: "El DNI debe tener 7 u 8 dígitos" }, { status: 400 })
    }

    // Validar email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "El correo electrónico no es válido" }, { status: 400 })
    }

    // Validar teléfono (solo números)
    if (!/^\d+$/.test(telefono)) {
      return NextResponse.json({ error: "El teléfono solo debe contener números" }, { status: 400 })
    }

    // Validar contraseña (mínimo 8 caracteres con mayúscula, minúscula, número y carácter especial)
    if (contraseña.length < 8) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 })
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@\$%*?&._\-!]).+$/.test(contraseña)) {
      return NextResponse.json(
        { error: "La contraseña debe contener mayúscula, minúscula, número y carácter especial" },
        { status: 400 },
      )
    }

    // Verificar si el DNI ya existe
    const existingUserByDni = await prisma.usuario.findUnique({
      where: { dni },
    })

    if (existingUserByDni) {
      return NextResponse.json({ error: "Ya existe un usuario con ese DNI" }, { status: 400 })
    }

    // Verificar si el email ya existe (email ya no es unique en el schema)
    const existingUserByEmail = await prisma.usuario.findFirst({
      where: { email },
    })

    if (existingUserByEmail) {
      return NextResponse.json({ error: "Ya existe un usuario con ese correo electrónico" }, { status: 400 })
    }

    // Verificar que la práctica deportiva existe
    const practicaDeportiva = await prisma.practicaDeportiva.findUnique({
      where: { id: practicaDeportivaId },
    })

    if (!practicaDeportiva) {
      return NextResponse.json({ error: "La práctica deportiva seleccionada no existe" }, { status: 400 })
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(contraseña, 10)

    // Crear el entrenador
    const nuevoEntrenador = await prisma.usuario.create({
      data: {
        rol: "ENTRENADOR",
        nombre,
        dni,
        fechaNacimiento: new Date(fechaNacimiento),
        email,
        telefono,
        contraseña: hashedPassword,
        practicaDeportivaId,
      },
      include: {
        practicaDeportiva: true,
      },
    })

    // No devolver la contraseña en la respuesta
    const { contraseña: _, ...entrenadorSinPassword } = nuevoEntrenador

    return NextResponse.json(
      {
        message: "Entrenador registrado exitosamente",
        entrenador: entrenadorSinPassword,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Error al crear entrenador:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

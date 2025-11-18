import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { enviarCorreoBajaUsuario } from "@/lib/email"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dni = searchParams.get("dni")

    console.log('[GET /api/entrenadores] Buscando DNI:', dni)

    if (!dni) {
      return NextResponse.json({ error: "DNI es requerido" }, { status: 400 })
    }

    // Limpiar el DNI de espacios
    const dniLimpio = dni.trim()

    // Buscar entrenador por DNI y verificar que sea ENTRENADOR
    const entrenador = await prisma.usuario.findFirst({
      where: { 
        dni: dniLimpio,
        rol: 'ENTRENADOR'
      },
      include: { practicaDeportiva: true },
    })

    console.log('[GET /api/entrenadores] Resultado:', entrenador ? `Encontrado: ${entrenador.nombre}` : 'No encontrado')

    if (!entrenador) {
      return NextResponse.json({ error: "Entrenador no encontrado" }, { status: 404 })
    }

    // No devolver la contraseña
    const { contraseña: _, ...entrenadorSinPassword } = entrenador
    return NextResponse.json(entrenadorSinPassword)
  } catch (error) {
    console.error("[GET /api/entrenadores] Error al buscar entrenador:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, dni, fechaNacimiento, email, telefono, practicaDeportivaId, contraseña } = body

    console.log('[POST /api/entrenadores] Creando entrenador con DNI:', dni)

    // Validaciones del servidor
    if (!nombre || !dni || !fechaNacimiento || !email || !telefono || !practicaDeportivaId || !contraseña) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    // Limpiar DNI de espacios
    const dniLimpio = dni.trim()

    // Validar nombre (solo caracteres)
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) {
      return NextResponse.json({ error: "El nombre solo debe contener letras" }, { status: 400 })
    }

    // Validar DNI (7-8 dígitos)
    if (!/^\d{7,8}$/.test(dniLimpio)) {
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
      where: { dni: dniLimpio },
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
        dni: dniLimpio,
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

    console.log('[POST /api/entrenadores] Entrenador creado exitosamente:', nuevoEntrenador.id, '-', nuevoEntrenador.dni)

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

// DELETE - Eliminar entrenador
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { dni, realizadoPorId } = body

    if (!dni) {
      return NextResponse.json(
        { error: 'El DNI es requerido' },
        { status: 400 }
      )
    }

    // Validar formato de DNI
    if (!/^\d{7,8}$/.test(dni)) {
      return NextResponse.json(
        { error: 'El DNI debe tener 7 u 8 dígitos' },
        { status: 400 }
      )
    }

    // Buscar entrenador
    const entrenador = await prisma.usuario.findFirst({
      where: { 
        dni: dni,
        rol: 'ENTRENADOR'
      },
      include: {
        practicaDeportiva: true
      }
    })

    if (!entrenador) {
      return NextResponse.json(
        { error: 'No se encontró un entrenador con ese DNI' },
        { status: 404 }
      )
    }

    // Buscar usuario que realiza la baja (admin)
    let usuarioRealizaBaja = null
    if (realizadoPorId) {
      usuarioRealizaBaja = await prisma.usuario.findUnique({
        where: { id: realizadoPorId }
      })
      
      if (!usuarioRealizaBaja) {
        // Si no se encuentra, buscar cualquier admin disponible
        console.log('Usuario especificado no encontrado, buscando cualquier admin...')
        usuarioRealizaBaja = await prisma.usuario.findFirst({
          where: { rol: 'ADMIN' }
        })
      }
    } else {
      // Si no se proporciona ID, buscar cualquier admin disponible
      usuarioRealizaBaja = await prisma.usuario.findFirst({
        where: { rol: 'ADMIN' }
      })
    }

    // Usar transacción para garantizar atomicidad
    const resultado = await prisma.$transaction(async (tx: any) => {
      // 1. Registrar la baja en la tabla de auditoría (SNAPSHOT completo)
      const registroBaja = await tx.usuarioBaja.create({
        data: {
          // Snapshot del usuario eliminado
          usuarioEliminadoId: entrenador.id,
          usuarioEliminadoNombre: entrenador.nombre,
          usuarioEliminadoDni: entrenador.dni,
          usuarioEliminadoEmail: entrenador.email,
          rolUsuarioEliminado: entrenador.rol,
          // Snapshot del usuario que realiza la baja (puede ser null)
          realizadoPorId: usuarioRealizaBaja ? usuarioRealizaBaja.id : null,
          realizadoPorNombre: usuarioRealizaBaja ? usuarioRealizaBaja.nombre : 'Sistema',
          realizadoPorDni: usuarioRealizaBaja ? usuarioRealizaBaja.dni : 'N/A',
          motivo: 'Baja de entrenador desde el sistema'
        }
      })

      // 2. Eliminar el usuario de la base de datos
      await tx.usuario.delete({
        where: { id: entrenador.id }
      })

      return registroBaja
    })

    // Enviar correo de notificación al entrenador dado de baja
    console.log('[DELETE /api/entrenadores] Intentando enviar email a:', entrenador.email)
    try {
      const resultadoEmail = await enviarCorreoBajaUsuario({
        email: entrenador.email,
        nombre: entrenador.nombre,
        dni: entrenador.dni,
        rol: entrenador.rol,
        fechaBaja: resultado.fechaBaja
      })
      console.log('[DELETE /api/entrenadores] Resultado del envío de email:', resultadoEmail)
      console.log(`✅ Correo de notificación enviado exitosamente a ${entrenador.email}`)
    } catch (emailError) {
      // Log del error pero no fallar la operación
      console.error('❌ [DELETE /api/entrenadores] Error al enviar correo de notificación:', emailError)
      console.error('Detalles del error:', emailError instanceof Error ? emailError.stack : emailError)
      // La baja ya se realizó, solo falló el correo
    }

    return NextResponse.json(
      { 
        message: 'Entrenador eliminado exitosamente',
        entrenador: {
          nombre: entrenador.nombre,
          dni: entrenador.dni,
          email: entrenador.email
        },
        fechaBaja: resultado.fechaBaja
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error al eliminar entrenador:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

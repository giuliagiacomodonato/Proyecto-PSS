import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { enviarCorreoBajaUsuario } from '@/lib/email'


// GET - Obtener administrador por DNI
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dni = searchParams.get('dni')

    if (!dni) {
      return NextResponse.json(
        { error: 'El DNI es requerido' },
        { status: 400 }
      )
    }

    // Validar formato de DNI (7-8 dígitos)
    if (!/^\d{7,8}$/.test(dni)) {
      return NextResponse.json(
        { error: 'El DNI debe tener 7 u 8 dígitos' },
        { status: 400 }
      )
    }

    // Buscar administrador por DNI
    const administrador = await prisma.usuario.findFirst({
      where: { 
        dni: dni,
        rol: 'ADMIN' // Solo buscar administradores
      },
      select: {
        id: true,
        nombre: true,
        dni: true,
        email: true,
        fechaNacimiento: true,
        telefono: true,
        fechaAlta: true
      }
    })

    if (!administrador) {
      return NextResponse.json(
        { error: 'No se encontró un administrador con ese DNI' },
        { status: 404 }
      )
    }

    return NextResponse.json({ administrador })

  } catch (error) {
    console.error('Error al buscar administrador:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar administrador
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

    if (!realizadoPorId) {
      return NextResponse.json(
        { error: 'El ID del usuario que realiza la baja es requerido' },
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

    // Buscar administrador
    const administrador = await prisma.usuario.findFirst({
      where: { 
        dni: dni,
        rol: 'ADMIN'
      }
    })

    if (!administrador) {
      return NextResponse.json(
        { error: 'No se encontró un administrador con ese DNI' },
        { status: 404 }
      )
    }

    // Verificar que el usuario que realiza la baja existe
    const usuarioRealizaBaja = await prisma.usuario.findUnique({
      where: { id: realizadoPorId }
    })

    if (!usuarioRealizaBaja) {
      return NextResponse.json(
        { error: 'El usuario que realiza la baja no existe' },
        { status: 404 }
      )
    }

    // Usar transacción para garantizar atomicidad
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Registrar la baja en la tabla de auditoría (SNAPSHOT completo de ambos usuarios)
      const registroBaja = await tx.usuarioBaja.create({
        data: {
          // Snapshot del usuario eliminado
          usuarioEliminadoId: administrador.id,
          usuarioEliminadoNombre: administrador.nombre,
          usuarioEliminadoDni: administrador.dni,
          usuarioEliminadoEmail: administrador.email,
          rolUsuarioEliminado: administrador.rol,
          // Snapshot del usuario que realiza la baja
          realizadoPorId: realizadoPorId,
          realizadoPorNombre: usuarioRealizaBaja.nombre,
          realizadoPorDni: usuarioRealizaBaja.dni,
          motivo: 'Baja de administrador desde el sistema'
        }
      })

      // 2. Eliminar el usuario de la base de datos
      await tx.usuario.delete({
        where: { id: administrador.id }
      })

      return registroBaja
    })

    // Enviar correo de notificación al administrador dado de baja
    try {
      await enviarCorreoBajaUsuario({
        email: administrador.email,
        nombre: administrador.nombre,
        dni: administrador.dni,
        rol: administrador.rol,
        fechaBaja: resultado.fechaBaja
      })
      console.log(`Correo de notificación enviado a ${administrador.email}`)
    } catch (emailError) {
      // Log del error pero no fallar la operación
      console.error('Error al enviar correo de notificación:', emailError)
      // La baja ya se realizó, solo falló el correo
    }

    return NextResponse.json(
      { 
        message: 'Administrador eliminado exitosamente',
        administrador: {
          nombre: administrador.nombre,
          dni: administrador.dni,
          email: administrador.email
        },
        fechaBaja: resultado.fechaBaja
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error al eliminar administrador:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

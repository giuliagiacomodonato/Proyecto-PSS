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
        { error: 'Se requiere el ID del usuario que realiza la baja' },
        { status: 400 }
      )
    }

    // Verificar que quien realiza la baja es SUPER_ADMIN
    const usuarioRealizaBaja = await prisma.usuario.findUnique({
      where: { id: realizadoPorId }
    })

    if (!usuarioRealizaBaja || usuarioRealizaBaja.rol !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'No tiene permisos para realizar esta acción. Solo super-administradores pueden dar de baja administradores.' },
        { status: 403 }
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

    // Usar transacción para garantizar atomicidad
    const resultado = await prisma.$transaction(async (tx: any) => {
      // 1. Registrar la baja en la tabla de auditoría (SNAPSHOT completo de ambos usuarios)
      const registroBaja = await tx.usuarioBaja.create({
        data: {
          // Snapshot del usuario eliminado
          usuarioEliminadoId: administrador.id,
          usuarioEliminadoNombre: administrador.nombre,
          usuarioEliminadoDni: administrador.dni,
          usuarioEliminadoEmail: administrador.email,
          rolUsuarioEliminado: administrador.rol,
          // Snapshot del usuario que realiza la baja (puede ser null)
          realizadoPorId: usuarioRealizaBaja ? usuarioRealizaBaja.id : null,
          realizadoPorNombre: usuarioRealizaBaja ? usuarioRealizaBaja.nombre : 'Sistema',
          realizadoPorDni: usuarioRealizaBaja ? usuarioRealizaBaja.dni : 'N/A',
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
    console.log('[DELETE /api/administradores] Intentando enviar email a:', administrador.email)
    try {
      const resultadoEmail = await enviarCorreoBajaUsuario({
        email: administrador.email,
        nombre: administrador.nombre,
        dni: administrador.dni,
        rol: administrador.rol,
        fechaBaja: resultado.fechaBaja
      })
      console.log('[DELETE /api/administradores] Resultado del envío de email:', resultadoEmail)
      console.log(`✅ Correo de notificación enviado exitosamente a ${administrador.email}`)
    } catch (emailError) {
      // Log del error pero no fallar la operación
      console.error('❌ [DELETE /api/administradores] Error al enviar correo de notificación:', emailError)
      console.error('Detalles del error:', emailError instanceof Error ? emailError.stack : emailError)
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

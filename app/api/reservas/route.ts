import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { canchaId, fecha, horario, usuarioSocioId } = body

    // Validar datos requeridos
    if (!canchaId || !fecha || !horario || !usuarioSocioId) {
      return NextResponse.json(
        { message: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el usuario sea un Socio
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioSocioId }
    })

    if (!usuario || usuario.rol !== 'SOCIO') {
      return NextResponse.json(
        { message: 'No tienes permiso para realizar esta acción' },
        { status: 403 }
      )
    }

    // Verificar que la cancha exista
    const cancha = await prisma.cancha.findUnique({
      where: { id: parseInt(canchaId) }
    })

    if (!cancha) {
      return NextResponse.json(
        { message: 'Cancha no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que no exista ya una reserva en ese horario
    const existingTurno = await prisma.turno.findFirst({
      where: {
        canchaId: parseInt(canchaId),
        horaInicio: horario,
        fecha: {
          gte: new Date(fecha + 'T00:00:00'),
          lt: new Date(fecha + 'T23:59:59')
        },
        reservado: true
      }
    })

    if (existingTurno) {
      return NextResponse.json(
        { message: 'Este horario ya está reservado' },
        { status: 400 }
      )
    }

    // Crear el turno (reservado, sin pago por ahora)
    const nuevoTurno = await prisma.turno.create({
      data: {
        canchaId: parseInt(canchaId),
        horaInicio: horario,
        fecha: new Date(fecha + 'T00:00:00'),
        reservado: true,
        usuarioSocioId: usuarioSocioId,
      }
    })

    return NextResponse.json(
      {
        message: 'Reserva creada exitosamente',
        turno: nuevoTurno
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error al crear reserva:', error)
    return NextResponse.json(
      { message: 'Error al crear la reserva' },
      { status: 500 }
    )
  }
}

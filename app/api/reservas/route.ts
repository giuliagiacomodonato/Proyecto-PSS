import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { canchaId, fecha, horario, usuarioSocioId } = body

    console.log('Datos recibidos en /api/reservas:', { canchaId, fecha, horario, usuarioSocioId })

    // Validar datos requeridos
    if (!canchaId || !fecha || !horario || !usuarioSocioId) {
      console.log('Error: Faltan campos requeridos')
      return NextResponse.json(
        { message: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el usuario sea un Socio
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioSocioId }
    })

    console.log('Usuario encontrado:', usuario)

    if (!usuario || usuario.rol !== 'SOCIO') {
      console.log('Error: Usuario no es socio o no existe')
      return NextResponse.json(
        { message: 'No tienes permiso para realizar esta acción' },
        { status: 403 }
      )
    }

    // Verificar que la cancha exista
    const cancha = await prisma.cancha.findUnique({
      where: { id: parseInt(canchaId) }
    })

    console.log('Cancha encontrada:', cancha)

    if (!cancha) {
      console.log('Error: Cancha no encontrada')
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

    console.log('Turno existente:', existingTurno)

    if (existingTurno) {
      console.log('Error: Horario ya reservado')
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

    console.log('Turno creado exitosamente:', nuevoTurno)

    return NextResponse.json(
      {
        message: 'Reserva creada exitosamente',
        turnoId: nuevoTurno.id,
        turno: nuevoTurno
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error al crear reserva:', error)
    return NextResponse.json(
      { message: 'Error al crear la reserva', error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}

// Agregamos GET para devolver reservas/turnos activos (útil para dashboard)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit') || 100)
    const offset = Number(searchParams.get('offset') || 0)

    const turnos = await prisma.turno.findMany({
      where: {},
      select: {
        id: true,
        canchaId: true,
        horaInicio: true,
        fecha: true,
        reservado: true,
        usuarioSocioId: true
      },
      orderBy: { fecha: 'desc' },
      skip: offset,
      take: limit
    })

    const total = await prisma.turno.count()

    return NextResponse.json({ turnos, total, limit, offset })
  } catch (error) {
    console.error('Error al listar reservas:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}

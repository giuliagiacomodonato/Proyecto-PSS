import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TipoCancha } from '@prisma/client'

interface CanchaData {
  nombre: string
  tipo: TipoCancha
  ubicacion: string
  horarios: { inicio: string; fin: string }[]  // Array de rangos horarios
  precio: number
  practicaDeportivaId?: number
}

export async function POST(request: NextRequest) {
  try {
    const body: CanchaData = await request.json()

    // Validar datos requeridos
    if (!body.nombre || !body.tipo || !body.ubicacion || 
        !body.horarios || body.horarios.length === 0 || !body.precio) {
      return NextResponse.json(
        { message: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Validar que el nombre no sea duplicado
    const existingCancha = await prisma.cancha.findUnique({
      where: { nombre: body.nombre }
    })

    if (existingCancha) {
      return NextResponse.json(
        { message: `Ya existe una cancha con el nombre ${body.nombre}` },
        { status: 400 }
      )
    }

    // Validar tipo de cancha
    if (!Object.values(TipoCancha).includes(body.tipo)) {
      return NextResponse.json(
        { message: 'Tipo de cancha inválido' },
        { status: 400 }
      )
    }

    if (body.precio <= 0) {
      return NextResponse.json(
        { message: 'El precio debe ser mayor a 0' },
        { status: 400 }
      )
    }

    if (body.ubicacion.length > 100) {
      return NextResponse.json(
        { message: 'La ubicación no puede exceder 100 caracteres' },
        { status: 400 }
      )
    }

    // Validar formato de horarios (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    for (const horario of body.horarios) {
      if (!timeRegex.test(horario.inicio) || !timeRegex.test(horario.fin)) {
        return NextResponse.json(
          { message: 'Formato de horario inválido (debe ser HH:MM)' },
          { status: 400 }
        )
      }
      
      // Validar que inicio sea antes que fin
      const [horaInicio, minInicio] = horario.inicio.split(':').map(Number)
      const [horaFin, minFin] = horario.fin.split(':').map(Number)
      if (horaInicio * 60 + minInicio >= horaFin * 60 + minFin) {
        return NextResponse.json(
          { message: 'La hora de inicio debe ser anterior a la hora de fin' },
          { status: 400 }
        )
      }
    }

    // Crear la cancha con sus horarios
    const nuevaCancha = await prisma.cancha.create({
      data: {
        nombre: body.nombre,
        tipo: body.tipo,
        ubicacion: body.ubicacion,
        precio: body.precio,
        practicaDeportivaId: body.practicaDeportivaId || null,
        horarios: {
          create: body.horarios.map(h => ({
            horaInicio: h.inicio,
            horaFin: h.fin
          }))
        }
      },
      include: {
        horarios: true
      }
    })

    return NextResponse.json(
      { 
        message: 'Cancha registrada exitosamente',
        cancha: nuevaCancha
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error al crear cancha:', error)
    
    // Manejar errores específicos de Prisma
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { message: 'Ya existe una cancha con ese nombre' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const canchas = await prisma.cancha.findMany({
      include: {
        practicaDeportiva: true,
        horarios: true,  // Incluir los horarios
        turnos: {
          where: {
            fecha: {
              gte: new Date()
            }
          },
          orderBy: {
            fecha: 'asc'
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json({ canchas })
  } catch (error) {
    console.error('Error al obtener canchas:', error)
    return NextResponse.json(
      { message: 'Error al obtener las canchas' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Enum para tipos de cancha
const TipoCancha = {
  FUTBOL_5: 'FUTBOL_5',
  FUTBOL: 'FUTBOL',
  BASQUET: 'BASQUET'
} as const

type TipoCanchaType = typeof TipoCancha[keyof typeof TipoCancha]

interface CanchaData {
  numero: number
  tipo: TipoCanchaType
  ubicacion: string
  horariosInicio: string
  horariosFin: string
  precio: number
  practicaDeportivaId?: number
}

export async function POST(request: NextRequest) {
  try {
    const body: CanchaData = await request.json()

    // Validar datos requeridos
    if (!body.numero || !body.tipo || !body.ubicacion || 
        !body.horariosInicio || !body.horariosFin || !body.precio) {
      return NextResponse.json(
        { message: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Validar que el número no sea duplicado
    const existingCancha = await prisma.cancha.findUnique({
      where: { numero: body.numero }
    })

    if (existingCancha) {
      return NextResponse.json(
        { message: `Ya existe una cancha con el número ${body.numero}` },
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

    // Validar rangos
    if (body.numero <= 0) {
      return NextResponse.json(
        { message: 'El número de cancha debe ser mayor a 0' },
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
    if (!timeRegex.test(body.horariosInicio) || !timeRegex.test(body.horariosFin)) {
      return NextResponse.json(
        { message: 'Formato de horario inválido (debe ser HH:MM)' },
        { status: 400 }
      )
    }

    // Crear la cancha
    const nuevaCancha = await prisma.cancha.create({
      data: {
        numero: body.numero,
        tipo: body.tipo,
        ubicacion: body.ubicacion,
        horariosInicio: body.horariosInicio,
        horariosFin: body.horariosFin,
        precio: body.precio,
        practicaDeportivaId: body.practicaDeportivaId || null
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
          { message: 'Ya existe una cancha con ese número' },
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
        numero: 'asc'
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
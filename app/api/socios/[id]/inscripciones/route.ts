import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    let idValue: string | undefined;
    if (context.params instanceof Promise) {
      const params = await context.params;
      idValue = params.id;
    } else {
      idValue = context.params.id;
    }
    const socioId = parseInt(idValue ?? '')

    if (isNaN(socioId)) {
      return NextResponse.json(
        { error: 'ID de socio inválido' },
        { status: 400 }
      )
    }

    // Obtener todas las inscripciones del socio con sus asistencias
    const inscripciones = await prisma.inscripcion.findMany({
      where: {
        usuarioSocioId: socioId,
        activa: true,
      },
      include: {
        practicaDeportiva: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
          },
        },
        asistencias: {
          orderBy: {
            fecha: 'desc',
          },
        },
      },
    })

    return NextResponse.json({ inscripciones })
  } catch (error) {
    console.error('Error al obtener inscripciones:', error)
    return NextResponse.json(
      { error: 'Error al obtener inscripciones' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const socioId = request.nextUrl.searchParams.get('socioId')

    // Obtener todas las prácticas disponibles con información de cupos
    const practicas = await prisma.practicaDeportiva.findMany({
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        precio: true,
        cupo: true,
        horarios: {
          select: {
            id: true,
            dia: true,
            horaInicio: true,
            horaFin: true
          }
        },
        entrenadores: {
          select: {
            id: true,
            nombre: true,
          }
        },
        inscripciones: {
          where: {
            activa: true
          },
          select: {
            id: true,
            usuarioSocioId: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    // Si hay socioId, también obtener las inscripciones del socio
    let socioInscripciones: number[] = []
    if (socioId) {
      const socioIdNum = parseInt(socioId)
      const inscripciones = await prisma.inscripcion.findMany({
        where: {
          usuarioSocioId: socioIdNum,
          activa: true
        },
        select: {
          practicaDeportivaId: true
        }
      })
      socioInscripciones = inscripciones.map((i: any) => i.practicaDeportivaId)
    }

    // Transformar datos para incluir información de cupos disponibles
    const practicasFormateadas = practicas.map((practica: any) => {
      const inscriptosActuales = practica.inscripciones.length
      const cuposDisponibles = practica.cupo - inscriptosActuales
      const estaInscrito = socioInscripciones.includes(practica.id)
      
      // Obtener el primer entrenador si existe
      const entrenador = practica.entrenadores.length > 0 
        ? {
            id: practica.entrenadores[0].id,
            nombre: practica.entrenadores[0].nombre,
            apellido: practica.entrenadores[0].apellido
          }
        : null

      return {
        id: practica.id,
        nombre: practica.nombre,
        descripcion: practica.descripcion,
        precio: practica.precio,
        cupo: practica.cupo,
        inscriptosActuales,
        cuposDisponibles,
        estaInscrito,
        entrenador,
        horarios: practica.horarios.map((h: any) => ({
          id: h.id,
          dia: h.dia,
          horaInicio: h.horaInicio,
          horaFin: h.horaFin
        }))
      }
    })

    return NextResponse.json({
      practicas: practicasFormateadas
    })
  } catch (error) {
    console.error('Error al obtener prácticas deportivas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { usuarioSocioId, practicaDeportivaId } = body

    if (!usuarioSocioId || !practicaDeportivaId) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      )
    }

    // Verificar que la práctica existe
    const practica = await prisma.practicaDeportiva.findUnique({
      where: { id: practicaDeportivaId },
      select: {
        id: true,
        nombre: true,
        precio: true,
        cupo: true,
        inscripciones: {
          where: {
            activa: true
          },
          select: {
            id: true
          }
        }
      }
    })

    if (!practica) {
      return NextResponse.json(
        { error: 'Práctica deportiva no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que el socio existe
    const socio = await prisma.usuario.findUnique({
      where: { id: usuarioSocioId },
      select: { id: true }
    })

    if (!socio) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el socio no esté ya inscrito
    const yaInscrito = await prisma.inscripcion.findUnique({
      where: {
        usuarioSocioId_practicaDeportivaId: {
          usuarioSocioId,
          practicaDeportivaId
        }
      }
    })

    if (yaInscrito && yaInscrito.activa) {
      return NextResponse.json(
        { error: 'Ya estás inscrito en esta práctica' },
        { status: 400 }
      )
    }

    // Verificar disponibilidad de cupos
    const inscriptosActuales = practica.inscripciones.length
    if (inscriptosActuales >= practica.cupo) {
      return NextResponse.json(
        { 
          error: 'No hay cupos disponibles en esta práctica deportiva',
          cupoLleno: true
        },
        { status: 400 }
      )
    }

    // Crear la inscripción
    let inscripcion

    if (yaInscrito && !yaInscrito.activa) {
      // Reacticar inscripción anterior
      inscripcion = await prisma.inscripcion.update({
        where: { id: yaInscrito.id },
        data: { activa: true }
      })
    } else {
      // Crear nueva inscripción
      inscripcion = await prisma.inscripcion.create({
        data: {
          usuarioSocioId,
          practicaDeportivaId,
          activa: true
        }
      })
    }

    // Obtener información completa para la respuesta
    const inscripcionCompleta = await prisma.inscripcion.findUnique({
      where: { id: inscripcion.id },
      select: {
        id: true,
        practicaDeportiva: {
          select: {
            nombre: true,
            precio: true
          }
        },
        fechaInscripcion: true
      }
    })

    return NextResponse.json({
      message: 'Inscripción exitosa',
      inscripcion: inscripcionCompleta
    })
  } catch (error) {
    console.error('Error al crear inscripción:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Obtener asistencias para una fecha específica y práctica
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const practicaId = searchParams.get('practicaId')
    const fecha = searchParams.get('fecha')

    if (!practicaId) {
      return NextResponse.json(
        { error: 'practicaId es requerido' },
        { status: 400 }
      )
    }

    // Si no se proporciona fecha, usar la fecha actual
    const fechaBusqueda = fecha ? new Date(fecha) : new Date()
    
    // Normalizar a inicio del día en UTC
    const inicioDia = new Date(fechaBusqueda)
    inicioDia.setUTCHours(0, 0, 0, 0)
    
    const finDia = new Date(fechaBusqueda)
    finDia.setUTCHours(23, 59, 59, 999)

    console.log('GET Asistencias - Params:', { practicaId, fecha })
    console.log('GET Asistencias - Rango:', { inicioDia: inicioDia.toISOString(), finDia: finDia.toISOString() })

    // Obtener asistencias de ese día para esa práctica
    const asistencias = await prisma.asistencia.findMany({
      where: {
        practicaDeportivaId: parseInt(practicaId),
        fecha: {
          gte: inicioDia,
          lte: finDia,
        },
      },
      include: {
        usuarioSocio: {
          select: {
            id: true,
            nombre: true,
            dni: true,
          },
        },
      },
    })

    console.log('GET Asistencias - Encontradas:', asistencias.length)
    if (asistencias.length > 0) {
      console.log('GET Asistencias - Primera fecha guardada:', asistencias[0].fecha.toISOString())
    }

    return NextResponse.json({ asistencias })
  } catch (error) {
    console.error('Error al obtener asistencias:', error)
    return NextResponse.json(
      { error: 'Error al obtener asistencias' },
      { status: 500 }
    )
  }
}

// POST: Guardar asistencias del día
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { practicaId, asistencias, fecha } = body

    if (!practicaId || !asistencias || !Array.isArray(asistencias)) {
      return NextResponse.json(
        { error: 'Datos inválidos. Se requiere practicaId y array de asistencias' },
        { status: 400 }
      )
    }

    // Usar la fecha proporcionada o la actual
    const fechaRegistro = fecha ? new Date(fecha) : new Date()
    
    // Normalizar a inicio del día en UTC
    const inicioDia = new Date(fechaRegistro)
    inicioDia.setUTCHours(0, 0, 0, 0)
    
    const finDia = new Date(fechaRegistro)
    finDia.setUTCHours(23, 59, 59, 999)

    console.log('POST Asistencias - Params:', { practicaId, fecha, cantidadAsistencias: asistencias.length })
    console.log('POST Asistencias - Fecha de registro:', fechaRegistro.toISOString())
    console.log('POST Asistencias - Rango de búsqueda:', { inicioDia: inicioDia.toISOString(), finDia: finDia.toISOString() })

    // Procesar cada asistencia
    const resultados = await Promise.all(
      asistencias.map(async (asist: { inscripcionId: number; usuarioSocioId: number; presente: boolean }) => {
        // Verificar si ya existe un registro de asistencia para este día
        const asistenciaExistente = await prisma.asistencia.findFirst({
          where: {
            inscripcionId: asist.inscripcionId,
            usuarioSocioId: asist.usuarioSocioId,
            practicaDeportivaId: parseInt(practicaId),
            fecha: {
              gte: inicioDia,
              lte: finDia,
            },
          },
        })

        if (asistenciaExistente) {
          // Si el checkbox está desmarcado (presente = false), eliminar el registro
          if (!asist.presente) {
            return await prisma.asistencia.delete({
              where: { id: asistenciaExistente.id },
            })
          } else {
            // Si está marcado, actualizar el registro existente
            return await prisma.asistencia.update({
              where: { id: asistenciaExistente.id },
              data: { presente: asist.presente },
            })
          }
        } else {
          // Solo crear nuevo registro si está marcado como presente
          if (asist.presente) {
            return await prisma.asistencia.create({
              data: {
                inscripcionId: asist.inscripcionId,
                usuarioSocioId: asist.usuarioSocioId,
                practicaDeportivaId: parseInt(practicaId),
                fecha: fechaRegistro,
                presente: asist.presente,
              },
            })
          }
          return null // No crear registro si no está presente
        }
      })
    )

    return NextResponse.json({
      success: true,
      message: 'Asistencias registradas correctamente',
      registros: resultados.length,
    })
  } catch (error) {
    console.error('Error al guardar asistencias:', error)
    return NextResponse.json(
      { error: 'Error al guardar asistencias' },
      { status: 500 }
    )
  }
}

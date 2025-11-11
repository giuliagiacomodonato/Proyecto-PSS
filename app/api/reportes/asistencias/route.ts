import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Obtener parámetros de filtrado
    const deporteId = searchParams.get('deporteId')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')
    const socioDni = searchParams.get('socioDni')
    const resumenRapido = searchParams.get('resumenRapido') === 'true'
    
    // Si es una consulta de resumen rápido
    if (resumenRapido && deporteId) {
      const asistencias = await prisma.asistencia.findMany({
        where: {
          practicaDeportivaId: parseInt(deporteId)
        },
        select: {
          presente: true
        }
      })
      
      const total = asistencias.length
      const presentes = asistencias.filter(a => a.presente).length
      const porcentaje = total > 0 ? Math.round((presentes / total) * 100) : 0
      
      return NextResponse.json({
        porcentaje,
        total,
        presentes,
        ausentes: total - presentes
      })
    }
    
    // Construir filtros dinámicos para consulta detallada
    const whereConditions: any = {}
    
    if (deporteId) {
      whereConditions.practicaDeportivaId = parseInt(deporteId)
    }
    
    if (fechaDesde || fechaHasta) {
      whereConditions.fecha = {}
      if (fechaDesde) {
        whereConditions.fecha.gte = new Date(fechaDesde)
      }
      if (fechaHasta) {
        // Agregar 1 día para incluir todo el día final
        const fechaHastaFin = new Date(fechaHasta)
        fechaHastaFin.setDate(fechaHastaFin.getDate() + 1)
        whereConditions.fecha.lt = fechaHastaFin
      }
    }
    
    if (socioDni) {
      whereConditions.usuarioSocio = {
        dni: socioDni
      }
    }
    
    // Obtener asistencias con todos los detalles
    const asistencias = await prisma.asistencia.findMany({
      where: whereConditions,
      include: {
        usuarioSocio: {
          select: {
            id: true,
            nombre: true,
            dni: true,
            email: true
          }
        },
        practicaDeportiva: {
          select: {
            id: true,
            nombre: true,
            entrenadores: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        },
        inscripcion: {
          select: {
            id: true,
            activa: true
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    })
    
    // Calcular métricas resumidas
    const totalAsistencias = asistencias.length
    const totalPresentes = asistencias.filter(a => a.presente).length
    const totalAusentes = totalAsistencias - totalPresentes
    const porcentajeAsistencia = totalAsistencias > 0 
      ? Math.round((totalPresentes / totalAsistencias) * 100) 
      : 0
    
    // Contar prácticas/clases únicas
    const practicasUnicas = new Set(
      asistencias.map(a => `${a.practicaDeportivaId}-${a.fecha.toISOString().split('T')[0]}`)
    )
    const totalClases = practicasUnicas.size
    
    // Formatear datos para la respuesta
    const asistenciasDetalladas = asistencias.map(asistencia => ({
      id: asistencia.id,
      fecha: asistencia.fecha.toISOString(),
      practica: asistencia.practicaDeportiva.nombre,
      socio: asistencia.usuarioSocio.nombre,
      socioDni: asistencia.usuarioSocio.dni,
      estado: asistencia.presente ? 'Presente' : 'Ausente',
      entrenador: asistencia.practicaDeportiva.entrenadores[0]?.nombre || 'Sin asignar',
      inscripcionActiva: asistencia.inscripcion?.activa || false
    }))
    
    return NextResponse.json({
      metricas: {
        asistenciaPromedio: porcentajeAsistencia,
        totalClases,
        totalAsistencias: totalPresentes,
        totalAusencias: totalAusentes
      },
      asistencias: asistenciasDetalladas,
      filtrosAplicados: {
        deporteId: deporteId || null,
        fechaDesde: fechaDesde || null,
        fechaHasta: fechaHasta || null,
        socioDni: socioDni || null
      }
    })
    
  } catch (error) {
    console.error('Error al obtener reportes de asistencia:', error)
    return NextResponse.json(
      { error: 'Error al obtener reportes de asistencia' },
      { status: 500 }
    )
  }
}

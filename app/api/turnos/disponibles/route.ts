import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface TurnoDisponible {
  hora: string
  disponible: boolean
}

// Función auxiliar para convertir HH:MM a minutos
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Función auxiliar para convertir minutos a HH:MM
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const canchaId = searchParams.get('canchaId')
    const fecha = searchParams.get('fecha')

    if (!canchaId || !fecha) {
      return NextResponse.json(
        { message: 'canchaId y fecha son requeridos' },
        { status: 400 }
      )
    }

    // Obtener la cancha con sus horarios
    const cancha = await prisma.cancha.findUnique({
      where: { id: parseInt(canchaId) },
      include: { horarios: true }
    })

    if (!cancha) {
      return NextResponse.json(
        { message: 'Cancha no encontrada' },
        { status: 404 }
      )
    }

    // Validar que sea una fecha válida
    const selectedDate = new Date(fecha + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (selectedDate < today) {
      return NextResponse.json(
        { message: 'La fecha debe ser futura' },
        { status: 400 }
      )
    }

    // Obtener los turnos reservados para esa fecha
    const turnosReservados = await prisma.turno.findMany({
      where: {
        canchaId: parseInt(canchaId),
        fecha: {
          gte: new Date(fecha + 'T00:00:00'),
          lt: new Date(fecha + 'T23:59:59')
        },
        reservado: true
      },
      select: { horaInicio: true }
    })

    const horasReservadas = turnosReservados.map(t => t.horaInicio)

    // Generar lista de TODOS los turnos posibles basados en los horarios de la cancha
    // Cada turno tiene duración de 1 hora
    const turnosDisponibles: TurnoDisponible[] = []
    const horasGeneradas = new Set<string>()

    for (const horario of cancha.horarios) {
      const startMinutes = timeToMinutes(horario.horaInicio)
      const endMinutes = timeToMinutes(horario.horaFin)

      // Generar turnos de 1 hora desde horaInicio hasta horaFin
      for (let current = startMinutes; current < endMinutes; current += 60) {
        const timeStr = minutesToTime(current)
        
        // Evitar duplicados
        if (!horasGeneradas.has(timeStr)) {
          horasGeneradas.add(timeStr)
          
          // Verificar si está reservado
          const disponible = !horasReservadas.includes(timeStr)
          
          turnosDisponibles.push({
            hora: timeStr,
            disponible
          })
        }
      }
    }

    // Ordenar por hora
    turnosDisponibles.sort((a, b) => a.hora.localeCompare(b.hora))

    return NextResponse.json({ turnos: turnosDisponibles })
  } catch (error) {
    console.error('Error al obtener turnos disponibles:', error)
    return NextResponse.json(
      { message: 'Error al obtener los turnos disponibles' },
      { status: 500 }
    )
  }
}

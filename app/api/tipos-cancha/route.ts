import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Obtener los tipos de cancha distintos directamente desde la base de datos
    const canchas = await prisma.cancha.findMany({
      select: {
        tipo: true
      },
      distinct: ['tipo']
    })

    // Extraer solo los valores del tipo
    const tipos = canchas.map(c => c.tipo)

    return NextResponse.json({ tipos })
  } catch (error) {
    console.error('Error al obtener tipos de cancha:', error)
    return NextResponse.json(
      { message: 'Error al obtener los tipos de cancha' },
      { status: 500 }
    )
  }
}
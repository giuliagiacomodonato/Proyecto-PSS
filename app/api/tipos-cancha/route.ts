import { NextResponse } from 'next/server'
import { TipoCancha } from '@prisma/client'

export async function GET() {
  try {
    // Obtener los valores del enum TipoCancha desde Prisma
    const tipos = Object.values(TipoCancha)

    return NextResponse.json({ tipos })
  } catch (error) {
    console.error('Error al obtener tipos de cancha:', error)
    return NextResponse.json(
      { message: 'Error al obtener los tipos de cancha' },
      { status: 500 }
    )
  }
}
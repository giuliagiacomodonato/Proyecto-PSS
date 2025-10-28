import { NextRequest, NextResponse } from 'next/server'
import { getPrecioBaseCuota, setPrecioBaseCuota } from '@/lib/config/cuota'

// Endpoint GET: devuelve el precio base de la cuota
// Uso: GET /api/config/cuota -> { precioBase: number }
export async function GET() {
  try {
    const precio = await getPrecioBaseCuota()
    return NextResponse.json({ precioBase: precio })
  } catch (error) {
    console.error('Error reading cuota config:', error)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}

// Endpoint PATCH: actualiza el precio base de la cuota
// Espera un body JSON: { precio: number }
// Valida que el precio sea un número >= 0 y lo persiste en el archivo JSON.
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const nuevo = Number(body.precio)
    if (Number.isNaN(nuevo) || nuevo < 0) {
      return NextResponse.json({ message: 'Precio inválido' }, { status: 400 })
    }

    await setPrecioBaseCuota(Math.round(nuevo))
    return NextResponse.json({ message: 'Precio actualizado', precioBase: Math.round(nuevo) })
  } catch (error) {
    console.error('Error updating cuota config:', error)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}

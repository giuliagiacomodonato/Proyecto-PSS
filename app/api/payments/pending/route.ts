import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { usuarioSocioId, monto, turnoId, metodoPago, tipoPago } = body

    if (!usuarioSocioId || !monto || !turnoId) {
      return NextResponse.json({ error: 'usuarioSocioId, monto y turnoId son requeridos' }, { status: 400 })
    }

    // Crear pago en estado PENDIENTE
    const pago = await prisma.pago.create({
      data: {
        usuarioSocioId: Number(usuarioSocioId),
        tipoPago: tipoPago || 'RESERVA_CANCHA',
        monto: Number(monto),
        metodoPago: metodoPago || 'EFECTIVO',
        estado: 'PENDIENTE',
        turnoId: Number(turnoId)
      }
    })

    return NextResponse.json({ success: true, pago }, { status: 201 })
  } catch (err) {
    console.error('Error en /api/payments/pending', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

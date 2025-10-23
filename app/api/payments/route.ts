import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { titular, last4, monto, concepto, reservaId } = body

    if (!titular || !last4 || !monto) {
      return NextResponse.json({ error: 'Faltan datos del pago.' }, { status: 400 })
    }

    // Determinismo: solo una tarjeta aprobada y otra rechazada (hardcode)
    // Tarjeta aprobada simulada -> últimos 4: '4242'
    // Tarjeta rechazada simulada -> últimos 4: '0002'
    if (last4 === '4242') {
      // aprobado
    } else if (last4 === '0002' || last4 === '0000') {
      return NextResponse.json({ error: 'El pago fue rechazado por la pasarela (tarjeta de prueba rechazada).' }, { status: 402 })
    } else {
      return NextResponse.json({ error: 'Tarjeta de prueba inválida. Usá 4242 (aprobada) o 0002 (rechazada).' }, { status: 400 })
    }

    // En caso de éxito, generamos un token simulado y (opcional) vinculamos la reserva
    const paymentToken = `tok_mock_${Date.now()}`

    if (reservaId && typeof reservaId === 'number') {
      try {
        // Intentamos vincular la reserva como pagada — no almacenamos datos sensibles
        await prisma.turno.update({ where: { id: reservaId }, data: { pagado: true } }).catch(() => null)
      } catch (e) {
        // ignorar errores de BD en modo mock
      }
    }

    return NextResponse.json({ success: true, token: paymentToken })
  } catch (err) {
    console.error('Error en /api/payments', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

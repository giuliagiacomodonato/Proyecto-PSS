import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
  const { titular, last4, monto, tipo, usuarioSocioId, turnoId, cuotaId, inscripcionId, metodoPago } = body

    if (!titular || !last4 || !monto || !tipo || !usuarioSocioId) {
      return NextResponse.json({ error: 'Faltan datos del pago.' }, { status: 400 })
    }

    // Simulación de pasarela de pagos
    // Tarjeta aprobada simulada -> últimos 4: '4242'
    // Tarjeta rechazada simulada -> últimos 4: '0002'
    if (last4 === '4242') {
      // aprobado
    } else  {
      return NextResponse.json({ error: 'El pago fue rechazado. Por favor, verifica los datos o intenta con otra tarjeta.' }, { status: 402 })
    }

    // Crear el registro de pago en la base de datos
    const pagoData: any = {
      usuarioSocioId: usuarioSocioId,
      tipoPago: tipo,
      monto: monto,
      metodoPago: metodoPago || 'TARJETA_CREDITO',
      estado: 'PAGADO',
      comprobante: `tok_mock_${Date.now()}`
    }

    if (turnoId) pagoData.turnoId = turnoId
    if (cuotaId) pagoData.cuotaId = cuotaId
    if (inscripcionId) pagoData.inscripcionId = inscripcionId

    const pago = await prisma.pago.create({ data: pagoData })

    return NextResponse.json({ 
      success: true, 
      token: pago.comprobante,
      pagoId: pago.id
    })
  } catch (err) {
    console.error('Error en /api/payments', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

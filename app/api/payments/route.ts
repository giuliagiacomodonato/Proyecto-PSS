import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
  const { titular, last4, monto, tipo, usuarioSocioId, turnoId, cuotaId, inscripcionId, metodoPago, cuotasIds } = body

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

    // Si es pago de múltiples cuotas mensuales
    if (cuotasIds && Array.isArray(cuotasIds) && cuotasIds.length > 0) {
      const pagos = []
      
      for (const cuotaId of cuotasIds) {
        // Obtener la cuota para verificar su monto
        const cuota = await prisma.cuota.findUnique({
          where: { id: cuotaId }
        })

        if (!cuota) {
          console.warn(`Cuota ${cuotaId} no encontrada`)
          continue
        }

        // Crear un pago por cada cuota
        const pago = await prisma.pago.create({
          data: {
            usuarioSocioId: usuarioSocioId,
            tipoPago: 'CUOTA_MENSUAL',
            monto: cuota.monto,
            metodoPago: metodoPago || 'TARJETA_CREDITO',
            estado: 'PAGADO',
            comprobante: `tok_mock_${Date.now()}_${cuotaId}`,
            cuotaId: cuotaId
          }
        })
        pagos.push(pago)
      }

      return NextResponse.json({ 
        success: true, 
        pagos: pagos.map(p => ({ id: p.id, cuotaId: p.cuotaId })),
        cantidadPagos: pagos.length
      })
    }

    // Crear el registro de pago en la base de datos (pago único)
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

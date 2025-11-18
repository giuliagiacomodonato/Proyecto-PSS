import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { titular, last4, monto, tipo, usuarioSocioId, turnoId, cuotaId, inscripcionId, inscripcionIds, cuotasSeleccionadas, cuotaIds, metodoPago } = body

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

    // Si es CUOTA_MENSUAL con múltiples cuotas, crear un pago por cada una
    if (tipo === 'CUOTA_MENSUAL' && cuotaIds && Array.isArray(cuotaIds) && cuotaIds.length > 0) {
      const comprobante = `tok_mock_${Date.now()}`
      const montoPorCuota = monto / cuotaIds.length
      
      // Crear un pago por cada cuota
      for (const cuotaIdItem of cuotaIds) {
        const pagoData: any = {
          usuarioSocioId: usuarioSocioId,
          tipoPago: tipo,
          monto: montoPorCuota,
          metodoPago: metodoPago || 'TARJETA_CREDITO',
          estado: 'PAGADO',
          comprobante: comprobante,
          cuotaId: cuotaIdItem
        }
        
        await prisma.pago.create({ data: pagoData })
      }

      return NextResponse.json({ 
        success: true, 
        token: comprobante,
        pagoId: comprobante
      })
    }

    // Si es CUOTA_PRACTICA con cuotas seleccionadas, crear un pago por cada una
    if (tipo === 'CUOTA_PRACTICA' && cuotasSeleccionadas && Array.isArray(cuotasSeleccionadas) && cuotasSeleccionadas.length > 0) {
      const comprobante = `tok_mock_${Date.now()}`
      
      // Crear un pago por cada cuota
      for (const cuota of cuotasSeleccionadas) {
        const pagoData: any = {
          usuarioSocioId: usuarioSocioId,
          tipoPago: tipo,
          monto: cuota.precio,
          metodoPago: metodoPago || 'TARJETA_CREDITO',
          estado: 'PAGADO',
          comprobante: comprobante,
          inscripcionId: cuota.id
        }
        
        await prisma.pago.create({ data: pagoData })
      }

      // Retornar el monto total consolidado para la página de éxito
      const montoTotal = cuotasSeleccionadas.reduce((sum, c) => sum + c.precio, 0)
      
      return NextResponse.json({ 
        success: true, 
        token: comprobante,
        pagoId: comprobante, // Usar el comprobante como ID consolidado
        montoTotal: montoTotal,
        cantidadCuotas: cuotasSeleccionadas.length
      })
    }

    // Crear el registro de pago en la base de datos (casos RESERVA_CANCHA, CUOTA_MENSUAL, etc)
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

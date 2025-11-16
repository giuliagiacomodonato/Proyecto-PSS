import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams
    const usuarioId = searchParams.get('usuarioId')
    
    if (!usuarioId) {
      return NextResponse.json({ error: 'usuarioId requerido' }, { status: 400 })
    }

    const parsedId = parseInt(usuarioId, 10)
    if (isNaN(parsedId)) {
      return NextResponse.json({ error: 'usuarioId inválido' }, { status: 400 })
    }

    // Obtener todas las inscripciones activas del socio
    const inscripciones = await prisma.inscripcion.findMany({
      where: {
        usuarioSocioId: parsedId,
        activa: true,
      },
      include: {
        practicaDeportiva: true,
      },
    })

    // Para cada inscripción, obtener las cuotas de práctica impagas
    const cuotasPractica: any[] = []
    const currentDate = new Date()

    for (const insc of inscripciones) {
      // Obtener todos los pagos de este socio para esta práctica
      const pagosPractica = await prisma.pago.findMany({
        where: {
          usuarioSocioId: parsedId,
          tipoPago: {
            in: ['PRACTICA_DEPORTIVA', 'CUOTA_PRACTICA']
          },
          inscripcionId: insc.id,
          estado: 'PAGADO',
        },
        select: { fechaPago: true },
      })

      // Obtener el mes y año actual
      const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
      const hasPaidThisMonth = pagosPractica.some((p) => {
        const pDate = new Date(p.fechaPago)
        const pMonthYear = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}`
        return pMonthYear === monthYear
      })

      cuotasPractica.push({
        id: insc.id,
        practicaDeportivaId: insc.practicaDeportivaId,
        nombrePractica: insc.practicaDeportiva.nombre,
        precio: insc.practicaDeportiva.precio,
        periodo: `${currentDate.toLocaleString('es-AR', { month: 'long', year: 'numeric' })}`,
        estado: hasPaidThisMonth ? 'PAGADA' : 'IMPAGA',
      })
    }

    return NextResponse.json({ cuotasPractica })
  } catch (err) {
    console.error('Error en GET /api/socios/cuotas-practica:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

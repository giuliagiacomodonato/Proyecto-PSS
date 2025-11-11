import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/deudas?usuarioSocioId=123
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const usuarioSocioId = url.searchParams.get('usuarioSocioId')

    if (!usuarioSocioId) {
      return NextResponse.json({ error: 'usuarioSocioId es requerido' }, { status: 400 })
    }

    const id = parseInt(usuarioSocioId, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'usuarioSocioId inválido' }, { status: 400 })
    }

    // Cuotas pendientes: cuotas del socio que no tienen pagos asociados
    const cuotas = await prisma.cuota.findMany({
      where: { usuarioSocioId: id },
      include: { pagos: true }
    })

    // Map all cuotas and compute status based on associated pagos
    const mappedCuotas = cuotas.map((c) => {
      const isPaid = Array.isArray(c.pagos) && c.pagos.some((p) => p.estado === 'PAGADO');
      return {
        id: `cuota-${c.id}`,
        concept: `Cuota ${String(c.mes).padStart(2, '0')}/${c.anio}`,
        amount: Number(c.monto),
        dueDate: c.fechaVencimiento?.toISOString?.() || null,
        status: isPaid ? 'PAGADO' : 'PENDIENTE',
  // match Prisma TipoPago enum
  type: 'CUOTA_MENSUAL',
        cuotaId: c.id,
      };
    });

    // Inscripciones pendientes: inscripciones activas sin pagos
    let inscripciones = []
    try {
      inscripciones = await prisma.inscripcion.findMany({
        where: { usuarioSocioId: id, activa: true },
        include: { pagos: true, practicaDeportiva: true }
      })
    } catch (e) {
      console.error('Error al obtener inscripciones:', e)
      return NextResponse.json({ error: 'Error al obtener inscripciones' }, { status: 500 })
    }

  // Map all inscripciones and compute status based on associated pagos
    const mappedInscripciones = inscripciones.map((i) => {
      const isPaid = Array.isArray(i.pagos) && i.pagos.some((p) => p.estado === 'PAGADO');
      return {
        id: `insc-${i.id}`,
        concept: `Inscripción - ${i.practicaDeportiva?.nombre || 'Practica'}`,
        amount: Number(i.practicaDeportiva?.precio || 0),
        dueDate: i.fechaInscripcion?.toISOString?.() || null,
        status: isPaid ? 'PAGADO' : 'PENDIENTE',
  // match Prisma TipoPago enum
  type: 'PRACTICA_DEPORTIVA',
        inscripcionId: i.id,
      };
    });

    // Turnos (reservas) pendientes: turnos del socio sin pagos
    let turnos = []
    try {
      turnos = await prisma.turno.findMany({
        where: { usuarioSocioId: id },
        include: { pagos: true, cancha: true }
      })
    } catch (e) {
      console.error('Error al obtener turnos:', e)
      return NextResponse.json({ error: 'Error al obtener turnos' }, { status: 500 })
    }

    // Map all turnos and compute status based on associated pagos
    const mappedTurnos = turnos.map((t) => {
      const isPaid = Array.isArray(t.pagos) && t.pagos.some((p) => p.estado === 'PAGADO');
      return {
        id: `turno-${t.id}`,
        concept: `Turno - ${t.cancha?.nombre || 'Cancha'}`,
        amount: Number(t.cancha?.precio || 0),
        dueDate: t.fecha?.toISOString?.() || null,
        status: isPaid ? 'PAGADO' : 'PENDIENTE',
  // match Prisma TipoPago enum
  type: 'RESERVA_CANCHA',
        turnoId: t.id,
      };
    });

    const all = [...mappedCuotas, ...mappedInscripciones, ...mappedTurnos]

    return NextResponse.json({ deudas: all })
  } catch (err) {
    console.error('Error en /api/deudas', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

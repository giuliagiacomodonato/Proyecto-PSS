import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const socioId = request.nextUrl.searchParams.get('socioId')

    if (!socioId) {
      return NextResponse.json(
        { error: 'ID de socio no proporcionado' },
        { status: 400 }
      )
    }

    const socioIdNumber = parseInt(socioId)

    // Obtener datos del socio
    const socio = await prisma.usuario.findUnique({
      where: { id: socioIdNumber },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        dni: true,
      }
    })

    if (!socio) {
      return NextResponse.json(
        { error: 'Socio no encontrado' },
        { status: 404 }
      )
    }

    // Obtener inscripciones activas a prácticas deportivas del socio
    const inscripciones = await prisma.inscripcion.findMany({
      where: {
        usuarioSocioId: socioIdNumber,
        activa: true
      },
      select: {
        id: true,
        practicaDeportiva: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            precio: true,
            horarios: {
              select: {
                dia: true,
                horaInicio: true,
                horaFin: true
              },
              take: 1
            }
          }
        }
      }
    })

    // Transformar inscripciones a formato más legible
    const practicas = inscripciones.map((insc: any) => ({
      id: insc.practicaDeportiva.id,
      nombre: insc.practicaDeportiva.nombre,
      descripcion: insc.practicaDeportiva.descripcion,
      precio: insc.practicaDeportiva.precio,
      horario: insc.practicaDeportiva.horarios.length > 0 
        ? `${insc.practicaDeportiva.horarios[0].dia} ${insc.practicaDeportiva.horarios[0].horaInicio}-${insc.practicaDeportiva.horarios[0].horaFin}`
        : 'No disponible'
    }))

    // Obtener reservas de canchas del socio que tienen pago asociado
    const reservas = await prisma.turno.findMany({
      where: {
        usuarioSocioId: socioIdNumber,
        reservado: true,
        pagos: {
          some: {}  // Solo turnos que tienen al menos un pago
        }
      },
      select: {
        id: true,
        cancha: {
          select: {
            nombre: true,
            tipo: true,
            precio: true
          }
        },
        fecha: true,
        horaInicio: true
      },
      orderBy: {
        fecha: 'desc'
      },
      take: 10
    })

    // Transformar reservas a formato más legible
    const reservasFormateadas = reservas.map((res: any) => {
      const fecha = new Date(res.fecha)
      const fechaFormato = fecha.toLocaleDateString('es-AR')
      return {
        id: res.id,
        cancha: res.cancha.nombre,
        fecha: fechaFormato,
        horario: res.horaInicio,
        tipo: res.cancha.tipo,
        precio: res.cancha.precio
      }
    })

    // Obtener cuotas del socio (solo las del cabeza de familia o el socio individual)
    const usuarioSocio = await prisma.usuario.findUnique({
      where: { id: socioIdNumber },
      select: { tipoSocio: true, planFamiliarId: true }
    })

    let cuotaUsuarioId = socioIdNumber

    // Si es socio familiar, buscar la cabeza de familia
    if (usuarioSocio?.tipoSocio === 'FAMILIAR' && usuarioSocio?.planFamiliarId) {
      const cabezaFamilia = await prisma.usuario.findFirst({
        where: {
          planFamiliarId: usuarioSocio.planFamiliarId,
          tipoSocio: 'FAMILIAR'
        },
        select: { id: true }
      })
      
      // Usar el ID de la cabeza de familia si existe
      if (cabezaFamilia) {
        cuotaUsuarioId = cabezaFamilia.id
      }
    }

    const cuotas = await prisma.cuota.findMany({
      where: {
        usuarioSocioId: cuotaUsuarioId
      },
      select: {
        id: true,
        mes: true,
        anio: true,
        monto: true,
        fechaVencimiento: true,
        pagos: {
          select: {
            estado: true
          }
        }
      },
      orderBy: [
        { anio: 'desc' },
        { mes: 'desc' }
      ],
      take: 10
    })

    // Transformar cuotas a formato más legible y determinar estado
    const cuotasFormateadas = cuotas.map((cuota: any) => {
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
      
      // Determinar el estado de la cuota basado en los pagos
      let estado: 'pagado' | 'pendiente' | 'vencido' = 'pendiente'
      
      if (cuota.pagos.length > 0 && cuota.pagos.some((p: any) => p.estado === 'PAGADO')) {
        estado = 'pagado'
      } else if (new Date(cuota.fechaVencimiento) < new Date()) {
        estado = 'vencido'
      }

      const vencimiento = new Date(cuota.fechaVencimiento).toLocaleDateString('es-AR')

      return {
        id: cuota.id,
        tipo: `Cuota ${meses[cuota.mes - 1]} ${cuota.anio}`,
        monto: cuota.monto,
        estado,
        vencimiento
      }
    })

    return NextResponse.json({
      socio,
      practicas,
      reservas: reservasFormateadas,
      cuotas: cuotasFormateadas
    })
  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

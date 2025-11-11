import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPrecioBaseCuota } from '@/lib/config/cuota'

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
      where: { id: socioIdNumber, rol: 'SOCIO' },
      select: {
        id: true,
        nombre: true,
        tipoSocio: true,
        planFamiliarId: true,
      }
    })

    if (!socio) {
      return NextResponse.json(
        { error: 'Socio no encontrado' },
        { status: 404 }
      )
    }

    // Determinar el ID del usuario responsable de las cuotas
    let cuotaUsuarioId = socioIdNumber

    // Si es socio familiar, buscar la cabeza de familia
    if (socio.tipoSocio === 'FAMILIAR' && socio.planFamiliarId) {
      const cabezaFamilia = await prisma.usuario.findFirst({
        where: {
          planFamiliarId: socio.planFamiliarId,
          tipoSocio: 'FAMILIAR',
          familiarId: null // La cabeza de familia no tiene familiarId
        },
        select: { id: true }
      })
      
      if (cabezaFamilia) {
        cuotaUsuarioId = cabezaFamilia.id
      }
    }

    // Obtener todas las cuotas del usuario responsable
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
            id: true,
            estado: true
          }
        }
      },
      orderBy: [
        { anio: 'asc' },
        { mes: 'asc' }
      ]
    })

    // Filtrar solo las cuotas impagas
    const cuotasImpagas = cuotas.filter((cuota) => {
      // Una cuota está impaga si no tiene pagos con estado PAGADO
      const tienePagoPagado = cuota.pagos.some((p) => p.estado === 'PAGADO')
      return !tienePagoPagado
    })

    // Obtener el precio base actual de la cuota
    const precioBase = await getPrecioBaseCuota()

    // Determinar el descuento según el tipo de socio
    let descuento = 0
    let cantidadFamiliares = 0

    if (socio.tipoSocio === 'FAMILIAR' && socio.planFamiliarId) {
      // Contar todos los miembros del plan familiar
      cantidadFamiliares = await prisma.usuario.count({
        where: {
          planFamiliarId: socio.planFamiliarId,
          rol: 'SOCIO'
        }
      })
      // Aplicar 30% de descuento si es familiar
      descuento = 0.30
    }

    // Calcular el monto con descuento
    const montoConDescuento = Math.round(precioBase * (1 - descuento))

    // Formatear las cuotas impagas
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    
    const cuotasFormateadas = cuotasImpagas.map((cuota) => {
      const vencimiento = new Date(cuota.fechaVencimiento).toLocaleDateString('es-AR')
      const periodo = `${meses[cuota.mes - 1]} ${cuota.anio}`

      return {
        id: cuota.id,
        concepto: `Cuota Socio - ${periodo}`,
        periodo,
        mes: cuota.mes,
        anio: cuota.anio,
        monto: montoConDescuento,
        montoOriginal: precioBase,
        vencimiento,
        tipoSocio: socio.tipoSocio
      }
    })

    return NextResponse.json({
      cuotas: cuotasFormateadas,
      tipoSocio: socio.tipoSocio,
      precioBase,
      descuento: descuento * 100, // Retornar como porcentaje
      cantidadFamiliares,
      montoConDescuento
    })
  } catch (error) {
    console.error('Error al obtener cuotas impagas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

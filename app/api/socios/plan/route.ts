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
        tipoSocio: true,
        familiarId: true,
        planFamiliarId: true,
        fechaAlta: true,
        dni: true
      }
    })

    if (!socio) {
      return NextResponse.json(
        { error: 'Socio no encontrado' },
        { status: 404 }
      )
    }

    // Precio base de la cuota mensual (puedes ajustarlo o sacarlo de una tabla de precios)
    const PRECIO_BASE_CUOTA = 5000

    let planInfo: any = {
      tipoSocio: socio.tipoSocio,
      precioBaseCuota: PRECIO_BASE_CUOTA,
      esCabezaDeFamilia: false,
      cantidadMiembros: 1,
      descuento: 0,
      montoTotal: PRECIO_BASE_CUOTA,
      miembrosFamilia: []
    }

    // Si es FAMILIAR
    if (socio.tipoSocio === 'FAMILIAR') {
      // Verificar si es cabeza de familia (familiarId es null)
      const esCabeza = socio.familiarId === null

      if (esCabeza && socio.planFamiliarId) {
        // Es cabeza de familia: buscar todos los miembros
        const miembros = await prisma.usuario.findMany({
          where: {
            planFamiliarId: socio.planFamiliarId,
            rol: 'SOCIO'
          },
          select: {
            id: true,
            nombre: true,
            dni: true,
            fechaNacimiento: true,
            esMenorDe12: true
          },
          orderBy: {
            fechaNacimiento: 'asc'
          }
        })

        const cantidadMiembros = miembros.length
        const montoSinDescuento = PRECIO_BASE_CUOTA * cantidadMiembros
        const descuento = 30 // 30%
        const montoDescuento = Math.round(montoSinDescuento * (descuento / 100))
        const montoTotal = montoSinDescuento - montoDescuento

        planInfo = {
          tipoSocio: 'FAMILIAR',
          precioBaseCuota: PRECIO_BASE_CUOTA,
          esCabezaDeFamilia: true,
          cantidadMiembros,
          descuento,
          montoSinDescuento,
          montoDescuento,
          montoTotal,
          miembrosFamilia: miembros.map(m => ({
            nombre: m.nombre,
            dni: m.dni,
            edad: calcularEdad(m.fechaNacimiento),
            esMenor: m.esMenorDe12
          }))
        }
      } else {
        // No es cabeza de familia
        // Buscar información del cabeza de familia
        let cabezaId = socio.familiarId
        let planFamiliarId = socio.planFamiliarId

        if (!cabezaId && planFamiliarId) {
          // Buscar cabeza usando planFamiliarId
          const cabeza = await prisma.usuario.findFirst({
            where: {
              planFamiliarId: planFamiliarId,
              familiarId: null,
              rol: 'SOCIO'
            },
            select: {
              id: true,
              nombre: true,
              dni: true
            }
          })
          if (cabeza) {
            cabezaId = cabeza.id
          }
        }

        let cabezaNombre = 'Cabeza de familia'
        if (cabezaId) {
          const cabeza = await prisma.usuario.findUnique({
            where: { id: cabezaId },
            select: { nombre: true }
          })
          if (cabeza) cabezaNombre = cabeza.nombre
        }

        planInfo = {
          tipoSocio: 'FAMILIAR',
          precioBaseCuota: PRECIO_BASE_CUOTA,
          esCabezaDeFamilia: false,
          cabezaDeFamilia: cabezaNombre,
          descuento: 30,
          mensaje: `La cuota mensual es pagada por el cabeza de familia con un descuento del 30%.`
        }
      }
    }

    return NextResponse.json({
      socio: {
        nombre: socio.nombre,
        email: socio.email,
        dni: socio.dni,
        fechaAlta: socio.fechaAlta
      },
      plan: planInfo
    })
  } catch (error) {
    console.error('Error al obtener información del plan:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Función auxiliar para calcular edad
function calcularEdad(fechaNacimiento: Date): number {
  const hoy = new Date()
  const nacimiento = new Date(fechaNacimiento)
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const mes = hoy.getMonth() - nacimiento.getMonth()
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--
  }
  return edad
}

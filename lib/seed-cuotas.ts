import { prisma } from './prisma'
import { getPrecioBaseCuota } from './config/cuota'

// Script para crear cuotas de prueba
export async function crearCuotas() {
  try {
    console.log('\n💰 Creando cuotas de prueba...')

    // Obtener todos los socios
    const socios = await prisma.usuario.findMany({
      where: { rol: 'SOCIO' }
    })

    if (socios.length === 0) {
      console.log('⚠️  No hay socios en la base de datos.')
      console.log('Por favor, ejecuta primero: npx tsx lib/seed-data.ts')
      return
    }

    const precioBase = await getPrecioBaseCuota()
    const descuentoFamiliar = 0.30

    // Crear cuotas para los últimos 3 meses y el mes actual
    const fechaActual = new Date()
    const mesActual = fechaActual.getMonth() + 1 // JavaScript months are 0-indexed
    const anioActual = fechaActual.getFullYear()

    let cuotasCreadas = 0

    for (const socio of socios) {
      // Solo crear cuotas para socios principales (no dependientes)
      if (socio.familiarId) {
        console.log(`⏭️  Saltando ${socio.nombre} (familiar dependiente)`)
        continue
      }

      console.log(`📝 Creando cuotas para ${socio.nombre}...`)

      // Calcular el monto según el tipo de socio
      const monto = socio.tipoSocio === 'FAMILIAR' 
        ? Math.round(precioBase * (1 - descuentoFamiliar))
        : precioBase

      // Crear cuotas para los últimos 3 meses
      for (let i = 3; i >= 0; i--) {
        let mes = mesActual - i
        let anio = anioActual

        // Ajustar año si el mes es negativo
        while (mes <= 0) {
          mes += 12
          anio -= 1
        }

        // Fecha de vencimiento: día 10 de cada mes
        const fechaVencimiento = new Date(anio, mes - 1, 10)

        // Verificar si ya existe la cuota
        const cuotaExistente = await prisma.cuota.findFirst({
          where: {
            usuarioSocioId: socio.id,
            mes: mes,
            anio: anio
          }
        })

        if (cuotaExistente) {
          console.log(`  ⏭️  Cuota ${mes}/${anio} ya existe`)
          continue
        }

        const cuota = await prisma.cuota.create({
          data: {
            usuarioSocioId: socio.id,
            mes: mes,
            anio: anio,
            monto: monto,
            fechaVencimiento: fechaVencimiento
          }
        })

        cuotasCreadas++
        console.log(`  ✅ Cuota creada: ${mes}/${anio} - $${monto.toLocaleString('es-AR')}`)
      }
    }

    console.log('\n✅ Cuotas creadas exitosamente!')
    console.log('\n📊 Resumen de cuotas:')
    
    const totalCuotas = await prisma.cuota.count()
    const cuotasImpagas = await prisma.cuota.count({
      where: {
        pagos: {
          none: {
            estado: 'PAGADO'
          }
        }
      }
    })

    console.log(`- Total de cuotas en BD: ${totalCuotas}`)
    console.log(`- Cuotas impagas: ${cuotasImpagas}`)
    console.log(`- Cuotas creadas en esta ejecución: ${cuotasCreadas}`)

  } catch (error) {
    console.error('❌ Error creando cuotas:', error)
    throw error
  }
}

// Para ejecutar desde la línea de comandos
if (require.main === module) {
  crearCuotas()
    .then(async () => {
      console.log('\n🎉 Proceso completado!')
      await prisma.$disconnect()
      process.exit(0)
    })
    .catch(async (error) => {
      await prisma.$disconnect()
      console.error(error)
      process.exit(1)
    })
}

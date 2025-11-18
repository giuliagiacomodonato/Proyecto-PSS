import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🌱 Sembrando cuotas impagas de prueba...\n')

    // 1. Encontrar un socio y prácticas existentes
    const socio = await prisma.usuario.findFirst({
      where: { rol: 'SOCIO' },
    })

    if (!socio) {
      console.log('❌ No hay socios en la base de datos')
      return
    }

    console.log(`✓ Socio encontrado: ${socio.nombre} (ID: ${socio.id})`)

    const practicas = await prisma.practicaDeportiva.findMany({
      take: 3,
    })

    if (practicas.length === 0) {
      console.log('❌ No hay prácticas en la base de datos')
      return
    }

    console.log(`✓ Prácticas encontradas: ${practicas.length}\n`)

    // 2. Crear inscripciones activas para el socio (si no existen)
    console.log('📝 Creando inscripciones...')
    for (const practica of practicas) {
      const inscripcion = await prisma.inscripcion.upsert({
        where: {
          usuarioSocioId_practicaDeportivaId: {
            usuarioSocioId: socio.id,
            practicaDeportivaId: practica.id,
          },
        },
        update: { activa: true },
        create: {
          usuarioSocioId: socio.id,
          practicaDeportivaId: practica.id,
          activa: true,
        },
      })

      console.log(`  ✓ Inscripción activa: ${socio.nombre} → ${practica.nombre}`)

      // 3. Agregar un pago PAGADO del mes anterior para esta práctica
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)

      await prisma.pago.create({
        data: {
          usuarioSocioId: socio.id,
          inscripcionId: inscripcion.id,
          monto: practica.precio,
          tipoPago: 'PRACTICA_DEPORTIVA',
          estado: 'PAGADO',
          fechaPago: lastMonth,
          metodoPago: 'TARJETA_CREDITO',
        },
      })

      console.log(`    ↳ Pago anterior creado (mes pasado)`)
    }

    console.log('\n✅ Cuotas de prueba cargadas exitosamente!')
    console.log('\n📊 Estado actual:')
    console.log('   - El socio tiene 3 inscripciones activas')
    console.log('   - Cada inscripción tiene un pago del mes pasado')
    console.log('   - No hay pagos del mes actual, por lo que todas las cuotas estarán IMPAGAS')
    console.log(`\n🔗 URL de prueba: http://localhost:3000/socio`)
    console.log(`   Usuario: ${socio.email} (o DNI: ${socio.dni})`)

  } catch (error) {
    console.error('❌ Error al sembrar cuotas:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

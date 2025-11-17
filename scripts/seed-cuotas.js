const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Sembrando cuotas impagas de prueba...\n');

    // 1. Encontrar un socio
    const socio = await prisma.usuario.findFirst({
      where: { rol: 'SOCIO' },
    });

    if (!socio) {
      console.log('❌ No hay socios en la base de datos');
      return;
    }

    console.log(`✓ Socio encontrado: ${socio.nombre} (ID: ${socio.id})`);

    // 2. Encontrar prácticas
    const practicas = await prisma.practicaDeportiva.findMany({
      take: 3,
    });

    if (practicas.length === 0) {
      console.log('❌ No hay prácticas en la base de datos');
      return;
    }

    console.log(`✓ Prácticas encontradas: ${practicas.length}\n`);

    // 3. Crear inscripciones activas
    console.log('📝 Creando inscripciones...');
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
      });

      console.log(`  ✓ Inscripción activa: ${socio.nombre} → ${practica.nombre}`);

      // 4. Verificar si hay pago del mes actual
      const ahora = new Date();
      const mesActual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;

      const pagosEsteMes = await prisma.pago.findMany({
        where: {
          usuarioSocioId: socio.id,
          inscripcionId: inscripcion.id,
          estado: 'PAGADO',
        },
      });

      let tienePagoEsteMes = false;
      for (const pago of pagosEsteMes) {
        const fechaPago = new Date(pago.fechaPago);
        const mesPago = `${fechaPago.getFullYear()}-${String(fechaPago.getMonth() + 1).padStart(2, '0')}`;
        if (mesPago === mesActual) {
          tienePagoEsteMes = true;
          break;
        }
      }

      if (!tienePagoEsteMes) {
        console.log(`    ↳ Cuota IMPAGA: No hay pago del mes actual`);
      } else {
        console.log(`    ↳ Cuota PAGADA: Hay pago del mes actual`);
      }
    }

    console.log('\n✅ Cuotas de prueba cargadas exitosamente!');
    console.log('\n📊 Estado actual:');
    console.log('   - El socio tiene inscripciones activas');
    console.log('   - Las cuotas sin pago del mes actual aparecen como IMPAGAS');
    console.log(`\n🔗 Navega a http://localhost:3000/socio para ver las cuotas`);
    console.log(`   Usuario: ${socio.email} (DNI: ${socio.dni})`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();

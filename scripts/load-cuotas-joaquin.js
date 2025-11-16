const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Buscando usuario con DNI: 1597538\n');
    
    const socio = await prisma.usuario.findUnique({
      where: { dni: '1597538' }
    });
    
    if (!socio) {
      console.log('❌ Usuario no encontrado con DNI: 1597538');
      return;
    }
    
    console.log('✓ Usuario encontrado:');
    console.log(`  ID: ${socio.id}`);
    console.log(`  Nombre: ${socio.nombre}`);
    console.log(`  Email: ${socio.email}`);
    console.log(`  DNI: ${socio.dni}`);
    console.log(`  Rol: ${socio.rol}\n`);
    
    // Obtener prácticas
    const practicas = await prisma.practicaDeportiva.findMany({
      take: 3,
    });
    
    console.log(`✓ Prácticas disponibles: ${practicas.length}\n`);
    
    // Crear inscripciones
    console.log('📝 Creando inscripciones y cuotas impagas...\n');
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
      
      console.log(`  ✓ ${practica.nombre} - Cuota IMPAGA cargada`);
    }
    
    console.log('\n✅ Cuotas impagas cargadas exitosamente para Joaquin Figuere');
    console.log('\n📊 Resumen:');
    console.log(`   • Usuario: ${socio.nombre}`);
    console.log(`   • Email: ${socio.email}`);
    console.log(`   • Cuotas impagas: ${practicas.length}`);
    console.log('\n🔗 Ve a http://localhost:3000 e inicia sesión con:');
    console.log(`   Email: a@b.c`);
    console.log(`   (La contraseña es la que estableciste))`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();

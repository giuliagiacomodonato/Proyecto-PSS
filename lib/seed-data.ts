import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

// Definir los enums
const RolUsuario = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  SOCIO: 'SOCIO',
  ENTRENADOR: 'ENTRENADOR'
} as const

const TipoSocio = {
  INDIVIDUAL: 'INDIVIDUAL',
  FAMILIAR: 'FAMILIAR'
} as const

// Función auxiliar para hashear contraseñas
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

// Script para crear solo usuarios
export async function crearUsuarios() {
  try {
    console.log('🌱 Creando usuarios de prueba...')
    console.log('🔐 Hasheando contraseñas...')

    // 1. Crear usuarios admin usando upsert con contraseñas hasheadas
    const admin = await prisma.usuario.upsert({
      where: { dni: '12345678' },
      update: {},
      create: {
        rol: RolUsuario.ADMIN,
        nombre: 'Juan Carlos Administrador',
        dni: '12345678',
        fechaNacimiento: new Date('1980-05-15'),
        email: 'admin@club.com',
        telefono: '1234567890',
        contraseña: await hashPassword('Admin123!')
      }
    })
    console.log('✅ Admin creado: admin@club.com')
   
    // 2. Crear socios usando upsert con contraseñas hasheadas
    const socio1 = await prisma.usuario.upsert({
      where: { dni: '45678901' },
      update: {},
      create: {
        rol: RolUsuario.SOCIO,
        nombre: 'Pedro Socio Individual',
        dni: '45678901',
        fechaNacimiento: new Date('1990-12-05'),
        email: 'pedro@email.com',
        telefono: '4567890123',
        contraseña: await hashPassword('Pedro123!'),
        tipoSocio: TipoSocio.INDIVIDUAL,
        direccion: 'Av. Principal 123, Ciudad'
      }
    })
    console.log('✅ Socio 1 creado: pedro@email.com')

    const socio2 = await prisma.usuario.upsert({
      where: { dni: '56789012' },
      update: {},
      create: {
        rol: RolUsuario.SOCIO,
        nombre: 'Ana Socio Familiar Principal',
        dni: '56789012',
        fechaNacimiento: new Date('1987-08-22'),
        email: 'ana@email.com',
        telefono: '5678901234',
        contraseña: await hashPassword('Ana123!'),
        tipoSocio: TipoSocio.FAMILIAR,
        direccion: 'Calle Secundaria 456, Ciudad'
      }
    })
    console.log('✅ Socio 2 creado: ana@email.com')

    const socio3 = await prisma.usuario.upsert({
      where: { dni: '67890123' },
      update: {},
      create: {
        rol: RolUsuario.SOCIO,
        nombre: 'Luis Socio Familiar Dependiente',
        dni: '67890123',
        fechaNacimiento: new Date('1992-04-18'),
        email: 'luis@email.com',
        telefono: '6789012345',
        contraseña: await hashPassword('Luis123!'),
        tipoSocio: TipoSocio.FAMILIAR,
        direccion: 'Calle Secundaria 456, Ciudad',
        familiarId: socio2.id
      }
    })
    console.log('✅ Socio 3 creado: luis@email.com')

    // 3. Crear entrenador de ejemplo
    const entrenador = await prisma.usuario.upsert({
      where: { dni: '11223344' },
      update: {},
      create: {
        rol: RolUsuario.ENTRENADOR,
        nombre: 'Carlos Entrenador',
        dni: '11223344',
        fechaNacimiento: new Date('1985-03-10'),
        email: 'carlos@club.com',
        telefono: '1122334455',
        contraseña: await hashPassword('Carlos123!')
      }
    })
    console.log('✅ Entrenador creado: carlos@club.com')

    console.log('\n✅ Usuarios creados exitosamente!')
    console.log('\n📊 Resumen:')
    console.log(`- 1 Admin con contraseña hasheada`)
    console.log(`- 3 Socios con contraseñas hasheadas`)
    console.log(`- 1 Entrenador con contraseña hasheada`)
    
    console.log('\n🔑 Credenciales de prueba:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Admin:')
    console.log('  Email: admin@club.com')
    console.log('  Contraseña: Admin123!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Socio 1 (Individual):')
    console.log('  Email: pedro@email.com')
    console.log('  Contraseña: Pedro123!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Socio 2 (Familiar Principal):')
    console.log('  Email: ana@email.com')
    console.log('  Contraseña: Ana123!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Socio 3 (Familiar Dependiente):')
    console.log('  Email: luis@email.com')
    console.log('  Contraseña: Luis123!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Entrenador:')
    console.log('  Email: carlos@club.com')
    console.log('  Contraseña: Carlos123!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  } catch (error) {
    console.error('❌ Error creando usuarios:', error)
    throw error
  }
}

// Para ejecutar desde la línea de comandos
if (require.main === module) {
  crearUsuarios()
    .then(async () => {
      await prisma.$disconnect()
      process.exit(0)
    })
    .catch(async (error) => {
      await prisma.$disconnect()
      console.error(error)
      process.exit(1)
    })
}
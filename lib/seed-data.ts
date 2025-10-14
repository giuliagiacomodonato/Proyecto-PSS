import { prisma } from './prisma'

// Definir los enums
const TipoCancha = {
  FUTBOL_5: 'FUTBOL_5',
  FUTBOL: 'FUTBOL',
  BASQUET: 'BASQUET'
} as const

const RolUsuario = {
  ADMIN: 'ADMIN',
  SOCIO: 'SOCIO',
  ENTRENADOR: 'ENTRENADOR'
} as const

const TipoSocio = {
  INDIVIDUAL: 'INDIVIDUAL',
  FAMILIAR: 'FAMILIAR'
} as const

const DiaSemana = {
  LUNES: 'LUNES',
  MARTES: 'MARTES',
  MIERCOLES: 'MIERCOLES',
  JUEVES: 'JUEVES',
  VIERNES: 'VIERNES',
  SABADO: 'SABADO',
  DOMINGO: 'DOMINGO'
} as const

// Script para crear datos de prueba
export async function crearDatosDePrueba() {
  try {
    console.log('🌱 Creando datos de prueba...')

    // 1. Crear prácticas deportivas usando upsert para evitar duplicados
    const futbol5 = await prisma.practicaDeportiva.upsert({
      where: { nombre: 'Fútbol 5' },
      update: {},
      create: {
        nombre: 'Fútbol 5',
        descripcion: 'Práctica de fútbol en cancha de 5 jugadores por equipo',
        precio: 2000,
        cupo: 10,
        horarios: {
          create: [
            { dia: DiaSemana.LUNES, horaInicio: '18:00', horaFin: '19:00' },
            { dia: DiaSemana.MIERCOLES, horaInicio: '18:00', horaFin: '19:00' },
            { dia: DiaSemana.VIERNES, horaInicio: '18:00', horaFin: '19:00' }
          ]
        }
      }
    })

    const basquet = await prisma.practicaDeportiva.upsert({
      where: { nombre: 'Básquet' },
      update: {},
      create: {
        nombre: 'Básquet',
        descripcion: 'Práctica de básquetbol en cancha reglamentaria',
        precio: 1500,
        cupo: 10,
        horarios: {
          create: [
            { dia: DiaSemana.LUNES, horaInicio: '20:00', horaFin: '21:00' },
            { dia: DiaSemana.MIERCOLES, horaInicio: '20:00', horaFin: '21:00' },
            { dia: DiaSemana.VIERNES, horaInicio: '20:00', horaFin: '21:00' }
          ]
        }
      }
    })

    // 2. Crear canchas usando upsert
    const cancha1 = await prisma.cancha.upsert({
      where: { numero: 1 },
      update: {},
      create: {
        numero: 1,
        tipo: TipoCancha.FUTBOL_5,
        ubicacion: 'Sector Norte, entrada principal',
        precio: 5000,
        capacidad: 10,
        horariosInicio: '08:00',
        horariosFin: '22:00',
        practicaDeportivaId: futbol5.id
      }
    })

    const cancha2 = await prisma.cancha.upsert({
      where: { numero: 2 },
      update: {},
      create: {
        numero: 2,
        tipo: TipoCancha.FUTBOL_5,
        ubicacion: 'Sector Norte, al lado de cancha 1',
        precio: 5000,
        capacidad: 10,
        horariosInicio: '08:00',
        horariosFin: '22:00',
        practicaDeportivaId: futbol5.id
      }
    })

    const cancha4 = await prisma.cancha.upsert({
      where: { numero: 4 },
      update: {},
      create: {
        numero: 4,
        tipo: TipoCancha.BASQUET,
        ubicacion: 'Sector Sur, gimnasio cubierto',
        precio: 3000,
        capacidad: 15,
        horariosInicio: '09:00',
        horariosFin: '23:00',
        practicaDeportivaId: basquet.id
      }
    })

    // 3. Crear usuarios admin usando upsert
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
        contraseña: 'Admin123!'
      }
    })
   
    // 4. Crear socios usando upsert
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
        contraseña: 'Pedro123!',
        tipoSocio: TipoSocio.INDIVIDUAL,
        direccion: 'Av. Principal 123, Ciudad'
      }
    })

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
        contraseña: 'Ana123!',
        tipoSocio: TipoSocio.FAMILIAR,
        direccion: 'Calle Secundaria 456, Ciudad'
      }
    })

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
        contraseña: 'Luis123!',
        tipoSocio: TipoSocio.FAMILIAR,
        direccion: 'Calle Secundaria 456, Ciudad',
        familiarId: socio2.id
      }
    })

    // 5. Crear algunos turnos de ejemplo (solo si no existen)
    const existingTurnos = await prisma.turno.count()
    if (existingTurnos === 0) {
      const mañana = new Date()
      mañana.setDate(mañana.getDate() + 1) // Mañana

      await prisma.turno.createMany({
        data: [
          {
            canchaId: cancha1.id,
            horaInicio: '18:00',
            fecha: mañana,
            reservado: true,
            usuarioSocioId: socio1.id
          },
          {
            canchaId: cancha1.id,
            horaInicio: '19:00',
            fecha: mañana,
            reservado: false
          },
          {
            canchaId: cancha2.id,
            horaInicio: '18:00',
            fecha: mañana,
            reservado: false
          },
          {
            canchaId: cancha4.id,
            horaInicio: '20:00',
            fecha: mañana,
            reservado: false
          }
        ]
      })
      console.log('✅ Turnos de ejemplo creados')
    } else {
      console.log('ℹ️ Turnos ya existen, saltando creación')
    }

    console.log('✅ Datos de prueba creados exitosamente!')
    console.log('📊 Resumen:')
    console.log(`- 2 Prácticas deportivas verificadas/creadas`)
    console.log(`- 3 Canchas verificadas/creadas`)
    console.log(`- 1 Admin verificado/creado`)
    console.log(`- 3 Socios verificados/creados`)

  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error)
    throw error
  }
}

// Función para limpiar todos los datos
export async function limpiarDatos() {
  try {
    console.log('🧹 Limpiando base de datos...')
    
    await prisma.turno.deleteMany()
    await prisma.horario.deleteMany()
    await prisma.usuario.deleteMany()
    await prisma.cancha.deleteMany()
    await prisma.practicaDeportiva.deleteMany()
    
    console.log('✅ Base de datos limpiada exitosamente!')
  } catch (error) {
    console.error('❌ Error limpiando datos:', error)
    throw error
  }
}

// Para ejecutar desde la línea de comandos
if (require.main === module) {
  crearDatosDePrueba()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}
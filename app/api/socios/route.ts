import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { socio, familiares } = body;

    // Validar que el usuario sea administrador (esto se puede mejorar con autenticación)
    // Por ahora, asumimos que si llega aquí es porque es admin
    
    // Validar datos del socio principal
    if (!socio.nombre || !socio.dni || !socio.email || !socio.telefono || !socio.contraseña) {
      return NextResponse.json(
        { message: 'Faltan campos obligatorios del socio principal' },
        { status: 400 }
      );
    }

    // Verificar que el DNI no esté en uso
    const dniExistente = await prisma.usuario.findFirst({
      where: { dni: socio.dni }
    });

    if (dniExistente) {
      return NextResponse.json(
        { message: 'El DNI ya está registrado' },
        { status: 400 }
      );
    }

    // Verificar que el email no esté en uso
    const emailExistente = await prisma.usuario.findFirst({
      where: { email: socio.email }
    });

    if (emailExistente) {
      return NextResponse.json(
        { message: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(socio.contraseña, 10);

    // Crear el socio principal
    const nuevoSocio = await prisma.usuario.create({
      data: {
        rol: 'SOCIO',
        nombre: socio.nombre,
        dni: socio.dni,
        fechaNacimiento: new Date(socio.fechaNacimiento),
        email: socio.email,
        telefono: socio.telefono,
        direccion: socio.direccion,
        contraseña: hashedPassword,
        tipoSocio: socio.tipoSocio,
        fechaAlta: new Date()
      }
    });

    // Si es plan familiar, crear los familiares
    if (socio.tipoSocio === 'FAMILIAR' && familiares && familiares.length > 0) {
      // Verificar que se hayan agregado al menos 3 familiares
      if (familiares.length < 3) {
        return NextResponse.json(
          { message: 'El plan familiar requiere al menos 3 integrantes adicionales' },
          { status: 400 }
        );
      }

      // Validar y crear cada familiar
      for (const familiar of familiares) {
        // Verificar que el DNI del familiar no esté en uso
        const dniFamiliarExistente = await prisma.usuario.findFirst({
          where: { dni: familiar.dni }
        });

        if (dniFamiliarExistente) {
          return NextResponse.json(
            { message: `El DNI ${familiar.dni} ya está registrado` },
            { status: 400 }
          );
        }

        // Verificar que el email del familiar no esté en uso
        const emailFamiliarExistente = await prisma.usuario.findFirst({
          where: { email: familiar.email }
        });

        if (emailFamiliarExistente) {
          return NextResponse.json(
            { message: `El email ${familiar.email} ya está registrado` },
            { status: 400 }
          );
        }

        // Hash de la contraseña del familiar
        const hashedPasswordFamiliar = await bcrypt.hash(familiar.contraseña, 10);

        // Crear el familiar
        await prisma.usuario.create({
          data: {
            rol: 'SOCIO',
            nombre: familiar.nombre,
            dni: familiar.dni,
            fechaNacimiento: new Date(familiar.fechaNacimiento),
            email: familiar.email,
            telefono: familiar.telefono,
            contraseña: hashedPasswordFamiliar,
            tipoSocio: 'FAMILIAR',
            familiarId: nuevoSocio.id, // Referencia al socio principal
            fechaAlta: new Date()
          }
        });
      }
    }

    return NextResponse.json(
      { 
        message: 'Socio registrado exitosamente',
        socio: {
          id: nuevoSocio.id,
          nombre: nuevoSocio.nombre,
          tipoSocio: nuevoSocio.tipoSocio,
          familiares: socio.tipoSocio === 'FAMILIAR' ? familiares.length : 0
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error al registrar socio:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Endpoint para verificar si un socio ya existe (para validación de cambio de plan)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dni = searchParams.get('dni');
    const email = searchParams.get('email');

    if (!dni && !email) {
      return NextResponse.json(
        { message: 'Se requiere DNI o email para la búsqueda' },
        { status: 400 }
      );
    }

    const whereClause: any = {};
    if (dni) whereClause.dni = dni;
    if (email) whereClause.email = email;

    const socio = await prisma.usuario.findFirst({
      where: {
        ...whereClause,
        rol: 'SOCIO'
      },
      select: {
        id: true,
        nombre: true,
        dni: true,
        email: true,
        tipoSocio: true,
        fechaAlta: true
      }
    });

    if (socio) {
      return NextResponse.json({
        existe: true,
        socio: socio
      });
    } else {
      return NextResponse.json({
        existe: false
      });
    }

  } catch (error) {
    console.error('Error al buscar socio:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

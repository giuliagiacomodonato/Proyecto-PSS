// Archivo: app/api/login/route.js
// Endpoint POST /api/login para autenticación y diferenciación de roles.

// --- 1. Módulos de seguridad ---
// Nota: Instalar dependencias si las vas a usar en producción:
// pnpm add bcryptjs jsonwebtoken @prisma/client
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'

// --- Configuración de Prisma (DESCOMENTAR cuando se quiera usar) ---
/*
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
*/

// Clave secreta para firmar el JWT (leer desde .env.local)
const JWT_SECRET = process.env.JWT_SECRET || 'CLAVE_SECRETA_FALLBACK'

// --- MOCK DE USUARIOS (USADO HASTA QUE SE ACTIVE PRISMA) ---
const MOCK_USERS = [
    { id: 1, email: 'admin@club.test', hashedPassword: '$2b$10$aW418tm3mgBZGskQqB5xpuYSXPzzRdHHec/2kNpmDv6NzGKN4uOuq', rol: 'ADMIN' },
    { id: 2, email: 'entrenador@club.test', hashedPassword: '$2b$10$aW418tm3mgBZGskQqB5xpuYSXPzzRdHHec/2kNpmDv6NzGKN4uOuq', rol: 'ENTRENADOR' },
    { id: 3, email: 'socio@club.test', hashedPassword: '$2b$10$aW418tm3mgBZGskQqB5xpuYSXPzzRdHHec/2kNpmDv6NzGKN4uOuq', rol: 'SOCIO' },
    // Cuenta demo extra solicitada
    { id: 4, email: 'user@club.test', hashedPassword: '$2b$10$aW418tm3mgBZGskQqB5xpuYSXPzzRdHHec/2kNpmDv6NzGKN4uOuq', rol: 'SOCIO' },
]
// Nota: 'Pass1234!' hasheada es '$2b$10$aW418tm3mgBZGskQqB5xpuYSXPzzRdHHec/2kNpmDv6NzGKN4uOuq'

// Handler para POST
export async function POST(request) {
    try {
        const body = await request.json()
        // Aceptar tanto 'password' como 'contraseña' por compatibilidad con frontends en español
        const email = body.email
        const password = body.password ?? body.contraseña

        if (!email || !password) {
            return new Response(JSON.stringify({ error: 'Faltan credenciales (email y contraseña son obligatorios).' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            })
        }

            let user = null
            let isPasswordCorrect = false

            // Lógica mock (usada en desarrollo)
            user = MOCK_USERS.find((u) => u.email === email)
            if (!user) {
                // Si el email pertenece al dominio club.test, asumimos "sin acceso" en lugar de genérico 404
                if (typeof email === 'string' && email.toLowerCase().endsWith('@club.test')) {
                    console.debug('[API LOGIN] Usuario no encontrado, dominio club.test -> acceso denegado:', email)
                    return new Response(JSON.stringify({ error: 'Esta cuenta no está registrada.' }), {
                        status: 403,
                        headers: { 'Content-Type': 'application/json' },
                    })
                }
                console.debug('[API LOGIN] Usuario no encontrado (no club.test):', email)
                return new Response(JSON.stringify({ error: 'Usuario no registrado.' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' },
                })
            }

            // Si existe usuario, comparar contraseña
            isPasswordCorrect = await bcrypt.compare(password, user.hashedPassword)

            // Lógica real con Prisma (activar cuando se desee usar DB)
            /*
            user = await prisma.usuario.findUnique({ where: { email } })
            if (!user) {
                return new Response(JSON.stringify({ error: 'Usuario no registrado.' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
            }
            isPasswordCorrect = await bcrypt.compare(password, user.contraseña)
            */

            if (!isPasswordCorrect) {
                return new Response(JSON.stringify({ error: 'Contraseña incorrecta.' }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' },
                })
            }

        const token = jwt.sign({ userId: user.id, rol: user.rol }, JWT_SECRET, { expiresIn: '1d' })

        return new Response(JSON.stringify({ message: 'Inicio de sesión exitoso', rol: user.rol, token }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Error en la API de Login:', error)
        return new Response(JSON.stringify({ error: 'Error interno del servidor.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

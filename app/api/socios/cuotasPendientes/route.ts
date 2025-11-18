import { NextResponse } from 'next/server'

// Minimal GET handler for cuotasPendientes — returns an empty list by default.
export async function GET(request: Request) {
	try {
		return NextResponse.json({ cuotas: [] })
	} catch (err) {
		console.error('Error en cuotasPendientes GET', err)
		return NextResponse.json({ error: 'Error interno' }, { status: 500 })
	}
}

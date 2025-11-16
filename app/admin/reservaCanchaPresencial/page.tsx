"use client"

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ReservaCancha from '../../components/ReservaCancha'
import LoadingSpinner from '../../components/LoadingSpinner'
import Breadcrumb from '../../components/Breadcrumb'
import Link from 'next/link'

interface Usuario {
	id: number
	nombre: string
	dni: string
	rol: string
}

function ReservaCanchaPresencialContent() {
	const searchParams = useSearchParams()
	const router = useRouter()
	const dniQuery = searchParams?.get('dni') || ''

	const [usuario, setUsuario] = useState<Usuario | null>(null)
	const [loading, setLoading] = useState<boolean>(!!dniQuery)
	const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!dniQuery) {
			setLoading(false)
			return
		}

		const fetchUsuario = async () => {
			setLoading(true)
			try {
				const params = new URLSearchParams()
				params.append('dni', dniQuery)
				const res = await fetch(`/api/usuarios?${params.toString()}`)
				const data = await res.json()
				if (!res.ok) throw new Error(data.error || 'Error al buscar usuario')
				const usuarios = data.usuarios || []
				if (usuarios.length === 0) {
					setError('No se encontró ningún usuario con ese DNI')
					setUsuario(null)
				} else {
					// Tomar el primero
					setUsuario(usuarios[0])
				}
			} catch (e: any) {
				setError(e.message || 'Error al buscar usuario')
				setUsuario(null)
			} finally {
				setLoading(false)
			}
		}

		fetchUsuario()
	}, [dniQuery])

	const showMensaje = (texto: string, tipo: 'success' | 'error' = 'success') => {
		setMensaje({ tipo, texto })
	}

	return (
		<>
			<div className="max-w-6xl mx-auto">
				<div className="mb-8">
					<Breadcrumb items={[
						{ label: 'Panel Admin', href: '/admin' },
						{ label: 'Reserva Presencial', active: true }
					]} />
					<div className="flex justify-between items-center">
						<div>
							<h1 className="text-3xl font-bold text-gray-900">Reserva presencial para socio</h1>
							<p className="text-sm text-gray-500 mt-2">Crear una reserva en nombre de un socio</p>
						</div>
						<div>
							<Link href="/admin/grillaUsuarios" className="text-sm text-blue-600">Volver a la grilla</Link>
						</div>
					</div>
				</div>

				{loading ? (
					<LoadingSpinner />
				) : (
					<div className="bg-white rounded-lg p-6 shadow">
						{!dniQuery ? (
							<div className="text-sm text-gray-700">
								No se proporcionó un DNI. Seleccioná "Reservar" en la grilla de usuarios para abrir esta página con el DNI prefijado.
							</div>
						) : error ? (
							<div className="text-red-600">{error}</div>
						) : usuario ? (
							<div className="space-y-4">
								<div>
									<label className="block text-sm text-gray-700">DNI del socio</label>
									<input value={usuario.dni} readOnly className="mt-1 p-2 border rounded w-48 bg-gray-100" />
									<p className="text-xs text-gray-500 mt-1">Reserva en nombre de <strong>{usuario.nombre}</strong></p>
								</div>

								{/* Pasar usuario.id a ReservaCancha para que asocie la reserva al socio correcto */}
								<ReservaCancha
									usuarioSocioId={usuario.id}
									onSuccess={() => showMensaje('Reserva realizada correctamente')}
									onError={(msg: string) => showMensaje(msg, 'error')}
								/>
							</div>
						) : (
							<div className="text-gray-600">No hay datos del socio para mostrar.</div>
						)}
					</div>
				)}
			</div>

		{mensaje && (
			<div className={`fixed left-1/2 -translate-x-1/2 bottom-8 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap z-50 ${mensaje.tipo === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
				{mensaje.texto}
			</div>
		)}
	</>
	)
}

export default function ReservaCanchaPresencialAdminPage() {
	return (
		<Suspense fallback={<LoadingSpinner />}>
			<ReservaCanchaPresencialContent />
		</Suspense>
	)
}
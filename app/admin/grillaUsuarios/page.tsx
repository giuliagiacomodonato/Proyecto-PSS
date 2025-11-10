"use client"

import React, { useEffect, useState } from 'react'
import Sidebar from '@/app/components/Sidebar'
import { useAdminProtection } from '@/app/hooks/useAdminProtection'
import Link from 'next/link'

type Usuario = { id: number; nombre: string; dni: string; rol: string }

export default function GrillaUsuariosPage() {
	const { isAuthorized, usuario, isChecking } = useAdminProtection()
	const [usuarios, setUsuarios] = useState<Usuario[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// modal / acciones
	const [showConfirmModal, setShowConfirmModal] = useState(false)
	const [pendingDeleteDni, setPendingDeleteDni] = useState<string | null>(null)
	const [actionLoading, setActionLoading] = useState(false)
	const [actionError, setActionError] = useState<string | null>(null)
	const [successMessage, setSuccessMessage] = useState<string | null>(null)

	// filtros
	const [roleFilter, setRoleFilter] = useState('')
	const [nombreFilter, setNombreFilter] = useState('')
	const [dniFilter, setDniFilter] = useState('')

	const fetchUsuarios = async () => {
		if (!usuario) return
		setLoading(true)
		setError(null)
		try {
			const params = new URLSearchParams()
			if (roleFilter) params.append('role', roleFilter)
			if (nombreFilter) params.append('nombre', nombreFilter)
			if (dniFilter) params.append('dni', dniFilter)
			params.append('excludeId', String(usuario.id))

			const res = await fetch(`/api/usuarios?${params.toString()}`)
			const data = await res.json()
			if (!res.ok) throw new Error(data.error || 'Error al obtener usuarios')
			setUsuarios(data.usuarios || [])
		} catch (e: any) {
			setError(e.message || 'Error al obtener usuarios')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (!isChecking && isAuthorized) fetchUsuarios()
	}, [isChecking, isAuthorized])

	const handleBuscar = (e: React.FormEvent) => {
		e.preventDefault()
		fetchUsuarios()
	}

	const handleEliminar = async (dni: string) => {
		// Abrir modal de confirmación
		setPendingDeleteDni(dni)
		setActionError(null)
		setShowConfirmModal(true)
	}

	const confirmDelete = async () => {
		if (!pendingDeleteDni) return
		setActionLoading(true)
		setActionError(null)
		try {
			const res = await fetch('/api/usuarios', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ dni: pendingDeleteDni })
			})
			const data = await res.json()
			if (!res.ok) throw new Error(data.error || 'Error al eliminar')
			// refrescar y cerrar modal
			fetchUsuarios()
			setShowConfirmModal(false)
			setPendingDeleteDni(null)
			setSuccessMessage('Usuario eliminado correctamente')
			setTimeout(() => setSuccessMessage(null), 3000)
		} catch (e: any) {
			setActionError(e.message || 'Error al eliminar usuario')
		} finally {
			setActionLoading(false)
		}
	}

	if (isChecking) return <div className="p-8">Comprobando permisos...</div>

	return (
		<div className="flex min-h-screen bg-white">
			<Sidebar />
			<main className="flex-1 p-8 bg-gray-50">
				<div className="max-w-6xl mx-auto">
					{successMessage && (
						<div className="mb-4 text-green-600">{successMessage}</div>
					)}

					{/* Modal de confirmación */}
					{showConfirmModal && (
						<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
							<div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6">
								<h2 className="text-lg font-semibold mb-2">Confirmar baja</h2>
								<p className="text-sm text-gray-700 mb-4">¿Estás seguro que querés eliminar al usuario con DNI <strong>{pendingDeleteDni}</strong>? Esta acción no se puede deshacer.</p>
								{actionError && <div className="text-sm text-red-600 mb-3">{actionError}</div>}
								<div className="flex justify-end gap-2">
									<button onClick={() => { setShowConfirmModal(false); setPendingDeleteDni(null); setActionError(null); }} className="px-4 py-2 rounded border">Cancelar</button>
									<button onClick={confirmDelete} disabled={actionLoading} className="px-4 py-2 rounded bg-red-600 text-white">
										{actionLoading ? 'Eliminando...' : 'Confirmar eliminación'}
									</button>
								</div>
							</div>
						</div>
					)}
					<h1 className="text-2xl font-bold mb-4">Usuarios</h1>

					<form onSubmit={handleBuscar} className="flex gap-3 items-end mb-4">
						<div>
							<label className="block text-sm text-gray-700">Rol</label>
							<select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="mt-1 p-2 border rounded text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200">
								<option value="">Todos</option>
								<option value="ADMIN">Administrador</option>
								<option value="ENTRENADOR">Entrenador</option>
								<option value="SOCIO">Socio</option>
							</select>
						</div>

						<div>
							<label className="block text-sm text-gray-700">Nombre</label>
							<input value={nombreFilter} onChange={(e) => setNombreFilter(e.target.value)} className="mt-1 p-2 border rounded text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200" />
						</div>

						<div>
							<label className="block text-sm text-gray-700">DNI</label>
							<input value={dniFilter} onChange={(e) => setDniFilter(e.target.value)} className="mt-1 p-2 border rounded text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200" />
						</div>

						<div>
							<button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">Buscar</button>
						</div>
					</form>

					<div className="bg-white rounded-lg p-6 shadow">
						{loading ? (
							<div>Cargando...</div>
						) : error ? (
							<div className="text-red-600">{error}</div>
						) : usuarios.length === 0 ? (
							<div className="text-gray-600">No se encontraron coincidencias</div>
						) : (
							<table className="w-full text-left table-fixed">
								<thead>
									<tr className="text-sm text-gray-600">
										<th className="w-2/5 py-2">Nombre Completo</th>
										<th className="w-1/12 py-2">DNI</th>
										<th className="w-1/12 py-2">Rol</th>
										<th className="w-1/12 py-2">Reservar</th>
										<th className="w-1/12 py-2">Pagos</th>
										<th className="w-1/12 py-2">Modificar</th>
										<th className="w-1/12 py-2">Eliminar</th>
									</tr>
								</thead>
								<tbody>
									{usuarios.map((u) => (
										<tr key={u.id} className="border-t">
											<td className="py-3 text-sm text-gray-800 truncate" title={u.nombre}>{u.nombre}</td>
											<td className="py-3 text-sm text-gray-600 truncate" title={u.dni}>{u.dni}</td>
											<td className="py-3 text-sm text-gray-600">{u.rol.toLowerCase()}</td>
											<td className="py-3 text-sm">
												{/* Redirige a la página de reserva presencial, pasando el dni para prefilling */}
												<Link href={`/admin/reservaCanchaPresencial?dni=${u.dni}`} className="text-blue-600">Reservar</Link>
											</td>
											<td className="py-3 text-sm">
												<button className="text-blue-600">Pagos</button>
											</td>
											<td className="py-3 text-sm">
												{/* Modificar: redirigir a la página correspondiente pasando dni */}
												{u.rol === 'ADMIN' && (
													<Link href={`/admin/modificarAdmin?dni=${u.dni}`} className="text-blue-600">Modificar</Link>
												)}
												{u.rol === 'ENTRENADOR' && (
													<Link href={`/admin/modifEntrenador?dni=${u.dni}`} onClick={() => {
														try { sessionStorage.setItem('returnTo', '/admin/grillaUsuarios') } catch (e) {}
													}} className="text-blue-600">Modificar</Link>
												)}
												{u.rol === 'SOCIO' && (
													<Link href={`/admin/modifSocio?dni=${u.dni}`} onClick={() => {
														try { sessionStorage.setItem('returnTo', '/admin/grillaUsuarios') } catch (e) {}
													}} className="text-blue-600">Modificar</Link>
												)}
											</td>
											<td className="py-3 text-sm">
												<button onClick={() => handleEliminar(u.dni)} className="text-red-600">Eliminar</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>
				</div>
			</main>
		</div>
	)
}


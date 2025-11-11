"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import Sidebar from '@/app/components/Sidebar'
import { Input } from '@/app/components/input'
import { Button } from '@/app/components/button'
import LoadingSpinner from '@/app/components/LoadingSpinner'

type Debt = {
	id: string
	concept: string
	amount: number
	dueDate: string
	status: "PENDIENTE" | "VENCIDO" | "PAGADO"
	type: "CUOTA_MENSUAL" | "PRACTICA_DEPORTIVA" | "RESERVA_CANCHA"
}

export default function GestionPagosPage() {
	const searchParams = useSearchParams()
	const prefillDni = searchParams?.get('dni') || ''

	const [dni, setDni] = useState(prefillDni)
	const [loading, setLoading] = useState(false)
	const [socio, setSocio] = useState<any | null>(null)
	const [pending, setPending] = useState<Debt[]>([])
	const [history, setHistory] = useState<any[]>([])
	const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({})

	const [activeTab, setActiveTab] = useState<'PENDIENTES'|'HISTORIAL'>('PENDIENTES')

	const [showModal, setShowModal] = useState(false)
	const [payMethod, setPayMethod] = useState('EFECTIVO')
	const [notes, setNotes] = useState('')
	const [processing, setProcessing] = useState(false)
	const [lastComprobante, setLastComprobante] = useState<string | null>(null)
	const [toast, setToast] = useState<{ type: 'error' | 'success'; msg: string } | null>(null)

	useEffect(() => {
		if (prefillDni) {
			// auto search when arrives with dni param
			handleSearch(prefillDni)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const total = useMemo(() => {
		return pending.reduce((sum, d) => selectedIds[d.id] ? sum + d.amount : sum, 0)
	}, [pending, selectedIds])

	async function handleSearch(dniParam?: string) {
		const queryDni = dniParam ?? dni
		if (!queryDni) return
		setLoading(true)
		try {
			const res = await fetch(`/api/socios?dni=${encodeURIComponent(queryDni)}`)
			// parse JSON safely (some routes may return empty body)
			let data: any = {}
			const text = await res.text()
			if (text) {
				try {
					data = JSON.parse(text)
				} catch (e) {
					console.error('Invalid JSON from /api/socios:', text)
					data = {}
				}
			}
			if (!res.ok || !data.existe) {
				setSocio(null)
				setPending([])
				setHistory([])
				return
			}
					setSocio(data.socio)
					console.log('DEBUG: socio from /api/socios', data.socio)

					// Load pending debts from backend
					try {
						const deudasRes = await fetch(`/api/deudas?usuarioSocioId=${data.socio.id}`)
						let deudasJson: any = {}
						try {
							const textD = await deudasRes.text()
							if (textD) {
								deudasJson = JSON.parse(textD)
							} else {
								deudasJson = {}
							}
						} catch (e) {
							console.error('Invalid JSON from /api/deudas:', e)
							deudasJson = {}
						}
						console.log('DEBUG: /api/deudas status', deudasRes.status)
						console.log('DEBUG: deudasJson', deudasJson)
						if (deudasRes.ok && Array.isArray(deudasJson.deudas)) {
							// map to Debt[] shape
							const mapped: Debt[] = deudasJson.deudas.map((d: any) => ({
								id: d.id,
								concept: d.concept,
								amount: Number(d.amount || 0),
								dueDate: new Date(d.dueDate).toLocaleDateString(),
								status: d.status || 'PENDIENTE',
								type: d.type
							}))
							console.log('DEBUG: mapped deudas', mapped)
							// split between pending and history according to status
							setPending(mapped.filter(m => m.status === 'PENDIENTE'))
							setHistory(mapped.filter(m => m.status === 'PAGADO'))
						} else {
							setPending([])
						}
					} catch (err) {
						console.error('Error loading deudas', err)
						setPending([])
					}
					// reset selected ids
					setSelectedIds({})
		} catch (err) {
			console.error(err)
		} finally {
			setLoading(false)
		}
	}

	function toggleSelect(id: string) {
		setSelectedIds(prev => ({ ...prev, [id]: !prev[id] }))
	}

	function openRegister() {
		if (total <= 0) return
		setPayMethod('EFECTIVO')
		setNotes('')
		setShowModal(true)
	}

	function mapMetodo(m: string) {
		switch (m) {
			case 'EFECTIVO': return 'EFECTIVO'
			case 'Debito': return 'TARJETA_DEBITO'
			case 'Transferencia Bancaria': return 'TRANSFERENCIA'
			case 'QR': return 'EFECTIVO'
			default: return 'EFECTIVO'
		}
	}

	async function confirmPayment() {
		if (!socio) return
		setProcessing(true)
		try {
			const toPay = pending.filter(d => selectedIds[d.id])
			const receipts: string[] = []
			for (const d of toPay) {
				// detect ids for cuota/inscripcion/turno
				let cuotaId: number | undefined = undefined
				let inscripcionId: number | undefined = undefined
				let turnoId: number | undefined = undefined
				if (d.id.startsWith('cuota-')) cuotaId = parseInt(d.id.replace('cuota-', ''))
				if (d.id.startsWith('insc-')) inscripcionId = parseInt(d.id.replace('insc-', ''))
				if (d.id.startsWith('turno-')) turnoId = parseInt(d.id.replace('turno-', ''))

				const payload: any = {
					titular: `Pago - ${socio.nombre}`,
					last4: '4242', // mock
					monto: d.amount,
					tipo: d.type,
					usuarioSocioId: socio.id,
					metodoPago: mapMetodo(payMethod)
				}
				if (cuotaId) payload.cuotaId = cuotaId
				if (inscripcionId) payload.inscripcionId = inscripcionId
				if (turnoId) payload.turnoId = turnoId
				const res = await fetch('/api/payments', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				})
				const j = await res.json()
				if (!res.ok) throw new Error(j.error || 'Error procesando pago')
				receipts.push(j.token ?? j.comprobante ?? '')
			}

			// move paid debts to history
			const paidIds = new Set(pending.filter(d => selectedIds[d.id]).map(d => d.id))
			const paid = pending.filter(d => paidIds.has(d.id)).map(d => ({ ...d, status: 'PAGADO' }))
			setHistory(prev => [...paid, ...prev])
			setPending(prev => prev.filter(d => !paidIds.has(d.id)))
			setSelectedIds({})
			setLastComprobante(receipts[receipts.length-1] ?? null)
			setShowModal(false)
			setToast({ type: 'success', msg: 'Pago exitoso' })
			setTimeout(() => setToast(null), 3000)
		} catch (err: any) {
			console.error(err)
			setToast({ type: 'error', msg: 'Error al procesar el pago: ' + (err.message || err) })
			setTimeout(() => setToast(null), 6000)
		} finally {
			setProcessing(false)
		}
	}

	function downloadReceipt() {
		if (!lastComprobante) return
		const blob = new Blob([`Comprobante: ${lastComprobante}`], { type: 'text/plain' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `comprobante-${lastComprobante}.txt`
		a.click()
		URL.revokeObjectURL(url)
	}

	return (
		<div className="flex min-h-screen bg-gray-50">
			<Sidebar />
			<main className="flex-1 p-6">
				<h1 className="text-2xl font-semibold mb-4">Gestión de Pagos</h1>

				<div className="bg-white p-4 rounded-md shadow mb-6">
					<div className="grid grid-cols-3 gap-3 items-end">
						<div className="col-span-2">
							<label className="block text-sm font-medium text-gray-700">Buscar Socio (DNI)</label>
							<Input value={dni} onChange={(e) => setDni(e.target.value)} placeholder="Ingrese DNI del socio" />
						</div>
						<div>
							<Button onClick={() => handleSearch()} className="w-full">Buscar</Button>
						</div>
					</div>
				</div>

				{loading ? (
					<LoadingSpinner />
				) : socio ? (
					<div className="bg-white p-4 rounded-md shadow">
					{/* socio content */}
						<div className="flex items-center justify-between mb-4">
							<div>
								<div className="text-lg font-medium">{socio.nombre} - Socio {socio.tipoSocio}</div>
								<div className="text-sm text-gray-500">DNI: {socio.dni}</div>
							</div>
						</div>

						<div className="mb-4">
							<nav role="tablist" className="flex gap-2">
								<button
									role="tab"
									aria-selected={activeTab === 'PENDIENTES'}
									onClick={() => setActiveTab('PENDIENTES')}
									className={`px-4 py-2 rounded-md transition flex items-center gap-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 ${
										activeTab === 'PENDIENTES'
											? 'bg-blue-600 text-white shadow-md border-b-2 border-blue-800'
											: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
									}`}
								>
									Pagos pendientes
								</button>
								<button
									role="tab"
									aria-selected={activeTab === 'HISTORIAL'}
									onClick={() => setActiveTab('HISTORIAL')}
									className={`px-4 py-2 rounded-md transition flex items-center gap-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 ${
										activeTab === 'HISTORIAL'
											? 'bg-blue-600 text-white shadow-md border-b-2 border-blue-800'
											: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
									}`}
								>
									Historial de Pagos
								</button>
							</nav>
						</div>

						{activeTab === 'PENDIENTES' && (
							<div>
								<table className="w-full border-collapse">
									<thead>
										<tr className="text-left text-sm text-gray-600 border-b">
											<th className="py-2"><input type="checkbox" onChange={(e) => {
												const checked = e.target.checked
												const newSel: Record<string, boolean> = {}
												if (checked) pending.forEach(d => newSel[d.id]=true)
												setSelectedIds(newSel)
											}} /></th>
											<th className="py-2">Concepto</th>
											<th className="py-2">Monto</th>
											<th className="py-2">Fecha de Vencimiento</th>
											<th className="py-2">Estado</th>
										</tr>
									</thead>
									<tbody>
										{pending.map(d => (
											<tr key={d.id} className="border-b">
												<td className="py-2"><input type="checkbox" checked={!!selectedIds[d.id]} onChange={() => toggleSelect(d.id)} /></td>
												<td className="py-2">{d.concept}</td>
												<td className="py-2">${d.amount.toLocaleString()}</td>
												<td className="py-2">{d.dueDate}</td>
												<td className="py-2">{d.status}</td>
											</tr>
										))}
										{pending.length===0 && (
											<tr><td colSpan={5} className="py-4 text-center text-gray-500">No hay pagos pendientes</td></tr>
										)}
									</tbody>
								</table>

								<div className="flex items-center justify-between mt-4">
									<div>
										<span className="font-medium">Total a Pagar: </span>
										<span className="text-lg">${total.toLocaleString()}</span>
									</div>
									<div>
										<Button onClick={openRegister} disabled={total<=0}>Registrar Pago</Button>
									</div>
								</div>
							</div>
						)}

						{activeTab === 'HISTORIAL' && (
							<div>
								<table className="w-full border-collapse">
									<thead>
										<tr className="text-left text-sm text-gray-600 border-b">
											<th className="py-2">Concepto</th>
											<th className="py-2">Monto</th>
											<th className="py-2">Fecha de Pago</th>
										</tr>
									</thead>
									<tbody>
										{history.map((h, idx) => (
											<tr key={idx} className="border-b">
												<td className="py-2">{h.concept}</td>
												<td className="py-2">${h.amount?.toLocaleString?.() ?? h.amount}</td>
												<td className="py-2">{new Date().toLocaleDateString()}</td>
											</tr>
										))}
										{history.length===0 && (
											<tr><td colSpan={3} className="py-4 text-center text-gray-500">No hay pagos en el historial</td></tr>
										)}
									</tbody>
								</table>
							</div>
						)}
					</div>
				) : null}

				{/* Modal */}
				{showModal && (
					<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
						<div className="bg-white rounded p-6 w-96">
							<h3 className="text-lg font-medium mb-2">Confirmar Pago</h3>
							<div className="mb-2">Monto: <strong>${total.toLocaleString()}</strong></div>
							<div className="mb-2">
								<label className="block text-sm">Método de Pago</label>
								<select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="w-full border px-2 py-1 rounded">
									<option>EFECTIVO</option>
									<option>Debito</option>
									<option>Transferencia Bancaria</option>
									<option>QR</option>
								</select>
							</div>
							<div className="mb-4">
								<label className="block text-sm">Notas (opcional)</label>
								<textarea className="w-full border rounded p-2" value={notes} onChange={(e) => setNotes(e.target.value)} />
							</div>
							<div className="flex justify-end gap-2">
								<Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
								<Button onClick={confirmPayment} disabled={processing}>{processing ? 'Procesando...' : 'Confirmar'}</Button>
							</div>
						</div>
					</div>
				)}

				{/* Processing overlay */}
				{processing && (
					<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-60">
						<div className="bg-white rounded p-6 w-80 flex flex-col items-center">
							<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
							<div className="text-sm font-medium">Procesando pago...</div>
						</div>
					</div>
				)}

				{lastComprobante && (
					<div className="fixed bottom-6 right-6">
						<div className="bg-white p-4 rounded shadow flex gap-2 items-center">
							<div>Pago exitoso</div>
							<Button variant="secondary" onClick={downloadReceipt}>Descargar Comprobante</Button>
						</div>
					</div>
				)}

				

			</main>
		</div>
	)
}

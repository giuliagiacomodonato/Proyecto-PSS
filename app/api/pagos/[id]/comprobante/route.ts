import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

// Single GET implementation — generates and returns a PDF comprobante
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const pagoId = Number(id)
    if (Number.isNaN(pagoId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    const pago = await prisma.pago.findUnique({ where: { id: pagoId }, include: { usuarioSocio: true, cuota: true } })
    if (!pago) return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })

    const usuarioHeader = request.headers.get('x-usuario-id')
    if (usuarioHeader) {
      if (String(pago.usuarioSocioId || pago.usuarioSocio?.id) !== usuarioHeader) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842])
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    let y = 800
    const left = 48

    page.drawText('Club Deportivo PSS', { x: left, y, size: 18, font: fontBold, color: rgb(0, 0, 0) })
    y -= 28

    page.drawText(`Comprobante de Pago N°: ${String(pago.id).padStart(8, '0')}`, { x: left, y, size: 12, font, color: rgb(0, 0, 0) })
    y -= 20

    page.drawText(`Nombre Socio: ${pago.usuarioSocio?.nombre || ''}`, { x: left, y, size: 12, font, color: rgb(0, 0, 0) })
    y -= 16
    page.drawText(`N° Socio: ${pago.usuarioSocio?.id || ''}`, { x: left, y, size: 12, font, color: rgb(0, 0, 0) })
    y -= 16

    if (pago.usuarioSocio?.dni) {
      page.drawText(`DNI: ${pago.usuarioSocio.dni}`, { x: left, y, size: 12, font, color: rgb(0, 0, 0) })
      y -= 16
    }

    const concepto = pago.cuota ? `Cuota Socio - ${pago.cuota.mes}/${pago.cuota.anio}` : pago.tipoPago || ''
    page.drawText(`Concepto: ${concepto}`, { x: left, y, size: 12, font, color: rgb(0, 0, 0) })
    y -= 16

    page.drawText(`Monto: $${(pago.monto || 0).toFixed(2)}`, { x: left, y, size: 12, font, color: rgb(0, 0, 0) })
    y -= 16

    if (pago.fechaPago) {
      const fecha = new Date(pago.fechaPago).toLocaleDateString('es-ES')
      page.drawText(`Fecha de Pago: ${fecha}`, { x: left, y, size: 12, font, color: rgb(0, 0, 0) })
      y -= 16
    }

    const pdfBytes = await pdfDoc.save()
    const buf = Buffer.from(pdfBytes)

    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="comprobante_pago_${pago.id}.pdf"`,
      },
    })
  } catch (err) {
    console.error('Error generando comprobante', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

'use client'

import Breadcrumb from '../../components/Breadcrumb'

export default function AsistenciaPage() {
  return (
    <>
      <div className="mb-8">
        <Breadcrumb items={[
          { label: 'Panel Principal', href: '/socio' },
          { label: 'Asistencia', active: true }
        ]} />
        <h1 className="text-3xl font-bold text-gray-900">Asistencia</h1>
        <p className="text-sm text-gray-500 mt-2">Consulte su registro de asistencia a las prácticas</p>
      </div>
      
      <div className="flex flex-col items-center justify-center min-h-96 text-center">
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-8 max-w-md">
          <p className="text-xl text-gray-700 font-semibold">🚧 Página en construcción</p>
          <p className="text-gray-600 mt-4">Esta sección está siendo desarrollada. Pronto estará disponible.</p>
        </div>
      </div>
    </>
  )
}

import React from 'react'
import ResponsiveTable from '@/components/ResponsiveTable'

const mockData = [
    { seccion: "PROGRAMACIÓN DE ALGORITMOS PGY1121-008D", sala: "TP1", totalAlumnos: 30, promedioEngagement: 85.5 },
    { seccion: "PROGRAMACIÓN DE ALGORITMOS PGY1121-008D", sala: "TP1", totalAlumnos: 25, promedioEngagement: 90.1 },
    { seccion: "PROGRAMACIÓN DE ALGORITMOS PGY1121-008D", sala: "LC12", totalAlumnos: 28, promedioEngagement: 88.3 },
];

const page: React.FC = () => {
    return (
        <div className="p-4">
            <h1 className="text-2xl font-semibold mb-4 text-black">Tabla de Secciones</h1>
            <ResponsiveTable data={mockData} />
        </div>
    )
}

export default page
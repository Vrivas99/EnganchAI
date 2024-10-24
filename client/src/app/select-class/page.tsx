'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SelectClass() {
    const router = useRouter();
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedSection, setSelectedSection] = useState<string>('');
    const [data, setData] = useState<Asignacion[]>([]);
    const [availableRooms, setAvailableRooms] = useState<Asignacion[]>([]);

    // Definición de interfaz
    interface Asignacion {
        IDASIGNACION: number;
        ID_SECCION: number;
        SECCION: string;
        ID_SALA: number;
        SALA: string;
    }

    const fetchUserAssignment = async () => {
        try {
            const response = await fetch('http://localhost:5000/db/getUserAsignation', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error('Error al obtener los datos de la API');
            }
            const result = await response.json();
            if (result?.data) {
                setData(result.data);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error('Error fetching user assignment:', error);
        }
    };
    // Obtener las asignaciones del usuario al cargar la página
    useEffect(() => {
        fetchUserAssignment();
    }, []);
    // Filtrar las salas disponibles según la sección seleccionada
    useEffect(() => {
        if (selectedSection) {
            const filteredRooms = data.filter(item => item.ID_SECCION === parseInt(selectedSection));
            setAvailableRooms(filteredRooms);
        }
    }, [selectedSection, data]);

    const handleClassSelection = () => {
        router.push('/video');
    };

    return (
        <div className="flex justify-center items-center h-full">
            <div className="bg-white p-8 text-center w-2/4 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-4">Seleccionar Clase</h1>

                <div className="mb-4">
                    <select
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                    >
                        <option value="" disabled>
                            Seleccione una Sección
                        </option>
                        {data.length > 0 ? (
                            data.map((asignacion) => (
                                <option key={asignacion.ID_SECCION} value={asignacion.ID_SECCION}>
                                    {asignacion.SECCION}
                                </option>
                            ))
                        ) : (
                            <option disabled>No hay secciones disponibles</option>
                        )}
                    </select>
                </div>

                <div className="mb-4">
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                        disabled={!selectedSection}
                    >
                        <option value="" disabled>
                            Seleccione una Sala
                        </option>
                        {availableRooms.length > 0 ? (
                            availableRooms.map((room) => (
                                <option key={room.ID_SALA} value={room.ID_SALA}>
                                    {room.SALA}
                                </option>
                            ))
                        ) : (
                            <option disabled>No hay salas disponibles</option>
                        )}
                    </select>
                </div>

                <button
                    onClick={handleClassSelection}
                    className={`w-full text-white py-2 rounded ${
                        selectedSection && selectedClass
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!selectedSection || !selectedClass} 
                >
                    Confirmar
                </button>
            </div>
        </div>
    );
}

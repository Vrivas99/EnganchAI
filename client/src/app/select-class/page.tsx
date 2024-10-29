'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClass } from '@/context/ClassContext';

export default function SelectClass() {
    const router = useRouter();
    const {
        selectedClass,
        setSelectedClass,
        selectedSection,
        setSelectedSection,
        availableSections,
        availableRooms,
        fetchUserAssignment,
        fetchCameraLink,
    } = useClass();

    useEffect(() => {
        fetchUserAssignment();
    }, []);

    const handleClassSelection = async () => {
        await fetchCameraLink();
        router.push('/video');
    };

    return (
        <div className="flex justify-center items-center h-full">
            <div className="bg-white p-8 text-center ms:w-1/3 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-4">Seleccionar Clase</h1>

                <div className="mb-4">
                    <select
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                    >
                        <option value="" disabled>Seleccione una Sección</option>
                        {availableSections.map((section) => (
                            <option key={section.ID_SECCION} value={section.ID_SECCION}>
                                {section.SECCION}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-4">
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                        disabled={!selectedSection}
                    >
                        <option value="" disabled>Seleccione una Sala</option>
                        {availableRooms.map((room) => (
                            <option key={room.ID_SALA} value={room.ID_SALA}>
                                {room.SALA}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={handleClassSelection}
                    className={`w-full text-white py-2 rounded ${selectedSection && selectedClass
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

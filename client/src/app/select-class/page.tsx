'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SelectClass() {
    const router = useRouter();
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');

    const handleClassSelection = () => {
        router.push('/video');
    };

    return (
        <div className="flex justify-center items-center h-screen">
            <div className="bg-white p-8 text-center w-1/4 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-4">Seleccionar Clase</h1>
                <div className="mb-4">
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                    >
                        <option value="">Seleccione una clase</option>
                        <option value="class1">Clase 1</option>
                        <option value="class2">Clase 2</option>
                    </select>
                </div>
                <div className="mb-4">
                    <select
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                    >
                        <option value="">Seleccione una sección</option>
                        <option value="sectionA">Sección A</option>
                        <option value="sectionB">Sección B</option>
                    </select>
                </div>
                <button
                    onClick={handleClassSelection}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                    Confirmar
                </button>
            </div>
        </div>
    );
}

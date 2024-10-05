// Aside.tsx
'use client';
import { FaPlus } from "react-icons/fa";
import { IoWarningOutline } from "react-icons/io5";
import { useMetrics } from "@/context/MetricsContext"; // Importa el hook useMetrics

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

const Aside = () => {
    const { metrics } = useMetrics(); // Obtener las métricas desde el contexto

    return (
        <Sheet>
            <SheetTrigger>
                <span
                    className='absolute z-10 text-2xl right-5 bottom-5 bg-white rounded-full p-3 text-gray-900'
                    aria-label='Abrir Metricas'
                    title='Abrir Metricas'
                >
                    <FaPlus />
                </span>
            </SheetTrigger>
            <SheetContent className="max-h-screen overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>
                        <span className="text-gray-900 py-2 font-bold">
                            Métricas
                        </span>
                    </SheetTitle>
                    <SheetDescription>
                        <span className="text-gray-700">Estas metricas muestra que tan confiable es la detencción del engagment sobre los estudiantes</span>
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-4">
                    {/* Subtítulos */}
                    <div className="flex items-center text-gray-700 font-bold mb-2">
                        <span className="w-1/4">ID</span>
                        <span className="w-1/4 text-center">Confianza</span>
                    </div>
                    {/* Lista de estudiantes con las barras de confianza */}
                    <ul className="space-y-4">
                        {metrics?.Ids && Object.keys(metrics.Ids).map((id) => (
                            <li key={id} className="flex justify-between items-center">
                                {/* ID del estudiante */}
                                <span className="text-gray-700 w-1/4">{id}</span>
                                {/* Barra de confianza */}
                                <div className="relative w-3/4 mx-4">
                                    <div className="w-full h-3 bg-gray-300 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500"
                                            style={{ width: `${metrics.Ids[id].confidence}%` }}
                                        />
                                    </div>
                                </div>
                                {/* Porcentaje de confianza */}
                                <span>{metrics.Ids[id].confidence}%</span>
                                {/* Mostrar advertencia si el confidence es bajo */}
                                <div className="w-1/6 text-center">
                                    {metrics.Ids[id].confidence < 50 && (
                                        <IoWarningOutline className="text-yellow-500 text-xl" title="Advertencia" />
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default Aside;

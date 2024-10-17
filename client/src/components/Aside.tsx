'use client';
import { FaPlus } from "react-icons/fa";
import { IoWarningOutline } from "react-icons/io5";
import { useMetrics } from "@/context/MetricsContext";
import { useRecording } from "@/context/RecordingContext";

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

const Aside = () => {
    const { metrics, isSessionEnded, sessionReport } = useMetrics(); 
    const { sessionTime } = useRecording();
    const date = new Date();
    const currentDate = date.toLocaleDateString();

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      };

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
                            {isSessionEnded ? 'Informe de ultima sesión' : 'Métricas en vivo'}
                        </span>
                    </SheetTitle>
                    <SheetDescription>
                        <span className="text-gray-700">
                            {isSessionEnded
                                ? 'Este es el resumen de la sesión de captura.'
                                : 'Estas metricas muestra que tan confiable es la detencción del engagment sobre los estudiantes'}
                        </span>
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-4">
                    {/* se muestra el informe si termina la captura */}
                    {isSessionEnded && sessionReport ? (
                        <div className="flex justify-center flex-col w-full items-center gap-7">
                            {/* informe */}
                            <p className=" font-semibold">{currentDate}</p>
                            <p>Total de estudiantes: {sessionReport?.totalPeople || 0}</p>
                            <p>Tiempo de sesión: {formatTime(sessionTime)}</p>
                        </div>
                    ) : (
                        // metricas en tiempo real
                        <ul className="space-y-4">
                            {metrics?.Ids && Object.keys(metrics.Ids).map((id) => (
                                <li key={id} className="flex justify-between items-center">
                                    <span className="text-gray-700 w-1/4">{id}</span>
                                    <div className="relative w-3/4 mx-4">
                                        <div className="w-full h-3 bg-gray-300 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500"
                                                style={{ width: `${metrics.Ids[id].confidence}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span>{metrics.Ids[id].confidence}%</span>
                                    <div className="w-1/6 text-center">
                                        {metrics.Ids[id].confidence < 50 && (
                                            <IoWarningOutline className="text-yellow-500 text-xl" title="Advertencia" />
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default Aside;


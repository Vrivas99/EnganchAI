'use client';
import { FaPlus } from "react-icons/fa";
import { IoWarningOutline } from "react-icons/io5";
import { useMetrics } from "@/context/MetricsContext";
import { useRecording } from "@/context/RecordingContext";

import LineGraph from "./Line";

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

const Aside = () => {
    const { metrics, isSessionEnded, sessionReport, engagedHistory } = useMetrics();
    const { sessionTime, isRecording } = useRecording();
    const date = new Date();
    const currentDate = date.toLocaleDateString();
    const totalPeople = sessionReport?.totalPeople ?? 1;

    const formatTime = (time: number) => {
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    //obtener el promedio total de la sesion
    const promedioTotal = engagedHistory.map((entry) => {
        // Calcula el promedio de engagement
        const engagedPercentage = (entry.engagedCount / totalPeople) * 100;
        // Limita el valor entre 0 y 100
        return Math.min(Math.max(engagedPercentage, 0), 100);
    }
    );

    const promedio = promedioTotal.reduce((a, b) => a + b, 0) / promedioTotal.length;

    //quitar digitos decimales
    const promedioFinal = promedio.toFixed(2);




    return (
        <Sheet>
            <SheetTrigger>
                <span
                    className='absolute z-10 text-2xl right-5 bottom-5 bg-white rounded-full p-3 text-gray-900 hover:bg-slate-900 hover:text-white'
                    aria-label='Abrir Metricas'
                    title='Abrir Metricas'
                >
                    <FaPlus />
                </span>
            </SheetTrigger>
            <SheetContent className="max-h-screen overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>
                        <span className="text-gray-900 py-2 font-bold flex w-full justify-center">
                            {!isRecording && isSessionEnded ? <div className="flex flex-col items-center"><h1>Informe de ultima sesión</h1><p>{currentDate}</p></div> : 'Métricas en vivo'}
                        </span>
                    </SheetTitle>
                    <SheetDescription>
                        <span className="text-gray-700 flex w-full justify-center">
                            {!isRecording && isSessionEnded
                                ? 'Este es el resumen de la sesión de captura.'
                                : 'Estas metricas muestra que tan confiable es la detencción del engagment sobre los estudiantes'}
                        </span>
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-4">
                    {/* se muestra el informe si termina la captura */}
                    {!isRecording && isSessionEnded && sessionReport ? (
                        <div className="flex justify-center flex-col w-full items-center gap-12">
                            {/* informe */}
                            <p>Total de estudiantes: {Math.max(sessionReport?.totalPeople) || 0}</p>
                            <p>Tiempo de sesión: {formatTime(sessionTime)}</p>
                            <div className="w-full flex flex-col justify-center items-center">
                                <p>Promedio de Engagment</p>
                                <div className=" w-full bg-gray-200 rounded-full h-5 dark:bg-gray-700">
                                    <div className=" bg-blue-400 flex text-center h-5 rounded-full dark:bg-blue-500 items-center" style={{ width: `${promedioFinal}%` }}>
                                        <span className="font-bold text-gray-1 w-full">{promedioFinal}%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-2 font-bold">
                                <p>Historial de Engagment</p>
                                <LineGraph />
                            </div>
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


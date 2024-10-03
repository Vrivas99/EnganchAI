'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRecording } from '@/context/RecordingContext'; // Importa el hook desde el contexto
import { useMetrics } from '@/context/MetricsContext';
import { usePathname } from 'next/navigation'; // Hook para obtener la ruta actual
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner"

const Navbar = () => {
    const { isRecording, handleRecording } = useRecording(); // Usa el estado global
    const [timer, setTimer] = useState(0);
    const [toastShown, setToastShown] = useState(false);
    const pathname = usePathname(); // Obtener la ruta actual
    const { metrics } = useMetrics();


    useEffect(() => {
        if (metrics && metrics.stateCounts.Frustrated > 10 && !toastShown) {
            toast.warning('¡Hay 10 o más estudiantes frustrados!');
            setToastShown(true);

            setTimeout(() => setToastShown(false), 3000);
        }
    }, [metrics, toastShown]);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isRecording) {
            interval = setInterval(() => {
                setTimer((prevTime) => prevTime + 1);
            }, 1000);
        } else {
            clearInterval(interval!);
        }

        return () => clearInterval(interval!);
    }, [isRecording]);

    const startRecording = () => {
        if (!isRecording) {
            setTimer(0); // Reinicia el temporizador solo si se inicia una nueva grabación
        }
        handleRecording(); // Cambia el estado de grabación
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleLogout = () => {
        if (isRecording) {
            handleRecording(); // Detiene la grabación si está activa
        }
    };

    return (
        <nav className="w-full bg-gray-300 text-white p-4 z-10 flex justify-between items-center">
            <div className="flex space-x-4 md:text-sm xl:text-base">
                <div className="bg-white text-black shadow-md p-2 rounded sm:w-20 md:w-32">
                    <span className="block">Frustrated: {metrics ? metrics.stateCounts.Frustrated : 0}</span>
                    <div className="w-full h-1 bg-red-500 mt-1"></div>
                </div>
                <div className="bg-white text-black shadow-md p-2 rounded w-32">
                    <span className="block">Confused: {metrics ? metrics.stateCounts.Confused : 0}</span>
                    <div className="w-full h-1 bg-orange-500 mt-1"></div>
                </div>
                <div className="bg-white text-black shadow-md p-2 rounded w-32">
                    <span className="block">Bored: {metrics ? metrics.stateCounts.Bored : 0}</span>
                    <div className="w-full h-1 bg-blue-500 mt-1"></div>
                </div>
                <div className="bg-white text-black shadow-md p-2 rounded w-32">
                    <span className="block">Engaged: {metrics ? metrics.stateCounts.Engaged : 0}</span>
                    <div className="w-full h-1 bg-green-500 mt-1"></div>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <div className="flex flex-col md:text-sm xl:text-base font-semibold text-black">
                    <span className="flex justify-end">Tiempo transcurrido:</span>
                    <span className="flex justify-end">{formatTime(timer)}</span>
                </div>
                <button
                    onClick={startRecording}
                    disabled={pathname !== '/video'}
                    className={`md:text-sm xl:text-base px-4 py-2 rounded ${isRecording ? 'bg-red-500 hover:bg-red-700' : 'bg-green-500 hover:bg-green-700'} ${pathname !== '/video' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isRecording ? 'Finalizar Captura' : 'Iniciar Captura'}
                </button>

                {pathname === '/login' || '/' ? null : (
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <Avatar>
                                <AvatarImage src="https://picsum.photos/200/300" />
                                <AvatarFallback className="bg-black">PR</AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <Link href="/" onClick={handleLogout} className="text-neutral-900">
                                    Cerrar Sesión
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </nav>
    );
};

export default Navbar;

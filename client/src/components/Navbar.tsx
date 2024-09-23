'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRecording } from '@/context/RecordingContext'; // Importa el hook desde el contexto
import { usePathname } from 'next/navigation'; // Hook para obtener la ruta actual
// Componentes shadcn
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
    const { isRecording, handleRecording } = useRecording(); // Usa el estado global
    const [timer, setTimer] = useState(0);
    const pathname = usePathname(); // Obtener la ruta actual

    const [engagementCounts] = useState({
        frustrated: 0,
        confused: 0,
        bored: 0,
        engaged: 0,
    });

    // Efecto para manejar el temporizador
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

    // Reinicia el temporizador al comenzar una nueva captura
    const startRecording = () => {
        if (!isRecording) {
            setTimer(0); // Reinicia el temporizador solo si se inicia una nueva grabación
        }
        handleRecording(); // Cambia el estado de grabación
    };

    // Formato del tiempo
    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Lógica de cierre de sesión
    const handleLogout = () => {
        if (isRecording) {
            handleRecording(); // Detiene la grabación si está activa
        }
        // Aquí podrías añadir más lógica, como limpiar sesiones o redirigir a la página de login
    };

    return (
        <nav className="w-full bg-gray-300 text-white p-4 z-10 flex justify-between items-center">
            {/* Sección izquierda con contadores de engagement */}
            <div className="flex space-x-4 md:text-sm xl:text-base">
                <div className="bg-white text-black shadow-md p-2 rounded sm:w-20 md:w-32">
                    <span className="block">Frustrated: {engagementCounts.frustrated}</span>
                    <div className="w-full h-1 bg-red-500 mt-1"></div>
                </div>
                <div className="bg-white text-black shadow-md p-2 rounded w-32">
                    <span className="block">Confused: {engagementCounts.confused}</span>
                    <div className="w-full h-1 bg-orange-500 mt-1"></div>
                </div>
                <div className="bg-white text-black shadow-md p-2 rounded w-32">
                    <span className="block">Bored: {engagementCounts.bored}</span>
                    <div className="w-full h-1 bg-blue-500 mt-1"></div>
                </div>
                <div className="bg-white text-black shadow-md p-2 rounded w-32">
                    <span className="block">Engaged: {engagementCounts.engaged}</span>
                    <div className="w-full h-1 bg-green-500 mt-1"></div>
                </div>
            </div>

            {/* Sección derecha con botón de captura y temporizador */}
            <div className="flex items-center space-x-2">
                <div className="flex flex-col md:text-sm xl:text-base font-semibold text-black">
                    <span className="flex justify-end">Tiempo transcurrido:</span>
                    <span className="flex justify-end">{formatTime(timer)}</span>
                </div>
                <button
                    onClick={startRecording}
                    disabled={pathname !== '/video'} // Desactiva el botón si no estás en la página de video
                    className={`md:text-sm xl:text-base px-4 py-2 rounded ${isRecording ? 'bg-red-500 hover:bg-red-700' : 'bg-green-500 hover:bg-green-700'} ${pathname !== '/video' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isRecording ? 'Finalizar Captura' : 'Iniciar Captura'}
                </button>

                {/* Ocultar avatar en login */}
                {pathname === '/login' ? null : (
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

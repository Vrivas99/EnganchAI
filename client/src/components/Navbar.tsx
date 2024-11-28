'use client';
// Imports de Next.js
import Link from 'next/link';
import React from 'react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// Imports de context
import { useRecording } from '@/context/RecordingContext';
import { useMetrics } from '@/context/MetricsContext';
import { useUser } from '@/context/UserContext';
import { useClass } from '@/context/ClassContext';

// Imports de componentes
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const Navbar = () => {

    // Constantes de contexto
    const { isRecording, handleRecording, setSessionTime } = useRecording(); // Usa el estado global
    const { user, logout } = useUser();
    const { metrics, engagedHistory, sessionReport } = useMetrics();
    const { getAssignmentId } = useClass();

    // Estados locales
    const [timer, setTimer] = useState(0);
    const [toastShown, setToastShown] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        // Mapea los mensajes de alerta para cada estado relevante
        const alertMessages: Record<'Frustrated' | 'Confused' | 'Bored', string> = {
            Frustrated: '¡Hay 5 o más estudiantes frustrados!',
            Confused: '¡Hay 5 o más estudiantes confundidos!',
            Bored: '¡Hay 5 o más estudiantes aburridos!',
        };
    
        // Itera sobre los estados relevantes
        (Object.entries(alertMessages) as [keyof typeof alertMessages, string][]).forEach(([state, message]) => {
            const count = metrics?.stateCounts?.[state] || 0;
            if (count > 5 && !toastShown && isRecording) {
                toast.warning(message);
                setToastShown(true);
                setTimeout(() => setToastShown(false), 10000);
            }
        });
    }, [metrics, toastShown]);
    
    

    // Temporizador para la grabación
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

    //Realiza un POST hacia el server de express para cambiar el estado del stream
    const setVideoStream = async () => {
        try {
            //Calcular promedio de engagement (Solo se enviara a la BD cuando inicie la sesion)
            const totalPeople = sessionReport?.totalPeople ?? 1;
            const promedioTotal = engagedHistory.map((entry) => {
                // Calcula el promedio de engagement
                const engagedPercentage = (entry.engagedCount / totalPeople) * 100;
                // Limita el valor entre 0 y 100
                return Math.min(Math.max(engagedPercentage, 0), 100);
            });
            const promedio = promedioTotal.reduce((a, b) => a + b, 0) / promedioTotal.length;
            //quitar digitos decimales
            const promedioFinal = promedio.toFixed(2);

            console.log("ID SE ASIGNACION: ", getAssignmentId())

            const response = await fetch('http://localhost:5000/api/setVideoStream', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    newState: !isRecording,//Como el estado tarda en cambiar, se envia el contrario
                    history: engagedHistory,
                    avg: promedioFinal,//Promedio de engagement (Calculado ahora)
                    asignation: getAssignmentId()//Id asignacion (usuario+seccion+sala)
                }),
            });

            if (!response.ok) {
                throw new Error('Error al enviar el estado');
            }
            console.log('Estado de s enviado correctamente');
        } catch (error) {
            console.error('Error al enviar el estado (Catch): ', error);
        }
    };
    // Inicia o finaliza la grabación
    const startRecording = async () => {
        setVideoStream();//Establece video en flask
        if (!isRecording) {
            setTimer(0); // Reinicia el temporizador solo si se inicia una nueva grabación
        } else {
            setSessionTime(timer);

        }

        handleRecording(); // Cambia el estado de grabación

    };
    // Formatea el tiempo en minutos y segundos
    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <nav className="w-full bg-gray-300 text-white p-4 z-10 flex justify-between items-center shadow-xl">
            <div className="flex space-x-4 md:text-sm xl:text-base">
                <div className="bg-white text-black shadow-md p-2 rounded sm:w-20 md:w-32">
                    <span className="block">Frustrated: {metrics?.stateCounts?.Frustrated || 0}</span>
                    <div className="w-full h-1 bg-red-500 mt-1"></div>
                </div>
                <div className="bg-white text-black shadow-md p-2 rounded w-32">
                    <span className="block">Confused: {metrics?.stateCounts?.Confused || 0}</span>
                    <div className="w-full h-1 bg-orange-500 mt-1"></div>
                </div>
                <div className="bg-white text-black shadow-md p-2 rounded w-32">
                    <span className="block">Bored: {metrics?.stateCounts?.Bored || 0}</span>
                    <div className="w-full h-1 bg-purple-500 mt-1"></div>
                </div>
                <div className="bg-white text-black shadow-md p-2 rounded w-32">
                    <span className="block">Engaged: {metrics?.stateCounts?.Engaged || 0}</span>
                    <div className="w-full h-1 bg-blue-500 mt-1"></div>
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

                {(pathname !== '/login' && pathname !== '/') && (
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <Avatar>
                                {user?.avatar ? (
                                    <AvatarImage src={user.avatar} />
                                ) : (
                                    <AvatarFallback className="bg-black">
                                        {user?.name ? user.name[0] : 'U'}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>
                                {user?.name || 'User Undefined'}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <Link href="/video" className="text-neutral-900">
                                    Ir a stream
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Link href="/history-classes" className="text-neutral-900">
                                    Historial de Sesiones
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Link href="/" onClick={logout} className="text-red-600">
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

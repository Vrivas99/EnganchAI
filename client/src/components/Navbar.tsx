'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

const Navbar = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [timer, setTimer] = useState(0);

    const [engagementCounts, setEngagementCounts] = useState({
        frustrated: 0,
        confused: 0,
        bored: 0,
        engaged: 0,
    });

    const handleRecording = () => {
        setIsRecording(!isRecording);
        if (!isRecording) {
            setTimer(0); // Reinicia el temporizador cuando se inicia la captura
        }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isRecording) {
            interval = setInterval(() => {
                setTimer((prevTime) => prevTime + 1);
            }, 1000);
        } else if (!isRecording && timer !== 0) {
            clearInterval(interval!);
        }
        return () => clearInterval(interval!);
    }, [isRecording, timer]);

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <nav className="fixed top-0 left-0 w-full bg-gray-300 text-white p-4 z-10 flex justify-between items-center">
            {/* Sección izquierda con contadores de engagement */}
            <div className="flex space-x-4">
                <div className="bg-white text-black shadow-md p-2 rounded">
                    <span className="block">Frustrated: {engagementCounts.frustrated}</span>
                    <div className="w-full h-1 bg-red-500 mt-1"></div>
                </div>
                <div className="bg-white text-black shadow-md p-2 rounded">
                    <span className="block">Confused: {engagementCounts.confused}</span>
                    <div className="w-full h-1 bg-orange-500 mt-1"></div>
                </div>
                <div className="bg-white text-black shadow-md p-2 rounded">
                    <span className="block">Bored: {engagementCounts.bored}</span>
                    <div className="w-full h-1 bg-blue-500 mt-1"></div>
                </div>
                <div className="bg-white text-black shadow-md p-2 rounded">
                    <span className="block">Engaged: {engagementCounts.engaged}</span>
                    <div className="w-full h-1 bg-green-500 mt-1"></div>
                </div>
            </div>

            {/* Sección derecha con botón de captura y temporizador */}
            <div className="flex items-center space-x-4">
                <span className="text-lg font-semibold text-black">Tiempo transcurrido: {formatTime(timer)}</span>
                <button
                    onClick={handleRecording}
                    className={`px-4 py-2 rounded ${isRecording ? 'bg-red-500 hover:bg-red-700' : 'bg-green-500 hover:bg-green-700'}`}
                >
                    {isRecording ? 'Finalizar Captura' : 'Iniciar Captura'}
                </button>
            </div>
        </nav>
    );
};

export default Navbar;

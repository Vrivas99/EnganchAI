'use client';

import { useEffect, useRef, useState } from 'react';
import { useRecording } from '@/context/RecordingContext';
import { FiCameraOff } from "react-icons/fi";
import { toast } from 'react-toastify';
import { useClass } from '@/context/ClassContext';

const VideoCapture: React.FC = () => {
    const { isRecording } = useRecording();
    const videoRef = useRef<HTMLImageElement | null>(null);
    const [streamError, setStreamError] = useState(false); // Para gestionar el error de conexión al stream
    const { cameraLink } = useClass();

    useEffect(() => {
        console.log("Camera link:", cameraLink);
        if (isRecording && videoRef.current) {
            setStreamError(false);
            videoRef.current.src = `${process.env.NEXT_PUBLIC_EXPRESS_SERVER_URL}/api/flaskStream`;
            videoRef.current.onerror = () => setStreamError(true);
        } else if (videoRef.current) {
            videoRef.current.src = '';
            setStreamError(false);
        }

        return () => {
            if (videoRef.current) videoRef.current.onerror = null;
        };
    }, [isRecording, cameraLink]);

    useEffect(() => {
        if (isRecording && streamError) {
            // Solo muestra el toast si está grabando y hay un error en la conexión
            toast.error('Error: No se pudo conectar con el stream de video.');
        }
    }, [isRecording, streamError]);

    return (
        <>
            {!isRecording && (
                <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center bg-gray-800 bg-opacity-80">
                    <FiCameraOff size={64} className="text-white" />
                    <p className="text-white mt-4">No hay video en este momento</p>
                </div>
            )}
            {/* Contenedor de video */}
            <div className="flex h-full w-full">
                <img ref={videoRef} className="bg-gray-700 w-full h-auto" />
            </div>
        </>
    );
};

export default VideoCapture;

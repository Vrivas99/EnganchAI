'use client';

import VideoCapture from '@/components/VideoCapture';

export default function Video() {

    return (
        <div className="flex justify-center items-center h-screen">
            {/*Mensaje de prueba de conexion con el backend*/}
            <div className="bg-white p-8 rounded-lg shadow-lg">
                <h1>Grabacion de camara publica en "img"</h1>
                <VideoCapture />
            </div>
        </div>
    );
}

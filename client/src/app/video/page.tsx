'use client';

import VideoCapture from '@/components/VideoCapture';
import { useEffect, useState } from 'react';

export default function Video() {
    //Prueba de conexion con el backend
    const [message, setMessage] = useState('')
    useEffect(() => {
        fetch('http://localhost:5000')//5000 es el puerto del backend
            .then(response => response.text())
            .then(data => setMessage(data))
            .catch(error => console.error('Error:', error));
    }, []);

    return (
        <div className="flex justify-center items-center h-screen">
            {/*Mensaje de prueba de conexion con el backend*/}
            <div>
                <h1>Mensaje desde el backend:</h1>
                <p>{message}</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
                <h1>aqui va la grabación, tengo que ajustarlo a la pantalla</h1>
                <VideoCapture />
            </div>
        </div>
    );
}

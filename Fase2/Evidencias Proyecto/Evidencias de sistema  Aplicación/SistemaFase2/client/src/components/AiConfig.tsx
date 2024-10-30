'use client';

import React, { useState } from 'react';
import { IoSettingsSharp } from "react-icons/io5";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface AiConfigProps { }

const AiConfig: React.FC<AiConfigProps> = () => {
    const [user, setUser] = useState('');
    const [password, setPassword] = useState('');
    const [isConfigVisible, setIsConfigVisible] = useState(false); // Controla visibilidad del diálogo de configuración
    const [sensitivity, setSensitivity] = useState(50); // Estado para el input range

    //Actualizar la barra de confianza
    const getConfidence = async () =>{
        try {
            console.log("Get Confidence")
            const response = await fetch('http://localhost:5000/db/getUserConfidence', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            if (!response.ok) {
                throw new Error('Error fetching confidence');
            }
            const data = await response.json();
            console.log('Fetched data:', data["data"][0]["SENSIBILIDAD"]); // Verifica los datos recibidos
            setSensitivity(data["data"][0]["SENSIBILIDAD"]);//Los datos desde 
        } catch (error) {
            console.error('Error fetching confidence:', error);
        }
    }

    //Actualizar la confianza en flask
    const setConfidence = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/setConfidence', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ setConfidence: sensitivity }),
            });

            if (!response.ok) {
                throw new Error('Error al enviar la confianza');
            }
            console.log('Estado de confianza enviado correctamente');
        } catch (error) {
            console.error('Error al enviar la confianza (Catch): ', error);
        }
    };

    // Función para manejar el inicio de sesión
    const handleConfig = (e: React.FormEvent) => {
        e.preventDefault();

        if (!user || !password) {
            toast.error('Por favor, complete todos los campos');
            return;
        }

        if (user !== 'admin') {
            toast.error('Usuario no autorizado');
            return;
        }

        if (password !== 'admin') {
            toast.error('Contraseña incorrecta');
            return;
        }

        //cerrar el diálogo de login y abrir el de configuración
        toast.success('Inicio de sesión exitoso');
        getConfidence();//Recoge la confianza actual desde la BDD para que actualice la barra
        setIsConfigVisible(true);
    };


    // Función para manejar el guardado de la configuración
    const handleSaveConfig = () => {
        toast.success(`Configuración guardada: Sensibilidad = ${sensitivity}`);
        setIsConfigVisible(false); // Cierra el diálogo de configuración
        setConfidence()//Envia la nueva confianza a flask y a la BDD
    };

    return (
        <>
            {/* Dialogo de credenciales */}
            {!isConfigVisible && (
                <Dialog>
                    <DialogTrigger>
                        <span
                            className='absolute z-10 text-2xl right-20 bottom-5 bg-white rounded-full p-3 text-gray-900'
                            aria-label='Abrir Métricas'
                            title='Abrir Métricas'
                        >
                            <IoSettingsSharp />
                        </span>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Credenciales</DialogTitle>
                            <DialogDescription>
                                Solo personal autorizado puede modificar estas configuraciones.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleConfig}>
                            <input
                                type="text"
                                id='user'
                                placeholder="Usuario"
                                autoComplete='off'
                                value={user}
                                onChange={(e) => setUser(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                            <input
                                type="password"
                                id='password'
                                autoComplete='off'
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                            >
                                Ingresar
                            </button>
                        </form>
                    </DialogContent>
                </Dialog>
            )}

            {/* Diálogo de configuración de la IA */}
            {isConfigVisible && (
                <Dialog open={isConfigVisible} onOpenChange={setIsConfigVisible}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Configuración de la IA</DialogTitle>
                            <DialogDescription>
                                Ajuste la sensibilidad de la IA según sea necesario.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mb-4">
                            <label htmlFor="sensitivity" className="block mb-2">Sensibilidad: {sensitivity}</label>
                            <input
                                type="range"
                                id="sensitivity"
                                min="1"
                                max="100"
                                value={sensitivity}
                                onChange={(e) => setSensitivity(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>
                        <button
                            onClick={handleSaveConfig}
                            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                        >
                            Guardar Configuración
                        </button>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
};

export default AiConfig;

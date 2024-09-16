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

        // Si todo está correcto, cerrar el diálogo de login y abrir el de configuración
        toast.success('Inicio de sesión exitoso');
        setIsConfigVisible(true);
    };

    // Función para manejar el guardado de la configuración
    const handleSaveConfig = () => {
        toast.success(`Configuración guardada: Sensibilidad = ${sensitivity}`);
        setIsConfigVisible(false); // Cierra el diálogo de configuración
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
                                value={user}
                                onChange={(e) => setUser(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                            <input
                                type="password"
                                id='password'
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

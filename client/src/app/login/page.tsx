'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { toast } from 'react-toastify';


export default function Login() {

    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Funciones de validación
    const validateEmail = (email: string) => {
        const emailPattern = /^[a-zA-Z0-9._%+-]+@profesor\.duoc\.cl$/;
        return emailPattern.test(email);
    };

    const validatePassword = (password: string) => {
        const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        return passwordPattern.test(password);
    };
    // Función para manejar el inicio de sesión
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('Por favor, complete todos los campos');
            return;
        }

        if (!validateEmail(email)) {
            toast.error('El correo debe terminar con @profesor.duoc.cl');
            return;
        }

        if (!validatePassword(password)) {
            toast.error('La contraseña debe tener al menos 8 caracteres y ser alfanumérica');
            return;
        }

        // Enviar solicitud al backend para validar el login
        try {
            const response = await fetch('http://localhost:5000/db/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Inicio de sesión exitoso');
                router.push('/select-class');
            } else {
                toast.error(data.error || 'Usuario y/o contraseña incorrectos front');
            }
        } catch (error) {
            toast.error('Error en el servidor. Inténtelo más tarde.');
        }
    };

    return (
        <div className="flex justify-center items-center h-full">
            <div className="bg-white text-center p-8 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-4">Login</h1>
                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="email"
                        id='email'
                        placeholder="Correo electrónico"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                        Iniciar sesión
                    </button>
                </form>
            </div>
        </div>
    );
}

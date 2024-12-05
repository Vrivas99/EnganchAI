'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { useUser } from '@/context/UserContext';
import { Span } from 'next/dist/trace';


export default function Login() {

    const router = useRouter();
    const { fetchDataUser  } = useUser();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(true);

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
            const response = await fetch(`${process.env.NEXT_PUBLIC_EXPRESS_SERVER_URL}/db/login`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',

                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Inicio de sesión exitoso');
                setIsLoading(false);
                await fetchDataUser();
                router.push('/select-class');
            } else {
                toast.error(data.error || 'Usuario y/o contraseña incorrectos front');
            }
        } catch (error) {
            console.error('Error en el servidor:', error);
            toast.error('Error en el servidor. Inténtelo más tarde. front');
        }
    };

    return (
        <div className="flex justify-center items-center h-full">
            <div className="bg-white text-center p-8 rounded-lg shadow-lg ms:w-1/3">
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
                        autoComplete='current-password'
                    />
                    <button
                        type="submit"
                        className="w-full relative h-10 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                    >
                        {isLoading ? <span className='absolute inset-x-0 -mt-3 mx-auto'>Iniciar Sesión</span> : <span className='absolute inset-x-0 -mt-2 mx-auto w-5 h-5 border-4 border-t-transparent border-white rounded-full animate-spin'></span> }
                    </button>
                </form>
            </div>
        </div>
    );
}
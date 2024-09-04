'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Aqui hay que poner la logica del login
        router.push('/select-class');
    };

    return (
        <div className="flex justify-center items-center h-screen">
            <div className="bg-white text-center p-8 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-4">Login</h1>
                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Correo electrónico"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                        required
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

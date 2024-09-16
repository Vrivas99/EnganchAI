// app/not-found.tsx
'use client';

import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center h-full justify-center bg-gray-800">
            <h1 className="text-6xl font-bold text-red-600">404</h1>
            <p className="text-2xl mt-4 text-gray-100">Página no encontrada</p>
            <p className="text-lg mt-2 text-gray-100">La página que buscas no existe o ha sido movida.</p>
            <Link href="/" passHref>
                <button className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Volver al inicio
                </button>
            </Link>
        </div>
    );
}

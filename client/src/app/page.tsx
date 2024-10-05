'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Envuelve la lógica de redirección en un timeout para asegurar que el navegador esté listo
    const redirectTimeout = setTimeout(() => {
      router.push('/login');
    }, 2000); // Añade un pequeño retraso de 500ms o ajusta según sea necesario

    return () => clearTimeout(redirectTimeout); // Limpia el timeout en desmontaje
  }, [router]);

  return (
    <div className="flex justify-center items-center h-full">
      <h1 className="text-3xl font-bold">Redirigiendo...</h1>
    </div>
  );
}

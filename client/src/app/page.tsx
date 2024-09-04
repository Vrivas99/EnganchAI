'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/login');
  }, [router]);

  return (
    <div className="flex justify-center items-center h-screen">
      <h1 className="text-3xl font-bold">Redirigiendo...</h1>
    </div>
  );
}

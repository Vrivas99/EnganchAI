'use client'

import { useEffect } from 'react';
import { redirect, useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  redirect('/login');

  return (
    <div className="flex justify-center items-center h-full">
      <h1 className="text-3xl font-bold">Redirigiendo...</h1>
    </div>
  );
}

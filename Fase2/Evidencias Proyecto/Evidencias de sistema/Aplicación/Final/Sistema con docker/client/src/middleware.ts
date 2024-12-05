// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {

    const token = req.cookies.get('jwt')?.value; // Obtenemos el token de la cookie
    try {
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_EXPRESS_MIDDLEWARE}/db/validateToken`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'cookie': `jwt=${token}`, // Enviamos la cookie en el header
            },
        });

        if (response.ok) {
            return NextResponse.next();
        } else {
            return NextResponse.redirect(new URL('/', req.url));
        }
    } catch (error) {
        console.error("Error en la validación del token:", error);
        return NextResponse.redirect(new URL('/', req.url));
    }
}

// Configuración del middleware para las rutas que queremos proteger
export const config = {
    matcher: [
        '/video/:path*',
        '/select-class/:path*',
    ],
};

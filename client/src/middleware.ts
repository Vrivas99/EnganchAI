// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {

    const token = req.cookies.get('jwt')?.value; // Obtenemos el token de la cookie
    console.log(token);
    try {
        
        const response = await fetch('http://localhost:5000/db/validateToken', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'cookie': `jwt=${token}`, // Enviamos la cookie en el header
            },
        });

        console.log(response.status);
        if (response.ok) {
            console.log('Token válido');
            return NextResponse.next();
        } else {
            console.log(response.status);
            console.log('Token inválido');
            return NextResponse.redirect(new URL('/', req.url));
        }
    } catch (error) {
        console.error("Error en la validación del token:", error);
        return NextResponse.redirect(new URL('/', req.url));
    }
}

// Configuración para aplicar el middleware solo a la ruta /video
export const config = {
    matcher: [
        '/video/:path*',
        '/select-class/:path*',
    ],
};

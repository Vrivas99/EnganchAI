'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
    user: string;
    id: number;
    name: string;
    avatar: string | null;
    config: number;
}

interface UserContextType {
    user: User | null;
    fetchDataUser: () => Promise<void>;
    logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Hook para acceder fácilmente al contexto
export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

// Proveedor del contexto que maneja la lógica de obtener el usuario
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    // Fetch datos de usuario
    const fetchDataUser = async () => {
        try {
            const response = await fetch('http://localhost:5000/db/getToken', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error('Error al obtener información del usuario');
            }
            const result = await response.json();
            setUser(result || null);
        } catch (error) {
            console.error('Error al hacer fetch de datos del usuario:', error);
            setUser(null);
        }
    };

    // Cerrar sesión
    const logout = async () => {
        try {
            await fetch('http://localhost:5000/db/deleteToken', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            setUser(null);  // Limpiar el estado del usuario al hacer logout
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    useEffect(() => {
        fetchDataUser(); // Llamada inicial para cargar los datos del usuario si existe sesión
    }, []);

    return (
        <UserContext.Provider value={{ user, fetchDataUser, logout }}>
            {children}
        </UserContext.Provider>
    );
};

// MetricsContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRecording } from './RecordingContext'; // Importa el RecordingContext para utilizar isRecording

// Define la interfaz para el contexto de métricas

interface Metric {
    confidence: number;
    state: string;
}

interface MetricsResponse {
    Ids: {}; // Un diccionario con las IDs y sus métricas
    stateCounts: {
        Bored: 0;
        Confused: 0;
        Engaged: 0;
        Frustrated: 0;
    };
    totalPeople: 0;
}

interface MetricsContextType {
    metrics: MetricsResponse;
}

// Crea el contexto de métricas
const MetricsContext = createContext<MetricsContextType | undefined>(undefined);

// Hook personalizado para usar el contexto de métricas
export const useMetrics = () => {
    const context = useContext(MetricsContext);
    if (!context) {
        throw new Error('useMetrics debe usarse dentro de un MetricsProvider');
    }
    return context;
};

// Proveedor del contexto que maneja el estado de métricas
export const MetricsProvider = ({ children }: { children: ReactNode }) => {
    const [metrics, setMetrics] = useState<any>(null);
    const { isRecording } = useRecording(); // Usar isRecording desde el RecordingContext

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isRecording) {
            // Hacer la solicitud a la API de métricas solo cuando se esté grabando
            const fetchMetrics = async () => {
                try {
                    const response = await fetch('http://localhost:5000/api/metrics');
                    const data = await response.json();
                    setMetrics(data);
                } catch (error) {
                    console.error('Error al obtener las métricas:', error);
                }
            };

            fetchMetrics();
            interval = setInterval(fetchMetrics, 1000); // Actualiza cada 1
        } else {
            setMetrics(null); // Resetea las métricas cuando no se está grabando
            clearInterval(interval!);
        }

        return () => clearInterval(interval!);
    }, [isRecording]); // Dependencia de isRecording

    return (
        <MetricsContext.Provider value={{ metrics }}>
            {children}
        </MetricsContext.Provider>
    );
};

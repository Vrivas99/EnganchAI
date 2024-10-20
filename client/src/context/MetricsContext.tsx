'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRecording } from './RecordingContext';

// Definición de la interfaz para el contexto de métricas

interface Metric {
    confidence: number;
    state: string;
}

interface MetricsResponse {
    Ids: Record<string, Metric>; // Un diccionario con las IDs y sus métricas
    stateCounts: {
        Bored: number;
        Confused: number;
        Engaged: number;
        Frustrated: number;
    };
    totalPeople: number;
}

interface MetricsContextType {
    metrics: MetricsResponse;
    isSessionEnded: boolean;  // Nuevo estado para determinar si la sesión ha finalizado
    sessionReport: MetricsResponse | null;
}

// Creación del contexto de métricas
const MetricsContext = createContext<MetricsContextType | undefined>(undefined);

// Hook para usar el contexto de métricas
export const useMetrics = () => {
    const context = useContext(MetricsContext);
    if (!context) {
        throw new Error('useMetrics debe usarse dentro de un MetricsProvider');
    }
    return context;
};

// Provider del contexto que maneja el estado de métricas
export const MetricsProvider = ({ children }: { children: ReactNode }) => {
    const [metrics, setMetrics] = useState<MetricsResponse | any>(null);
    const [isSessionEnded, setIsSessionEnded] = useState(false);
    const [sessionReport, setSessionReport] = useState<MetricsResponse | null>(null);
    const { isRecording } = useRecording(); // Usar isRecording desde el RecordingContext

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isRecording) {
            // Hace la solicitud a la API de métricas solo cuando se esté grabando
            const fetchMetrics = async () => {
                try {
                    const response = await fetch('http://127.0.0.1:5001/metrics',
                        {
                            mode: 'cors', 
                            headers: {
                                'Access-Control-Allow-Origin': '*',
                            },
                        }
                    )
                    const data = await response.json();

                    // Verificar si data tiene la estructura esperada
                    if (data && data.Ids && data.stateCounts && data.totalPeople) {
                        setMetrics(data);
                    } else {
                        console.error('Estructura de datos inválida:', data);
                    }
                } catch (error) {
                    console.error('Error al obtener las métricas:', error);
                }
            };
            interval = setInterval(fetchMetrics, 1000); // Actualiza cada 1
        } else if (!isRecording && metrics) {
            setSessionReport(metrics);
            setIsSessionEnded(true);
        }

        return () => clearInterval(interval!);
    }, [isRecording]); // Dependencia de isRecording

    return (
        <MetricsContext.Provider value={{ metrics, isSessionEnded, sessionReport }}>
            {children}
        </MetricsContext.Provider>
    );
};

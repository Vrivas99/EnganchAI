'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRecording } from './RecordingContext';

// Definición de la interfaz para el contexto de métricas

interface Metric {
    confidence: number;
    state: string;
}

interface MetricsResponse {
    Ids: Record<string, Metric>; //Diccionario con las IDs y sus métricas
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
                    const response = await fetch('http://localhost:5000/metrics');
                    const data = await response.json();
                    setMetrics(data);
                } catch (error) {
                    console.error('Error al obtener las métricas:', error);
                }
            };

            fetchMetrics();
            interval = setInterval(fetchMetrics, 1000); // Actualiza cada 1
        } else if (!isRecording && metrics) {
            setSessionReport(metrics);
            setIsSessionEnded(true);
        }

        return () => clearInterval(interval!);
    }, [isRecording]); // Dependencia de isRecording

    return (
        <MetricsContext.Provider value={{ metrics, isSessionEnded, sessionReport}}>
            {children}
        </MetricsContext.Provider>
    );
};

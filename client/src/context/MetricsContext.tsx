'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRecording } from './RecordingContext';


//Definición de la interfaz para el contexto de métricas

interface Metric {
    confidence: number;
    state: string;
}

interface MetricsResponse {
    Ids: Record<string, Metric>; //Un diccionario con las IDs y sus métricas
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
    engagedHistory: { engagedCount: number }[];
    clearEngagedHistory: () => void;
    isSessionEnded: boolean;  //Nuevo estado para determinar si la sesión ha finalizado
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
    const [engagedHistory, setEngagedHistory] = useState<{ engagedCount: number }[]>([]);
    const [isSessionEnded, setIsSessionEnded] = useState(false);
    const [sessionReport, setSessionReport] = useState<MetricsResponse | null>(null);
    const { isRecording } = useRecording(); // Usar isRecording desde el RecordingContext
    
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
    
        if (isRecording) {
            const fetchMetrics = async () => {
                try {
                    const response = await fetch('http://localhost:5000/api/metrics', {
                        headers: { 'Content-Type': 'application/json' },
                    });
                    const data = await response.json();
                    
                    if (data && data.Ids && data.stateCounts && data.totalPeople) {
                        setMetrics(data);
                        // Guardar datos de engaged a lo largo del tiempo
                        setEngagedHistory((prev) => [
                            ...prev, 
                            { engagedCount: data.stateCounts.Bored }
                        ]);
                    }
                } catch (error) {
                    console.error('Error al obtener las métricas:', error);
                }
            };
            interval = setInterval(fetchMetrics, 1000); // Actualiza cada segundo
        } else if (!isRecording && metrics) {
            setSessionReport(metrics); // Se establece el reporte final al detener la grabación
            setIsSessionEnded(true);
            
        }
    
        return () => clearInterval(interval!);
    }, [isRecording]);

    const clearEngagedHistory = () => {
        setEngagedHistory([]);
    };
    
    

    return (
        <MetricsContext.Provider value={{ metrics,engagedHistory, clearEngagedHistory, isSessionEnded, sessionReport }}>
            {children}
        </MetricsContext.Provider>
    );
};

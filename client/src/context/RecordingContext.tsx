'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

//interfaz para el contexto
interface RecordingContextType {
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
  handleRecording: () => void;
  sessionTime: number;
  setSessionTime: (time: number) => void;
}

// Creacion del contexto con valores iniciales
const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

// Hook para usar el contexto
export const useRecording = () => {
  const context = useContext(RecordingContext);
  if (!context) {
    throw new Error('useRecording debe usarse dentro de un RecordingProvider');
  }
  return context;
};

// Provider del contexto que maneja el estado de grabación
export const RecordingProvider = ({ children }: { children: ReactNode }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);

  const handleRecording = () => {
    setIsRecording((prevState) => !prevState);
  };

  return (
    <RecordingContext.Provider value={{ isRecording, setIsRecording, handleRecording, sessionTime, setSessionTime }}>
      {children}
    </RecordingContext.Provider>
  );
};

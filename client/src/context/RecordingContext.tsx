'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// Define la interfaz para el contexto
interface RecordingContextType {
  isRecording: boolean;
  handleRecording: () => void;
}

// Crea el contexto con valores iniciales
const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

// Hook personalizado para usar el contexto
export const useRecording = () => {
  const context = useContext(RecordingContext);
  if (!context) {
    throw new Error('useRecording debe usarse dentro de un RecordingProvider');
  }
  return context;
};

// Proveedor del contexto que maneja el estado de grabación
export const RecordingProvider = ({ children }: { children: ReactNode }) => {
  const [isRecording, setIsRecording] = useState(false);

  const handleRecording = () => {
    setIsRecording((prevState) => !prevState);
  };

  return (
    <RecordingContext.Provider value={{ isRecording, handleRecording }}>
      {children}
    </RecordingContext.Provider>
  );
};

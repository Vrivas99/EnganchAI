'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRecording } from './RecordingContext';

interface Asignacion {
    IDASIGNACION: number;
    ID_SECCION: number;
    SECCION: string;
    ID_SALA: number;
    SALA: string;
}

interface ClassContextType {
    selectedSection: string;
    setSelectedSection: React.Dispatch<React.SetStateAction<string>>;
    selectedClass: string;
    setSelectedClass: React.Dispatch<React.SetStateAction<string>>;
    availableSections: Asignacion[];
    availableRooms: Asignacion[];
    fetchUserAssignment: () => Promise<void>;
    cameraLink: string;
    fetchCameraLink: () => Promise<void>;
    getSelectedSectionName: () => string;
    getSelectedClassName: () => string;
    getAssignmentId: () => number | null;
}

const ClassContext = createContext<ClassContextType | undefined>(undefined);

export const useClass = () => {
    const context = useContext(ClassContext);
    if (!context) {
        throw new Error('useClass must be used within a ClassProvider');
    }
    return context;
};

export const ClassProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedSection, setSelectedSection] = useState<string>('');
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [data, setData] = useState<Asignacion[]>([]);
    const [availableSections, setAvailableSections] = useState<Asignacion[]>([]);
    const [availableRooms, setAvailableRooms] = useState<Asignacion[]>([]);
    const [cameraLink, setCameraLink] = useState<string>('');
    const { isRecording } = useRecording();

    const getSelectedSectionName = () => {
        const section = availableSections.find((sec) => sec.ID_SECCION === Number(selectedSection));
        return section ? section.SECCION : '';
    };
    
    const getSelectedClassName = () => {
        const room = availableRooms.find((room) => room.ID_SALA === Number(selectedClass));
        return room ? room.SALA : '';
    };

    const getAssignmentId = () => {
        const assignment = data.find(
            (asignacion) =>
                asignacion.ID_SECCION === Number(selectedSection) &&
                asignacion.ID_SALA === Number(selectedClass)
        );
        return assignment ? assignment.IDASIGNACION : null; // Devuelve null si no se encuentra
    };

    const fetchUserAssignment = async () => {
        try {
            const response = await fetch('http://localhost:5000/db/getUserAsignation', {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            });
            const result = await response.json();
            setData(result.data || []);
            const uniqueSections = Array.from(
                new Map(result.data.map((item: Asignacion) => [item.ID_SECCION, item])).values()
            ) as Asignacion[];
            setAvailableSections(uniqueSections);
        } catch (error) {
            console.error('Error fetching user assignment:', error);
        }
    };

    const fetchCameraLink = async () => {
        try {
            const response = await fetch('http://localhost:5000/db/getCameraLink', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ salaID: selectedClass }),
            });

            if (!response.ok) {
                throw new Error(`Error fetching camera link ${response.status}`);
            }

            const data = await response.json();
            const link = data?.data?.[0]?.LINK;

            if (!link) {
                throw new Error('No camera link found');
            }else if (isRecording) {
                setCameraLink(link);
            } 
            // Realizar el siguiente post para configurar el link en el backend
            await fetch('http://localhost:5000/api/setCamLink', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ link }),
            });
        } catch (error) {
            console.error('Error fetching camera link:', error);
        }
    };

    useEffect(() => {
        if (selectedSection) {
            const filteredRooms = data.filter((asignacion) => asignacion.ID_SECCION === Number(selectedSection));
            setAvailableRooms(filteredRooms);
        } else {
            setAvailableRooms([]);
        }
    }, [selectedSection, data]);

    return (
        <ClassContext.Provider
            value={{
                selectedSection,
                setSelectedSection,
                selectedClass,
                setSelectedClass,
                availableSections,
                availableRooms,
                fetchUserAssignment,
                cameraLink,
                fetchCameraLink,
                getSelectedSectionName,
                getSelectedClassName,
                getAssignmentId,
            }}
        >
            {children}
        </ClassContext.Provider>
    );
};

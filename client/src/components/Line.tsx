'use client'
import React from 'react'
import { Chart, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    ChartOptions,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    TooltipItem,
    Legend,
} from 'chart.js';

import { useMetrics } from "@/context/MetricsContext";
import { useRecording } from "@/context/RecordingContext";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend);

const LineGraph = () => {
    const { engagedHistory, sessionReport } = useMetrics();

    // Verifica si hay personas totales para evitar valores undefined o divisiones por 0
    const totalPeople = sessionReport?.totalPeople ?? 1; // Usa 1 como fallback si es undefined o 0.

    // label muestra el contador de personas con engaged
    const labels = engagedHistory.map((entry, index) => entry.engagedCount);

    const data = {
        labels: labels,
        datasets: [
            {
                label: 'Engaged (%)',
                data: engagedHistory.map((entry) => {
                    // Calcula el promedio de engagement
                    const engagedPercentage = (entry.engagedCount / totalPeople) * 100;
                    // Limita el valor entre 0 y 100
                    return Math.min(Math.max(engagedPercentage, 0), 100);
                }),
                fill: true,
                backgroundColor: 'rgb(75, 192, 192)',
                borderColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.4, // Hace que la curva sea un poco más suave
            },
        ],
    };

    const options = {
        scales: {
            y: {
                beginAtZero: true,
                max: 100, // Asegura que el eje Y no supere el 100%
                title: {
                    display: true,
                    text: 'Engaged (%)',
                },
            },
            x: {
                autoSkip: true,
                autoSkipPadding: 100,
                title: {
                    display: true,
                    text: 'Cantidad alumnos', // Muestra el tiempo en el eje X

                },
            },
        },
        plugins: {
            tooltip: {
                callbacks: {
                    // Cuando se posa el mouse, se muestra el promedio de engagement correctamente
                    label: function (tooltipItem: TooltipItem<'line'>) {
                        const value = tooltipItem.raw as number;
                        return `Engaged (%): ${value?.toFixed(2)}`; // Usamos toFixed para mostrar solo 2 decimales
                    },
                },
            },
        },
    };

    return <Line data={data} options={options} />;
};

export default LineGraph;

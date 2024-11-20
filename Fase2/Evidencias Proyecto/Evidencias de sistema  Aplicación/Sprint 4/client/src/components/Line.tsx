'use client'
import React from 'react';
import { Chart, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    TooltipItem,
    Legend,
} from 'chart.js';

import { useMetrics } from "@/context/MetricsContext";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const LineGraph = () => {
    const { engagedHistory, sessionReport } = useMetrics();

    const totalPeople = sessionReport?.totalPeople ?? 1;

    // Usa los índices para representar segundos y multiplica si necesitas otro intervalo de tiempo
    const labels = engagedHistory.map((_, index) => index * 1); // Usamos segundos

    const data = {
        labels: labels,
        datasets: [
            {
                label: 'Engaged (%)',
                data: engagedHistory.map((entry) => {
                    const engagedPercentage = (entry.engagedCount / totalPeople) * 100;
                    return Math.min(Math.max(engagedPercentage, 0), 100);
                }),
                fill: true,
                backgroundColor: 'rgb(75, 192, 192)',
                borderColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.4,
            },
        ],
    };

    const options = {
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                title: {
                    display: true,
                    text: 'Engaged (%)',
                },
            },
            x: {
                title: {
                    display: true,
                    text: 'Tiempo (s,m,h)',
                },
                ticks: {
                    callback: function (value: string |number) {
                        const seconds = value as number;
                        const hours = Math.floor(seconds / 3600);
                        const minutes = Math.floor((seconds % 3600) / 60);
                        const remainingSeconds = seconds % 60;

                        if (hours > 0) {
                            return `${hours}h ${minutes}m`;
                        } else if (minutes > 0) {
                            return `${minutes}m ${remainingSeconds}s`;
                        }
                        return `${remainingSeconds}s`;
                    },
                },
            },
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: function (tooltipItem: TooltipItem<'line'>) {
                        const value = tooltipItem.raw as number;
                        return `Engaged (%): ${value?.toFixed(2)}`;
                    },
                },
            },
        },
    };

    return <Line data={data} options={options} />;
};

export default LineGraph;

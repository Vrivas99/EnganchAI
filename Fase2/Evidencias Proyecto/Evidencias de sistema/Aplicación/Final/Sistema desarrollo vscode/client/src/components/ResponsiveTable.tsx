import React from "react";

interface TableRow {
    seccion: string;
    sala: string;
    totalAlumnos: number;
    promedioEngagement: number;
}

interface ResponsiveTableProps {
    data: TableRow[];
}

const ResponsiveTable: React.FC<ResponsiveTableProps> = ({ data }) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse border border-gray-300">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="px-4 py-2 text-left border border-gray-300">Sección</th>
                        <th className="px-4 py-2 text-left border border-gray-300">Sala</th>
                        <th className="px-4 py-2 text-left border border-gray-300">Total Alumnos</th>
                        <th className="px-4 py-2 text-left border border-gray-300">Promedio Engagement</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <tr
                            key={index}
                            className={`${index % 2 === 0 ? "bg-white" : "bg-gray-100"
                                } hover:bg-gray-50`}
                        >
                            <td className="px-4 py-2 border border-gray-300">{row.seccion}</td>
                            <td className="px-4 py-2 border border-gray-300">{row.sala}</td>
                            <td className="px-4 py-2 border border-gray-300">{row.totalAlumnos}</td>
                            <td className="px-4 py-2 border border-gray-300">
                                <div className="flex items-center">
                                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                        <div
                                            className="bg-blue-500 h-full"
                                            style={{ width: `${row.promedioEngagement}%` }}
                                        ></div>
                                    </div>
                                    <span className="ml-2 text-sm">{row.promedioEngagement}%</span>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ResponsiveTable;

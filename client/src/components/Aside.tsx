'use client'
//icons
import { FaPlus } from "react-icons/fa";
import { IoWarningOutline } from "react-icons/io5";

//component shadcn
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"


const students = [
    { id: "A01", engagement: 10, warning: true },
    { id: "A02", engagement: 70, warning: false },
    { id: "A03", engagement: 40, warning: false },
    { id: "A04", engagement: 5, warning: true },
    { id: "A05", engagement: 60, warning: false },
    { id: "A06", engagement: 30, warning: false },
    { id: "A07", engagement: 70, warning: false },
    { id: "A08", engagement: 25, warning: true },
    { id: "A09", engagement: 55, warning: false },
    { id: "A10", engagement: 95, warning: false },
    { id: "A11", engagement: 80, warning: false },
    { id: "A12", engagement: 45, warning: false },
    { id: "A13", engagement: 35, warning: false },
    { id: "A14", engagement: 85, warning: false },
];

const Aside = () => {

    return (
        <>
            <Sheet>
                <SheetTrigger>
                    <span
                        className='absolute z-10 text-2xl right-5 bottom-5 bg-white rounded-full p-3 text-gray-900'
                        aria-label='Abrir Metricas'
                        title='Abrir Metricas'
                    >
                        <FaPlus />
                    </span>
                </SheetTrigger>
                <SheetContent className="max-h-screen overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>
                            <span className="text-gray-900 py-2 font-bold">
                                Metricas
                            </span>
                        </SheetTitle>
                        <SheetDescription>
                            <span className="text-gray-700">Engagement de los estudiantes</span>
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-4">
                        {/* Subtítulos */}
                        <div className="flex items-center text-gray-700 font-bold mb-2">
                            <span className="w-1/4">ID</span>
                            <span className="w-1/4 text-center">Engagement</span>
                        </div>
                        {/* Lista de estudiantes con las barras de progreso */}
                        <ul className="space-y-4">
                            {students.map((student) => (
                                <li key={student.id} className="flex justify-between items-center">
                                    {/* ID del estudiante */}
                                    <span className="text-gray-700 w-1/4">{student.id}</span>
                                    {/* Barra de progreso */}
                                    <div className="relative w-3/4 mx-4">
                                        {/* Barra de fondo */}
                                        <div className="w-full h-3 bg-gray-300 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500"
                                                style={{ width: `${student.engagement}%` }}
                                            />
                                        </div>
                                    </div>
                                    {/* Mostrar advertencia si el estudiante tiene bajo engagement */}
                                    <div className="w-1/6 text-center">
                                        {student.warning && (
                                            <IoWarningOutline className="text-yellow-500 text-xl" title="Advertencia" />
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}

export default Aside;
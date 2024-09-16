'use client'
//icons
import { FaPlus } from "react-icons/fa";

//component shadcn
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"


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
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>
                            <span className="text-gray-900 py-2 font-bold">
                                Metricas
                            </span>
                        </SheetTitle>
                        <SheetDescription>
                            Aqui van las metricas. Falta definir que metricas se van a mostrar y como se van a mostrar.
                        </SheetDescription>
                    </SheetHeader>
                </SheetContent>
            </Sheet>
        </>
    );
}

export default Aside;
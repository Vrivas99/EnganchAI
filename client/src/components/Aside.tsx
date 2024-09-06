'use client'

import { useState } from 'react';
import { Transition } from '@headlessui/react'

//icons
import { FaPlus } from "react-icons/fa";
import { FaTimes } from "react-icons/fa";

const Aside = () => {

    const [isClosed, setClosed] = useState(true);

    return (
        <>
            <Transition 
                show={!isClosed}
                enter="transition ease-in-out duration-300 transform"
                // de derecha a izquierda
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transition ease-in-out duration-300 transform"
                leaveFrom="translate-x-0"
                // de izquierda a derecha
                leaveTo="translate-x-full"
                >
                <aside className="absolute z-10 h-full right-0 bg-white w-1/4 lg:w-1/3 flex flex-col">
                    <div
                        className="bg-white border-r border-b px-4 h-10 flex justify-between">
                        <span className="text-gray-900 py-2 font-bold">
                            Metricas
                        </span>
                        <button
                            className='text-gray-900 text-2xl'
                            aria-label='Cerrar Metricas'
                            title='Cerrar Metricas'
                            onClick={() => setClosed(true)}><FaTimes /></button>
                    </div>
                </aside>
            </Transition>
            <button
                className='absolute text-2xl right-5 bottom-5 bg-white rounded-full p-3 text-gray-900'
                aria-label='Abrir Metricas'
                title='Abrir Metricas'
                onClick={() => setClosed(false)}
            >
                <FaPlus />
            </button>
        </>
    );
}

export default Aside;
import VideoCapture from '@/components/VideoCapture';
import { useState } from 'react';


export default function Video() {

    return (
        <div className="flex justify-center items-center h-full">
                <VideoCapture />
        </div>
    );
}

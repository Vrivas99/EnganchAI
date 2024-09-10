'use client';

import { useEffect, useRef } from 'react';

const VideoCapture = () => {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            })
            .catch(err => console.error('Error al acceder a la cámara', err));
    }, []);

    return (
        <div className="flex h-full w-full">
            <video ref={videoRef} autoPlay className="bg-gray-700" />
        </div>
    );
};

export default VideoCapture;

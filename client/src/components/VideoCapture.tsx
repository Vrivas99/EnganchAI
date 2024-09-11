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
        <div className="flex">
            {/* videoRef usa si o si la webcam directa del pc, de paso, no hay que usar <video>*/}
            {/* <video  controls autoPlay className="w-full h-[90%] bg-gray-700" >
                <source src="http://localhost:5000/camera-stream" type="video/mp4" />
            </video> */}
            {/*camera flask  */}
            <img src='http://localhost:5000/flask-stream'></img>
        </div>
        
    );
};

export default VideoCapture;

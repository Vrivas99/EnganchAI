'use client';

import { useEffect, useRef } from 'react';
import { useRecording } from '@/context/RecordingContext';

const VideoCapture: React.FC = () => {
  const { isRecording } = useRecording();
  const videoRef = useRef<HTMLVideoElement | null>(null);


  useEffect(() => {
    if (isRecording) {
      // Establece el src del video a la URL del endpoint de video del servidor Flask
      if (videoRef.current) {
        videoRef.current.src = 'http://localhost:5001/video_feed'; // URL del servidor Flask
        videoRef.current.play();
      }
    } else {
      // Detiene la reproducción del video
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
      }
    }
  }, [isRecording]);
  
  return (
    <div className="flex h-full w-full">
      <video ref={videoRef} autoPlay className="bg-gray-700" />
    </div>
  );
};

export default VideoCapture;


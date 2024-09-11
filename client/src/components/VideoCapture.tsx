'use client';

import { useEffect, useRef } from 'react';
import { useRecording } from '@/context/RecordingContext';

const VideoCapture: React.FC = () => {
  const { isRecording } = useRecording();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isRecording) {
      // Inicia la captura de video
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => console.error('Error al acceder a la cámara', err));
    } else {
      // Detiene la captura de video
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
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


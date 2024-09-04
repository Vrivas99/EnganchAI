import VideoCapture from '@/components/VideoCapture';

export default function Video() {
    return (
        <div className="flex justify-center items-center h-screen">
            <div className="bg-white p-8 rounded-lg shadow-lg">
                <h1>aqui va la grabación, tengo que ajustarlo a la pantalla</h1>
                <VideoCapture />
            </div>
        </div>
    );
}

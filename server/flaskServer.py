from flask import Flask, Response, jsonify
import cv2
import numpy as np
import tensorflow as tf
from ultralytics import YOLO

#pip install flask opencv-python-headless tensorflow ultralytics
#Necesita un modelo .h5 que pesa mas del limite de github, descargar para probar

app = Flask(__name__)

daisee_labels = ["Frustrated", "Confused", "Bored", "Engaged"]
engagement_model = tf.keras.models.load_model("modelo_cnn_knn.h5")
face_model = YOLO('yolov8n.pt')

# Definir colores para cada estado de engagement
colorList = {
    "Engaged": (133, 255, 49),  # Verde claro
    "Frustrated": (0, 0, 255),   # Rojo
    "Confused": (255, 115, 19),   # Naranjo
    "Bored": (95, 205, 228)     # Celeste
}

metrics = {
    "totalPeople": 0,
    "stateCounts": {
        "Frustrated": 0,
        "Confused": 0,
        "Bored": 0,
        "Engaged": 0
    }
}

#Lista de ip que sirven para pruebas
#http://162.191.81.11:81/cgi-bin/mjpeg?resolution=800x600&quality=1&page=1725548701621&Language=11
#http://129.125.136.20/mjpg/video.mjpg?resolution=800x600&quality=1&page=1725548701621&Language=11

#Datos de la camara
load_dotenv()
userCam = os.getenv('CAMERAUSER')
passCam = os.getenv('CAMERAPASS')
cap = cv2.VideoCapture(1)#f"rtsp://{userCam}:{passCam}@192.168.100.84:554/av_stream/ch0"
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  #Cantidad de fotogramas que se almacenaran en el buffer
#cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 5000)#Aumentar tiempo de espera para reconexion a 5 segundos

#Reducir la carga de la CPU reduciendo la cantidad de fotogramas (sino el programa se congela)
frameCount = 0
fpsTarget = 2#Cantidad de fps que quiero procesar
fpsStream = 10#FPS de la transmision (ver con cap.get(cv2.CAP_PROP_FPS))

if not cap.isOpened():
    raise Exception("Error: Could not open video stream.")
else:
    print("\n///////\nstream in http://192.168.100.5:5001/video_feed \n Metrics: http://192.168.100.5:5001/metrics \n///////\n")

def generate_frames():
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        #Resetear metricas
        metrics["totalPeople"] = 0
        metrics["stateCounts"] = {key: 0 for key in metrics["stateCounts"]}

        # Face detection
        results = face_model(frame)
        if results and len(results[0].boxes) > 0:
            for detection in results[0].boxes:
                #Limitar la deteccion solamente a personas
                if detection.cls[0] == 0:#la id 0 es para personas (id de yolo)
                    metrics["totalPeople"] += 1

                    x1, y1, x2, y2 = map(int, detection.xyxy[0])

                    face = frame[y1:y2, x1:x2]
                    if face.size == 0:
                        continue

                    face_resized = cv2.resize(face, (224, 224))
                    face_array = np.expand_dims(face_resized, axis=0) / 255.0
                    engagement_prediction = engagement_model.predict(face_array)

                    if engagement_prediction.ndim == 2 and engagement_prediction.shape[1] == len(daisee_labels):
                        predicted_index = np.argmax(engagement_prediction)
                        engagement_state = daisee_labels[predicted_index]

                        metrics["stateCounts"][engagement_state] += 1

                        #Seleccionar el color correspondiente
                        color = colorList.get(engagement_state, (255, 255, 255))  # Blanco por defecto si no se encuentra

                        #Bound box
                        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

                        #Texto de estado
                        cv2.putText(frame, f'Engagement: {engagement_state}', (x1, y1 - 10), 
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)

        #Convertir el frame a jpg
        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue
        
        frame = buffer.tobytes()
        yield (b'--frame\r\n'
                        b'Content-Type:image/jpeg\r\n'
                        b'Content-Length: ' + f"{len(frame)}".encode() + b'\r\n'
                        b'\r\n' + frame + b'\r\n')

#Ruta del video en stream
@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=--frame')

@app.route('/metrics', methods=('GET',))
def getMetrics():
    return jsonify(metrics)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001)
from flask import Flask, Response, jsonify
import cv2
import numpy as np
import tensorflow as tf
from ultralytics import YOLO
import copy#Para copiar las metricas
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

metricsAPI = {
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

#Los argumentos de la url son necesarios para que la transmision no sea tan pesada y no caduque la conexion
cap = cv2.VideoCapture("http://129.125.136.20/mjpg/video.mjpg?resolution=800x600&quality=1&page=1725548701621&Language=11")

if not cap.isOpened():
    raise Exception("Error: Could not open video stream.")
else:
    print("\n///////\nstream in http://192.168.100.5:5001/video_feed \n Metrics: http://192.168.100.5:5001/metrics \n///////\n")

def generate_frames():
    global metricsAPI
    while cap.isOpened():
        #Resetear metricas
        metrics["totalPeople"] = 0
        metrics["stateCounts"] = {key: 0 for key in metrics["stateCounts"]}
        print("Reseteo de metricas: ",metrics)

        ret, frame = cap.read()
        if not ret:
            break
        
        

        # deteccion de objetos de YOLO
        results = face_model(frame)

        #Contar personas detectadas (para comprobar que la suma de los estados es correcta)
        metrics["totalPeople"] = sum(1 for det in results[0].boxes if det.cls[0] == 0)

        if results and len(results[0].boxes) > 0:
            for detection in results[0].boxes:
                #Limitar la deteccion solamente a personas
                if detection.cls[0] == 0:#la id 0 es para personas (id de yolo)
                    #metrics["totalPeople"] += 1

                    x1, y1, x2, y2 = map(int, detection.xyxy[0])

                    face = frame[y1:y2, x1:x2]
                    if face.size == 0:
                        continue

                    face_resized = cv2.resize(face, (224, 224))
                    face_array = np.expand_dims(face_resized, axis=0) / 255.0

                    #Prediccion de estado
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
                        cv2.putText(frame, f'{engagement_state}', (x1, y1 - 10), 
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)

        #Convertir el frame a jpg
        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            break
        
        #Actualizar resultados de las metricas (para que no se envien metricas incompletas en la api)
        metricsAPI = copy.deepcopy(metrics)
        print("metricas actualizadas: ",metricsAPI)

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
    return jsonify(metricsAPI)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001)
from flask import Flask, Response, jsonify, request
import cv2
import numpy as np
import tensorflow as tf
from ultralytics import YOLO
import copy#Para copiar las metricas
from collections import defaultdict#Para almacenar las id's
#pip install flask opencv-python-headless tensorflow ultralytics
#Necesita un modelo .h5 que pesa mas del limite de github, descargar para probar

app = Flask(__name__)

# Definir colores para cada estado de engagement
colorList = {
    "Engaged": (133, 255, 49),  # Verde claro
    "Frustrated": (0, 0, 255),   # Rojo
    "Confused": (255, 115, 19),   # Naranjo
    "Bored": (95, 205, 228)     # Celeste
}
#Metricas
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

daisee_labels = ["Frustrated", "Confused", "Bored", "Engaged"]
engagement_model = tf.keras.models.load_model("modelo_cnn_knn.h5")
yoloModel = YOLO('yolov8n.pt')
minConfidence = 0.3#umbral minimo de confianza
#Contador de ID
personIdCounter = 1
activePersonIds = {}

#Lista de ip que sirven para pruebas
#http://162.191.81.11:81/cgi-bin/mjpeg?resolution=800x600&quality=1&page=1725548701621&Language=11
#http://129.125.136.20/mjpg/video.mjpg?resolution=800x600&quality=1&page=1725548701621&Language=11

#Los argumentos de la url son necesarios para que la transmision no sea tan pesada y no caduque la conexion
cap = cv2.VideoCapture("http://129.125.136.20/mjpg/video.mjpg?resolution=800x600&quality=1&page=1725548701621&Language=11")

if not cap.isOpened():
    raise Exception("Error: Could not open video stream.")
else:
    print("\n///////\nstream in http://192.168.100.5:5001/video_feed \n Metrics: http://192.168.100.5:5001/metrics \n///////\n")

#Limpiar el contador de ID cuando no se detecten mas personas
def resetIDCounter():
    global personIdCounter, activePersonIds
    personIdCounter = 1
    activePersonIds = {}

def generate_frames():
    global metricsAPI, personIdCounter, activePersonIds
    while cap.isOpened():
        #Resetear metricas
        metrics["totalPeople"] = 0
        metrics["stateCounts"] = {key: 0 for key in metrics["stateCounts"]}

        ret, frame = cap.read()
        if not ret:
            break

        # deteccion de objetos de YOLO
        results = yoloModel.track(frame, persist=True)#track y persist=True para asignar id a lo identificado

        #Contar personas detectadas (para comprobar que la suma de los estados es correcta)
        metrics["totalPeople"] = sum(1 for det in results[0].boxes if det.cls[0] == 0)

        if results and len(results[0].boxes) > 0:
            personDetected = False #Verificador de personas por frame
            for detection in results[0].boxes:
                #Limitar la deteccion solamente a personas
                if detection.cls[0] == 0:#la id 0 es para personas (id de yolo)
                    personDetected = True

                    if detection.id is not None:
                        yoloTrackID = int(detection.id.item())

                        #Si el iD de yolo no esta en mi variable customisada, asignar una
                        if yoloTrackID not in activePersonIds:
                            activePersonIds[yoloTrackID] = personIdCounter
                            personIdCounter +=1

                        #Obtenemos el ID personalizado de la persona
                        trackID = activePersonIds[yoloTrackID]

                        #Coordenadas para el boundbox
                        x1, y1, x2, y2 = map(int, detection.xyxy[0])

                        face = frame[y1:y2, x1:x2]
                        if face.size == 0:
                            continue

                        face_resized = cv2.resize(face, (224, 224))
                        face_array = np.expand_dims(face_resized, axis=0) / 255.0

                        #Prediccion de estado
                        engagement_prediction = engagement_model.predict(face_array)
                        #print("engagement prediction: ",engagement_prediction)

                        if engagement_prediction.ndim == 2 and engagement_prediction.shape[1] == len(daisee_labels):
                            predicted_index = np.argmax(engagement_prediction[0])#[0] por que engagement_prediction es un array doble [[x,x,x,x]]
                            predictedProbabilities = engagement_prediction[0][predicted_index]#Extraer las probabilidades

                            #Asignar un estado dependiendo del umbral de confianza (si el % de confianza de la prediccion es menor al minimo, se detectara por defecto "Engaged"")
                            if predictedProbabilities > minConfidence:
                                #print(f"Se cumplio: {predictedProbabilities} / {minConfidence}")
                                engagement_state = daisee_labels[predicted_index]
                            else:
                                #print(f"NO se cumplio: {predictedProbabilities} / {minConfidence}")
                                engagement_state = "Engaged"

                            metrics["stateCounts"][engagement_state] += 1

                            #Seleccionar el color correspondiente
                            color = colorList.get(engagement_state, (255, 255, 255))  # Blanco por defecto si no se encuentra

                            #Bound box
                            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

                            #Texto de estado + % de probabilidad
                            cv2.putText(frame, f'ID: {trackID} | {engagement_state} %{round(predictedProbabilities*100)}', (x1, y1 - 10), 
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)

            #Si no hay personas en la imagen, resetear ID
            if not personDetected:
                resetIDCounter()
        else:
            #Si no hay resultados o boxes (aunque este no filtra por personas)
            resetIDCounter()
        
        #Convertir el frame a jpg
        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            break
        
        #Actualizar resultados de las metricas (para que no se envien metricas incompletas en la api)
        metricsAPI = copy.deepcopy(metrics)

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

#Enviar las metricas a express
@app.route('/metrics', methods=('GET',))
def getMetrics():
    return jsonify(metricsAPI)

#Modificar la confianza desde express
@app.route('/setConfidence', methods=['POST'])
def set_confidence():
    global minConfidence
    try:
        # Obtener el nuevo umbral de confianza desde el cuerpo de la petición
        data = request.get_json()
        newConfidence = float(data.get('minConfidence'))

        # Verificar que el valor esté en un rango válido (0.0 a 1.0)
        if 0 <= newConfidence <= 1:
            minConfidence = newConfidence
            return jsonify({"status": "success", "new_confidence": minConfidence}), 200
        else:
            return jsonify({"status": "error", "message": "Confidence must be between 0 and 1"}), 400

    except (ValueError, TypeError):
        return jsonify({"status": "error", "message": "Invalid confidence value"}), 400


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001)
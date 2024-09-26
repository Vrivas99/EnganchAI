from flask import Flask, Response, jsonify, request
import cv2
import numpy as np
import tensorflow as tf
from ultralytics import YOLO
import copy#Para copiar las metricas
from collections import defaultdict#Para almacenar las id's
#Cargar usuario y contraseña de mi camara
from dotenv import load_dotenv
import os
#Crear multiprocesos para no saturar las funciones
import queue
q=queue.Queue(maxsize=10)#Crear queue para pasar los frames entre multiprocesos
import threading
#CUDA (si esta disponible)
#import torch


#pip install flask opencv-python-headless tensorflow ultralytics python-dotenv torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
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
    },
    "Ids":{},
    "STATUS":""
}

daisee_labels = ["Frustrated", "Confused", "Bored", "Engaged"]
engagement_model = tf.keras.models.load_model("modelo_cnn_knn.h5")
#Cargar YOLO
yoloModel = YOLO('yolov8n.pt')#yolov8n-face.pt
#device = 'cuda' if torch.cuda.is_available() else 'cpu'#Cargar el modelo en la GPU si esta disponible
yoloModel = yoloModel.to('cpu')#device

minConfidence = 0.3#umbral minimo de confianza
#Contador de ID
personIdCounter = 1
activePersonIds = {}

#Datos de la camara
load_dotenv()
userCam = os.getenv('CAMERAUSER')
passCam = os.getenv('CAMERAPASS')
camLink = "TestVideos/1.webm"#f"rtsp://{userCam}:{passCam}@192.168.100.84:554/av_stream/ch0"
cap = cv2.VideoCapture(camLink)
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  #Cantidad de fotogramas que se almacenaran en el buffer
#cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 5000)#Aumentar tiempo de espera para reconexion a 5 segundos

#Reducir la carga de la CPU reduciendo la cantidad de fotogramas (sino el programa se congela)
frameCount = 0
fpsTarget = 2#Cantidad de fps que quiero procesar
fpsStream = 10#FPS de la transmision (ver con cap.get(cv2.CAP_PROP_FPS))
#Resolucion del stream
resWidth = 640
resHeight = 480

if not cap.isOpened():
    raise Exception("Error: Could not open video stream.")
else:
    #print("CUDA:", torch.cuda.is_available())
    #if torch.cuda.is_available():
    #    print("Número de GPUs:", torch.cuda.device_count())
    #    print("Nombre de la GPU:", torch.cuda.get_device_name(0))
    print("\n///////\nstream in http://127.0.0.1:5001/video_feed \n Metrics: http://127.0.0.1:5001/metrics \n///////\n")

#Limpiar el contador de ID cuando no se detecten mas personas
def resetIDCounter():
    global personIdCounter, activePersonIds
    personIdCounter = 1
    activePersonIds = {}

def receiveStream():
    global frameCount, fpsStream
    cap = cv2.VideoCapture(camLink)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  #Cantidad de fotogramas que se almacenaran en el buffer
    #Intenta cambiar la resolucion desde la fuente de video (algunos dispositivos pueden no permitir un cambio en la resolucion)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, resWidth)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, resHeight)
    ret, frame = cap.read()
    #Si el dispositivo no admite el cambio de resolucion con set (ej: rtsp), cambiar la resolucion manualmente
    if (int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) != resWidth and int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) != resHeight):
        frame = cv2.resize(frame, (resWidth, resHeight))#Tamaño de entrada (debe coincidir con la redimension dentro del while)
    q.put(frame)
    while ret:
        ret, frame = cap.read()
        if not ret:
            #Intentar una reconexion
            cap.release()
            cap = cv2.VideoCapture(camLink)
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  #Cantidad de fotogramas que se almacenaran en el buffer
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, resWidth)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, resHeight)
            continue

        #Poner los fps del stream en la imagen a enviar
        fps = cap.get(cv2.CAP_PROP_FPS)
        fpsStream = fps

        #FPS del stream
        cv2.putText(frame, f'FPS: {fps}', (30, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, [0,0,0], 2)

        ##Redimensionar el frame si no cumple con la resolucion deseada
        if (int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) != resWidth and int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) != resHeight):
            frame = cv2.resize(frame, (resWidth, resHeight))
        
        #Enviar los frames a displayFrames()
        q.put(frame)
    
    #Liberar recursos de VideoCapture cuando termine el bucle
    cap.release()  

def displayFrames():
    global metricsAPI, personIdCounter, activePersonIds,frameCount
    while True:
        if q.empty() !=True:
            frame=q.get()#Recibir los frames de "receiveStream"

            #region procesar frames en yolo
            #Para no amuentar la carga de la cpu, solo procesar x frames por segundos
            #Se hace aqui y no en receiveStream por 2 ventajas: 1.- si el stream se atrasa se adelantara automaticamente por que la latencia es normal alli 2.-Reduce la carga de la cpu (por que aunque no hayan nuevos frames seguira procesando)
            frameCount+=1
            if frameCount % (fpsStream // fpsTarget) != 0:
                continue
            frameCount = 0
            
            #Resetear metricas
            metrics["totalPeople"] = 0
            metrics["stateCounts"] = {key: 0 for key in metrics["stateCounts"]}
            metrics["Ids"] = {}
            
            #Mover el frame a GPU/CPU
            #frameTensor = torch.from_numpy(frame).to(device)

            # deteccion de objetos de YOLO
            results = yoloModel.track(frame, persist=True, classes=0)#track y persist=True para asignar id a lo identificado, classes=0 para personas
            metrics["STATUS"] = sum(1 for det in results[0].boxes if det.cls[0] == 0)
            #Contar personas detectadas (para comprobar que la suma de los estados es correcta)
            metrics["totalPeople"] = sum(1 for det in results[0].boxes if det.cls[0] == 0)
            if results and len(results[0].boxes) > 0:
                personDetected = False #Verificador de personas por frame
                for detection in results[0].boxes:
                    #Filtro de confianza (para detectar objetos, yolo)
                    #detection.conf.cpu().numpy() > X | import numpy
                    #Limitar la deteccion solamente a personas
                    #if detection.cls[0] == 0:#la id 0 es para personas (id de yolo)
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
                                #Si no cumplio el umbral de confianza, continuar al siguiente frame y no dibujar el boundbox
                                continue
                                #engagement_state = "Engaged"

                            #Agregar el contador de estado
                            metrics["stateCounts"][engagement_state] += 1
                            #Agregar los ids al json
                            metrics["Ids"][trackID] = round(predictedProbabilities*100)#Temporalmente agrego el porcentaje de probabilidad

                            #Seleccionar el color correspondiente
                            color = colorList.get(engagement_state, (255, 255, 255))  # Blanco por defecto si no se encuentra

                            #Bound box
                            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

                            #Texto de estado + % de probabilidad
                            cv2.putText(frame, f'ID: {trackID} | {engagement_state} %{round(predictedProbabilities*100)}', (x1, y1 - 10), 
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
                                
                                

                #Si no hay personas en la imagen, resetear ID
                if not personDetected:
                    resetIDCounter()
            else:
                #Si no hay resultados o boxes (aunque este no filtra por personas)
                resetIDCounter()
            
            #endregion

            #region Enviar los frames a la pantalla

            #Convertir el frame a jpg
            ret, buffer = cv2.imencode('.jpg', frame)
            if not ret:
                continue
            
            #Actualizar las metricas solo cuando se haya terminado de procesar el frame
            metricsAPI = copy.deepcopy(metrics)

            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                            b'Content-Type:image/jpeg\r\n'
                            b'Content-Length: ' + f"{len(frame)}".encode() + b'\r\n'
                            b'\r\n' + frame + b'\r\n')
            #endregion

#Ruta del video en stream
@app.route('/video_feed')
def video_feed():
    return Response(displayFrames(),
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
    p1=threading.Thread(target=receiveStream)
    p2 = threading.Thread(target=displayFrames)
    p1.daemon = True#Los hilos terminaran cuando la funcion principal (flask) termine
    p2.daemon = True
    p1.start()
    p2.start()
    app.run(host='127.0.0.1', port=5001, debug=False)
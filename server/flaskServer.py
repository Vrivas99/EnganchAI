#Librerias
from flask import Flask, Response, jsonify, request
import cv2
import numpy as np
import tensorflow as tf
from tensorflow.python.client import device_lib#Importar Usos de CUDA
from ultralytics import YOLO
import copy#Para copiar las metricas
from collections import defaultdict#Para almacenar las id's
import threading#Se usa hilos para levantar cada funcion (o si no el servidor de flask se saturara)
import queue#Crear queue para pasar los frames entre multiprocesos

q=queue.Queue(maxsize=1)#procesStream()
q2=queue.Queue(maxsize=2)#displayStream()


app = Flask(__name__)

# Definir colores para cada estado de engagement (BGR)
colorList = {
    "Engaged": (246, 130, 59),  #Celeste
    "Frustrated": (68, 68, 239),   #Rojo
    "Confused": (22, 115, 249),   #Naranjo
    "Bored": (160, 112, 148)     #Lila/Morado
}

#Metricas
metrics = {} #Metricas locales, se modificaran aqui (flask); Se va definiendo en displayFrames() ya que de todas formas se tendria que vaciar el json en cada iteracion
metricsAPI = {}#Metricas que se enviaran al frontend, copiara el contenido de "metrics" cuando se termine de procesar el frame

#DAISEE
daiseeLabels = ["Frustrated", "Confused", "Bored", "Engaged"]
minConfidence = 0.0#0.3#umbral minimo de confianza
#Cargar modelos
#Verificar la existencia de una GPU para usar cuda
def isCudaAvailable():
    localDeviceProtos = device_lib.list_local_devices()
    return any(device.device_type == 'GPU' for device in localDeviceProtos)
#Cargar modelo de Engagement
engagementModelName = None#"modelo_cnn_knn.h5"
engagementModel = None#Modelo cnn que se cargara segun "engagementModelName"
#Cargarlo en gpu o cpu (si no es None)
if engagementModelName != None:
    if isCudaAvailable():
        print("CUDA disponible, cargado modelo en GPU")
        with tf.device('/GPU:0'):
            engagementModel = tf.keras.models.load_model(engagementModelName)
            #engagementModel = tf.saved_model.load(engagementModelName)
    else:
        print("CUDA no esta disponible, cargado modelo en CPU")
        engagementModel = tf.keras.models.load_model(engagementModelName)


#Cargar modelo de YOLO
yoloModel = YOLO('best.pt')#yolov8n-face.pt # #Modelo yolo, cambiar a yolov8n-face.pt si solo se quiere detectar rostros
#device = 'cuda' if torch.cuda.is_available() else 'cpu' #Cargar el modelo en la GPU si esta disponible (SOLO SI ESTA CUDA, SI NO DARA ERROR)
yoloModel = yoloModel.to('cpu')#device

#Contador de ID's personalizado (yolo no reutiliza id, por lo que iran escalando con la transmision)
personIdCounter = 1
activePersonIds = {}#Relación entre yoloTrackID y customPersonID

#Datos de la Transmision
camLink = ""
cap = None
processVideo = False#Determina si el video se procesara o no (SI SOLO SE LEVANTARA EL SERVIDOR, DEBE ESTAR EN TRUE)
#Reducir la carga de la CPU haciendo ajustes en la transmision
fpsTarget = 24#Cantidad de fps que se quiere procesar
frameCount = 0
fpsStream = 0#FPS de la transmision

#Resolucion del stream
resWidth = 1920
resHeight = 1080
#Pasar datos entre process y display stream
dataStream = []
proNextFrame = True#Intenta poner al dia a procesStream

#Print auxiliares, indican la version de tensorflow y la cantidad de gpus disponibles (sirve para saber si cuda esta disponible)
print("Tf version=",tf.__version__)
print("Num GPUs Available=", len(tf.config.list_physical_devices('GPU')))

#Limpiar el contador de ID cuando no se detecten mas personas en un frame
def resetIDCounter():
    global personIdCounter, activePersonIds
    personIdCounter = 1
    activePersonIds = {}

#Inicia/reinicia una transmision de opencv2
def initCV2(Release = False):
    global cap
    #Reinicir una transmision
    if Release:
        cap.release()

    cap = cv2.VideoCapture(camLink)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  #Cantidad de fotogramas que se almacenaran en el buffer
    #Intenta cambiar la resolucion desde la fuente de video (algunos dispositivos pueden no permitir un cambio en la resolucion)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, resWidth)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, resHeight)

#Dibujar texto y un fondo en la imagen (para ID y engagement)
def drawCv2Text(img, text, pos=(0,0), font=cv2.FONT_HERSHEY_SIMPLEX, fontScale=0.5, colorRect=(0,0,0),colorText=(255,255,255), fontThick=1):
    x, y = pos
    textSize = cv2.getTextSize(text, font, fontScale, fontThick)[0]
    textW, textH = textSize
    cv2.rectangle(img, (x,y), (x + textW, y + textH), colorRect, -1)
    cv2.putText(img, text, (x, int(y + textH + fontScale - 1)), font, fontScale, colorText, fontThick)
    return textSize

#Recibir transmision desde la camara y enviarla a displayFrames
def receiveStream():
    global frameCount, fpsStream, proNextFrame, cap
    
    while True:#Evita que el Thread finalice
        if not processVideo:#Dejar de recibir video si no se esta procesando
            if cap:
                cap.release()
                q.empty()
                q2.empty()
            continue
        
        #Antes de iniciar cualquier transmision, cap es None
        if cap == None:
            initCV2()
        
        ret, frame = cap.read()
        if not ret:
            print("receiveStream() not RET")
            #Intentar una reconexion
            initCV2(True)
            continue

        ##Redimensionar el frame si no cumple con la resolucion deseada
        if (int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) != resWidth and int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) != resHeight):
            frame = cv2.resize(frame, (resWidth, resHeight))
        
        #Enviar los frames a...
        if proNextFrame and not q.full():#Solo analiza el ultimo frame recibido despues de que yolo haya analizado el anterior
            q.put_nowait(frame)#procesStream()
            proNextFrame = False

        q2.put(frame)#displayStream()

#Debido a las pruebas del modelo, fuimos utilizando diferentes variantes, esta funcion permite cambiar entre cada una rapidamente (keras o yolo pre-entrenado)
def modelProcess(mode=0,detection=None,frame=None,cords=None):
    returnData =[]#Devuelve el estado de engagement y las probabilidades de cada uno

    match(mode):
        case 0:#Utilizando yolo+modelo keras
            #Es mas entendible definir las coordenadas en variables
            x1 = cords[0]
            y1 = cords[1]
            x2 = cords[2]
            y2 = cords[3]

            if frame == None:
                return False

            face = frame[y1:y2, x1:x2]
            #Prediccion con un modelo keras (.h5,.keras)
            if face.size == 0:#Si el tamaño de algun rostro detectado es 0, saltar al siguiente frame
                return False#Return false es equivalente a continue, ver en procesStream()

            #Se redimensiona los frames al shape requerido por el modelo keras (depende de lo establecido en el entrenamiento)
            faceResized = cv2.resize(face, (224, 224))
            faceArray = np.expand_dims(faceResized, axis=0) / 255.0

            #Prediccion de estado
            if isCudaAvailable():
                with tf.device('/GPU:0'):
                    engagementPrediction = engagementModel.predict(faceArray)
            else:
                engagementPrediction = engagementModel.predict(faceArray)

            if engagementPrediction.ndim == 2 and engagementPrediction.shape[1] == len(daiseeLabels):
                predictedIndex = np.argmax(engagementPrediction[0])#[0] por que engagementPrediction es un array doble [[x,x,x,x]]
                predictedProbabilities = engagementPrediction[0][predictedIndex]#Extraer las probabilidades

                #Asignar un estado dependiendo del umbral de confianza (si el % de confianza de la prediccion es menor al minimo, se detectara por defecto "Engaged"")
                if predictedProbabilities >= minConfidence:
                    engagementState = daiseeLabels[predictedIndex]
                else:
                    #Si no cumplio el umbral de confianza, continuar al siguiente frame y no dibujar el boundbox
                    return False#Return false es equivalente a continue, ver en procesStream()
                    
                #Obtener los estados resagados (deprecado, pero lo dejo por si acaso)
                #otherIndex = [i for i in range(len(daiseeLabels)) if i != predictedIndex]
                #otherLabels = [(daiseeLabels[i], engagementPrediction[0][i]) for i in otherIndex]

                returnData.append(engagementState)#Estado
                returnData.append(round(predictedProbabilities*100))#Confianza, es un decimal, se transforma directamente a porcentual
                return returnData

        case 1:#Utilizando solamente yolo
            engagementName = ""
            predictedProbabilities = detection.conf[0].item()
            #Si las confiabilidd es menor al minimo, return False
            if predictedProbabilities < minConfidence:
                return False

            match(detection.cls[0].item()):
                case 0:#Attentive
                    engagementName = daiseeLabels[3]#Engaged
                case 1:#Distracted
                    engagementName = daiseeLabels[0]#Frustrated
                case 2:#Sleepy
                    engagementName = daiseeLabels[2]#Bored
            
            if engagementName != "":
                returnData.append(engagementName)#Estado
                returnData.append(round(predictedProbabilities*100))#Confianza, es un decimal, se transforma directamente a porcentual
                return returnData
        
    #si llega a este punto sin un "return returnData", significa que no se pudo procesar el frame... continue
    return False

#Procesar los frames de receive Stream
def procesStream():
    global metricsAPI, personIdCounter, activePersonIds, frameCount, dataStream, proNextFrame
    while True:#Evita que el Thread finalice
        while processVideo:
            if q.empty() !=True:
                frame=q.get()#Recibir los frames de "receiveStream"
                print("PS get frame")
                frameCount = 0
                
                #Establecer metricas locales
                metrics["totalPeople"] = 0
                metrics["stateCounts"] = {"Frustrated": 0, "Confused": 0, "Bored": 0, "Engaged": 0}
                metrics["Ids"] = {}
                
                #Crear un data temporal para actualizar solo cuando este listo
                tempData = []
                # deteccion de objetos de YOLO
                results = yoloModel.track(frame, persist=True)#track y persist=True para asignar id a lo identificado

                #Resultados de Yolo
                if results and len(results[0].boxes) > 0:
                    #Se resetea el contador de IDs
                    resetIDCounter()
                    for detection in results[0].boxes:
                        if detection.id is not None:
                            #personDetected = True#Persona detectada
                            yoloTrackID = int(detection.id.item())

                            #Si el iD de yolo no esta en mi variable customisada, asignar una
                            if yoloTrackID not in activePersonIds:
                                activePersonIds[yoloTrackID] = personIdCounter
                                personIdCounter += 1

                            #Obtenemos el ID personalizado de la persona
                            trackID = activePersonIds[yoloTrackID]

                            #Coordenadas para el boundbox
                            x1, y1, x2, y2 = map(int, detection.xyxy[0])

                            #Procesamiento dependiendo del modelo
                            processReturn = modelProcess(1,detection,frame,[x1,y1,x2,y2])

                            #Si modelProcess() devuelve false, procesar el siguiente frame
                            if processReturn == False:
                                continue

                            engagementState = processReturn[0]
                            predictedProbabilities = processReturn[1]

                            #Agregar el contador de estado para metricas
                            metrics["stateCounts"][engagementState] += 1
                            #Agregar los ids al json
                            metrics["Ids"][trackID] = {}#Establecer formato
                            metrics["Ids"][trackID]["confidence"] = predictedProbabilities
                            metrics["Ids"][trackID]["state"] = engagementState

                            #Pasar resultados de cada rostro
                            tempData.append({
                                "trackID":trackID,
                                "x1": x1,
                                "y1": y1,
                                "x2": x2,
                                "y2": y2,
                                "engagementState": engagementState,
                                "predictedProbabilities": predictedProbabilities#,
                                #"otherLabels": "b"
                            })

                #Contar la cantidad total de personas registradas
                metrics["totalPeople"] = sum(metrics["stateCounts"].values())
                #Actualizar las metricas solo cuando se haya terminado de procesar el frame
                metricsAPI = copy.deepcopy(metrics)
                #Permitir recibir el siguiente frame
                proNextFrame = True
                #Actualizar los resultados de Yolo+CNN para pasarlos a displayStream()
                dataStream = tempData

#Recibir frames de receiveStream y ponerle los boundbox de yolo
def displayStream():
    while True:#Evita que el Thread finalice
        while processVideo:
            if q2.empty() !=True:
                frame=q2.get()#Recibir los frames de "receiveStream"
                #Dibujar resultados de q1 sobre los frames de q2
                for i in range(len(dataStream)):
                    if i >= len(dataStream):
                        print("//////////BREAK PARA EVITAR ERROR//////////")
                        break

                    #Es mas legible crear variables locales que poner todo el listado como argumento
                    engagementState = dataStream[i]["engagementState"]
                    x1 = dataStream[i]["x1"]
                    y1 = dataStream[i]["y1"]
                    x2 = dataStream[i]["x2"]
                    y2 = dataStream[i]["y2"]
                    trackID = dataStream[i]["trackID"]
                    predictedProbabilities = dataStream[i]["predictedProbabilities"]
                    #otherLabels = dataStream[i]["otherLabels"]

                    #Seleccionar el color correspondiente
                    color = colorList.get(engagementState, (255, 255, 255))  # Blanco por defecto si no se encuentra

                    #Bound box
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

                    #Texto de estado + % de probabilidad
                    #cv2.putText(frame, f'ID: {trackID} | {engagementState} %{round(predictedProbabilities*100)}', (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
                    drawCv2Text(frame,f'{trackID} | {engagementState[0:1]} %{predictedProbabilities}',(x1, y1 - 10),cv2.FONT_HERSHEY_SIMPLEX,0.5,color,(0,0,0),1)
                    
                    #Textos de estados resagados (abajo)
                    #drawCv2Text(frame,
                     #   f'{otherLabels[0][0][0:1]} %{round(otherLabels[0][1]*100)}, {otherLabels[1][0][0:1]} %{round(otherLabels[1][1]*100)},{otherLabels[2][0][0:1]} %{round(otherLabels[2][1]*100)}'
                      #  ,(x1, y2),cv2.FONT_HERSHEY_SIMPLEX,0.4,color,(255,255,255),1)

                #region Enviar los frames a la pantalla
                #Convertir el frame a jpg
                ret, buffer = cv2.imencode('.jpg', frame)
                if not ret:
                    continue
                    

                frame = buffer.tobytes()
                yield (b'--frame\r\n'
                                b'Content-Type:image/jpeg\r\n'
                                b'Content-Length: ' + f"{len(frame)}".encode() + b'\r\n'
                                b'\r\n' + frame + b'\r\n')
                #endregion

#Ruta del video en stream
@app.route('/videoFeed')
def video_feed():
    return Response(displayStream(), mimetype='multipart/x-mixed-replace; boundary=--frame')

#Establecer link de la camara
@app.route('/setCamLink', methods=['POST'])
def setCamLink():
    global camLink

    try:
        data = request.get_json()
        tempValue = ""
        tempValue = data.get('camLink')
        
        #Detecta si tempValue es un numero para usarlo como webcam
        if tempValue.isdigit():
            tempValue = int(tempValue)
            
        camLink = tempValue

        print(f"Link de cámara recibido={camLink}")
        if isinstance(camLink, (int, float)):
            print("Link de la camara es webcam")
        return jsonify({"status": "success", "newLink": camLink}), 200
    except (ValueError, TypeError):
        return jsonify({"status": "error", "message": "Invalid value"}), 400

#Enviar las metricas a express
@app.route('/metrics', methods=('GET',))
def getMetrics():
    return jsonify(metricsAPI)

#Ver la confianza
@app.route('/getConfidence', methods=['GET'])
def getConfidence():
    return jsonify(minConfidence)

#Modificar la confianza desde express
@app.route('/setConfidence', methods=['POST'])
def setConfidence():
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

#Para evitar desincronizacion, Iniciar o terminar de procesar un video (y de paso, actualiza la sensibilidad)
@app.route('/setVideoStream', methods=['POST'])
def setProcessVideo():
    global processVideo, minConfidence
    try:
        data = request.get_json()
        newState = bool(data.get('processVideo'))
        newConfidence = float(data.get('minConfidence'))

        processVideo = newState
        #Para evitar errores, asegurarse que el valor este en el rango
        if 0 <= newConfidence <= 1:
            minConfidence = newConfidence
            print("NEW confidence: ",minConfidence)
        else:
            print("No se pudo actualizar la sensibilidad")
        
        if processVideo == True:
            #Al iniciar una transmision, inicio cv2 (asi tambien se reinicia camLink)
            initCV2()

        return jsonify({"status": "success", "newState": processVideo}), 200
    except (ValueError, TypeError):
        return jsonify({"status": "error", "message": "Invalid video state value"}), 400

if __name__ == "__main__":
    #Crear hilos para no sobrecargar un proceso recibiendo y procesando frames
    p1=threading.Thread(target=receiveStream)
    p2=threading.Thread(target=procesStream)
    p3=threading.Thread(target=displayStream)
    p1.daemon = True#Los hilos terminaran cuando la funcion principal (flask) termine
    p2.daemon = True
    p3.daemon = True
    p1.start()
    p2.start()
    p3.start()
    #Abrir servidor de flask
    app.run(host='localhost', port=5001, debug=False)
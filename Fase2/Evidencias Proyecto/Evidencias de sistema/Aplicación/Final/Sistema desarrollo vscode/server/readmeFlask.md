#Flask Server#
Este servidor de flask utiliza modelos de procesamiento de imagen para analizar una transmisión de cámara en tiempo real para detectar personas
y predecir sus estados de engagement, usando un modelo YOLO y (opcional) un modelo cnn.


#Funcionalidades#
- Detección de rostros: Implementada con Yolo
- Clasificación de estados de engagement: Usando Yolo O un modelo de aprendizaje profundo compatible con Tensorflow
- Procesamiento Optimizado: Utiliza Queue y threads para manejar el procesamiento de video


#Requisitos para desarrollar#
Antes de comenzar, debes tener instalados los siguientes requisitos:
- Python v3.10.9 (versión utilizada para el desarrollo)
- Tensorflow v2.17
- OpenCV v4.10.0.84
- Yolo (Ultralytics) v8.3.13

Puedes instalar todas las dependencias ejecutando el siguiente comando dentro de la ruta Enganchai/server:
pip install -r requirements.txt

(Tenga en cuenta que, si utiliza otra versión de python, deberá cambiar las versiones de las dependencias por una compatible,
además, la versión de tensorflow debe ser equivalente a la versión con la que se entrenó el modelo cnn, en caso de que lo utilice)


#Requisitos de equipo para desarrollo#
-CPU/GPU:
El uso de YOLO y/o el CNN es bastante costoso para el equipo en término de CPU/GPU.
El escenario ideal sería tener una gráfica compatible con CUDA instalada en el equipo, en caso de no tener compatibilidad
con CUDA en el equipo, el procesamiento será mediante la CPU, por lo que sería ideal tener un procesador decente, durante él
desarrollo de este software, se utilizó un procesador "Intel(R) Core(TM) i3-10100F", el cual provocaba algunos retrasos en los
resultados del modelo.

-RAM:
Se recomienda tener al menos 8GB de RAM durante el desarrollo del software para evitar saturación en la memoria.


#Configuracion#
1. Modelo de YOLO: El modelo YOLO se carga automáticamente  desde la variable 'yoloModel' asignando el nombre del archivo.
Si deseas cambiar el modelo, asegúrate de reemplazarlo en el código:
yoloModel = YOLO('nombreModeloYolo.pt')

2. Modelo de Engagement (Opcional): El servidor, como se mencionó anteriormente, puede funcionar de 2 formas, utilizando un
modelo de YOLO para detectar tanto los rostros como los estados de engagement (el modelo debe estar preentrenado para ese propósito),
o utilizando un modelo de Yolo normal (ejemplo Yolo v8), en conjunto con un modelo CNN entrenado en Keras.
El servidor utiliza la función modelProcess() que se llama dentro de procesStream() para definir si se utiliza solamente un modelo YOLO (mode=1), o
un modelo Yolo en conjunto con un modelo CNN (mode=0):
    
    2.1 Si utiliza un modelo YOLO para ambos propósitos, debe asegurarse de que la variable "engagementModelName" esté definida como "None", 
    en caso contrario, se intentará cargar automáticamente el modelo desde los archivos del proyecto (y si no se encuentra el servidor dará error).
    También, debe asegurarse de que, la línea "processReturn = modelProcess" ubicada en la función "procesStream()"
    tenga su primer argumento como "1", ya que así solo se utilizara Yolo para procesar ambos resultados

    2.2 Si utiliza un modelo YOLO para el reconocimiento facial y un modelo CNN para la asignación de engagement, debe asegurarse de que la variable "engagementModelName"
    tenga el nombre del archivo .h5 o .keras que se ubica en carpeta del servidor (engagementModelName = "modeloCNN.h5").
    También, debe asegurarse de que, la línea "processReturn = modelProcess" ubicada en la función "procesStream()"
    tenga su primer argumento como "0", ya que así utilizara ambos modelos, uno para cada propósito (YOLO para reconocimiento de imagen, CNN para asignación de estado)


#USO#
1. Inicia el servidor utilizando el siguiente comando en la ruta Enganchai/server:
python flaskSever.py

Cuando el servidor esté en funcionamiento, podrás ver un mensaje similar a este en la consola:
Tf version=x.x.x
Num GPUs Available=x

2. API
El servidor expone 2 endpoints principales:
- /videoFeed: Devuelve la transmision procesada (que sera consumida por el servidor de express)
- /metrics: Devuelve las métricas del último frame procesado en formato JSON, incluyendo la distribución de estados de engagement y el número total de personas


#Personalizacion#
- Colores de los estados de engagement: Se pueden cambiar los colores de las etiquetas editando el diccionario "colorList" en el código, este
diccionario utiliza BGR (no RGB) para asignar los colores, pues es el formato utilizado por openCV
- Puedes ajustar la resolución de la transmisión devuelta ajustando las siguientes variables:
    - resWidth
    - resHeight


#Notas#
- Si no tienes una GPU compatible con cuda, el servidor funcionará en CPU con un menor rendimiento
- Para cambiar entre usos de modelos de clasificación, modifica la función modelProcess (Como está indicado en la sección USO)
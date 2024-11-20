#Flask Server#
Este servidor de flask utiliza modelos de procesamiento de imagen para analizar una transmision de camara en tiempo real para detectar personas
y predecir sus estados de engagement, usando un modelo YOLO y (opcional) un modelo cnn.


#Funcionalidades#
- Deteccion de rostros: Implementada con Yolo
- Clasificacion de estados de engagement: Usando Yolo O un modelo de aprendizaje profundo compatble con Tensorflow
- Procesamiento Optimizado: Utiliza Queue y threads para manejar el procesamiento de video


#Requisitos para desarrollar#
Antes de comenzar, debes tener instalados los siguientes requisitos:
- Python v3.10.9 (version utilizada para el desarrollo)
- Tensorflow v2.17
- OpenCV v4.10.0.84
- Yolo (Ultralytics) v8.3.13

Puedes instalar todas las dependencias ejecutando el siguiente comando dentro de la ruta Enganchai/server:
pip install -r requirements.txt

(Tenga en cuenta que, si utiliza otra version de python, debera cambiar las versiones de las dependencias por una compatible,
ademas, la version de tensorflow debe ser equivalente a la version con la que se entreno el modelo cnn, en caso que lo utilice)


#Configuracion#
1. Modelo de YOLO: El modelo YOLO se carga automaticamente  desde la variable 'yoloModel' asignando el nombre del archivo.
Si deseas cambiar el modelo, asegurate de reemplazarlo en el codigo:
yoloModel = YOLO('nombreModeloYolo.pt')

2. Modelo de Engagement (Opcional): El servidor, como se menciono anteriormente, puede funcionar de 2 formas, utilizando un
modelo de YOLO para detectar tanto los rostros como los estados de engagement (el modelo debe estar pre-entrenado para ese proposito),
o utilizando un modelo de Yolo normal (ejemplo Yolo v8), en conjunto con un modelo CNN entrenado en Keras.
El servidor utiliza la funcion modelProcess() que se llama dentro de procesStream() para definir si se utiliza solamente un modelo YOLO (mode=1), o
un modelo Yolo en conjunto con un modelo CNN (mode=0):
    
    2.1 Si utiliza un modelo YOLO para ambos propositos, debe asegurarse de que la variable "engagementModelName" este definida como "None", 
    en caso contrario, se intentara cargar automaticamente el modelo desde los archivos del proyecto (y si no se encuentra el servidor dara error).
    Tambien, debe asegurarse de que, la linea "processReturn = modelProcess" ubicada en la funcion "procesStream()"
    tenga su primer argumento como "1", ya que asi solo se utilizara Yolo para procesar ambos resultados

    2.2 Si utiliza un modelo YOLO para el reconocimiento facial y un modelo CNN para la asignacion de engagement, debe asegurarse de que la variable "engagementModelName"
    tenga el nombre del archivo .h5 o .keras que se ubica en carpeta del servidor (engagementModelName = "modeloCNN.h5").
    Tambien, debe asegurarse de que, la linea "processReturn = modelProcess" ubicada en la funcion "procesStream()"
    tenga su primer argumento como "0", ya que asi utilizara ambos modelos, uno para cada proposito (YOLO para reconocimiento de imagen, CNN para asignacion de estado)


#USO#
1. Inicia el servidor utilizando el siguiente comando en la ruta Enganchai/server:
python flaskSever.py

Cuando el servidor este en funcionamiento prodras ver un mensaje similara a este en la consola:
Tf version=x.x.x
Num GPUs Available=x

2. API
El servidor expone 2 endpoints principales:
- /videoFeed: Devuelve la transmision procesada (que sera consumida por el servidor de express)
- /metrics: Devuelve las metricas del ultimo frames procesado en formato JSON, incluyendo la distribucion de estados de engagement y el numero total de personas


#Personalizacion#
- Colores de los estados de engagement: Se pueden cambiar los colores de las etiquetas editando el diccionario "colorList" en el codigo, este
diccionario utiliza BGR (no RGB) para asignar los colores, pues es el formato utilizado por openCV
- Puedes ajustar la resolucion de la transmision devuelta ajustando las siguientes variables:
    - resWidth
    - resHeight


#Notas#
- Si no tienes una GPU compatible con cuda, el servidor funcionara en CPU con un menor rendimiento
- Para cambiar entre usos de modelos de clasificacion, modifica la funcion modelProcess (Como esta indicado en la seccion USO)
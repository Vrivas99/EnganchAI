# -*- coding: utf-8 -*-
"""yolov11.ipynb

Automatically generated by Colab.

Original file is located at
    https://colab.research.google.com/drive/1vFt2RIr4pj_1_j2PnbHNuolI455xvvZv

Gdrive
"""

from google.colab import drive
drive.mount('/content/drive')

import os
os.chdir('/content/drive/MyDrive/yolothis')

import zipfile
descomprimir_si = False
if descomprimir_si != False:
  zip_file = 'newDatasetFinal.zip'
  output_folder = '/content/drive/MyDrive/yolothis/final_unzipped'
  with zipfile.ZipFile(zip_file, 'r') as zip_ref:
    zip_ref.extractall(output_folder)

no_yolo_dependency = True
if no_yolo_dependency != False:
  !pip install ultralytics

from ultralytics import YOLO
# Cargar el modelo preentrenado YOLOv8 (también puede ser 'yolov8m.pt' o 'yolov8l.pt' para otros tamaños)
reanudar = True
if reanudar == True:
  reanudar = YOLO('/content/drive/MyDrive/yolothis/yolo_checkpoints/my_yolov11_cls_model_3002/weights/last.pt')  # Cargar desde el último checkpoint
  # Iniciar el entrenamiento
  reanudar.train(
      data='/content/drive/MyDrive/yolothis/datasets/final_unzipped/newDatasetFinal',  # Ruta al archivo data.yaml
      epochs=300,         # Número de épocas para el entrenamiento
      imgsz=640,         # Tamaño de las imágenes (puedes ajustarlo si tienes problemas de memoria)
      batch=16,          # Tamaño del batch
      workers=4,          # Número de workers para el preprocesamiento
      augment=True,  # Habilitar augmentaciones
      flipud=0,  # Deshabilitar flip vertical (si lo deseas)
      fliplr=1.0,  # Habilitar flip horizontal
      scale=(0.8),  # Zoom entre 80% y 120%
      shear=10,  # Shear horizontal y vertical máximo de ±10°
      name='/content/drive/MyDrive/yolothis/yolo_checkpoints/my_yolov11_cls_model_300',  # Guardar los checkpoints en Drive
      save_period=5,  # Guardar checkpoint cada 5 épocas
      degrees=10
  )
else:
  model = YOLO('yolo11n-cls.pt')  # 'n' es el modelo más ligero
  # Iniciar el entrenamiento
  model.train(
      data='/content/drive/MyDrive/yolothis/datasets/final_unzipped/newDatasetFinal',  # Ruta al archivo data.yaml
      epochs=300,         # Número de épocas para el entrenamiento
      imgsz=640,         # Tamaño de las imágenes (puedes ajustarlo si tienes problemas de memoria)
      batch=16,          # Tamaño del batch
      workers=4,          # Número de workers para el preprocesamiento
      augment=True,  # Habilitar augmentaciones
      flipud=0,  # Deshabilitar flip vertical (si lo deseas)
      fliplr=1.0,  # Habilitar flip horizontal
      scale=(0.8),  # Zoom entre 80% y 120%
      shear=10,  # Shear horizontal y vertical máximo de ±10°
      name='/content/drive/MyDrive/yolothis/yolo_checkpoints/my_yolov11_cls_model_300',  # Guardar los checkpoints en Drive
      save_period=5,  # Guardar checkpoint cada 5 épocas
      degrees=10
  )
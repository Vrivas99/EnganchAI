import os
import pandas as pd
from PIL import Image

"""
Este script se utiliza una vez se hayan extraido los frames de c/video , basicamente cuando ya se extrajeron los 
frames de cada video debemos mapear estos frames a los respectivos labels para el csv de entrenamiento que indican
el video de donde se extrajeron los frames (solo que en vez de buscar el video buscamos el frame respectivos). 
"""

# Ocupar Absolute Path para trabajar desde root del dataset
# Apuntar al mapeo que queremos ejemplo [Train folder, Train CSV] <-> [Test folder, Test CSV]
metadata_path = os.path.expanduser('~/engagement_model_folder/lib/daisee/DAiSEE/Labels/TrainLabels.csv')
dataset_folder = os.path.expanduser('~/engagement_model_folder/lib/daisee/DAiSEE/DataSet/Train')

# Cargar Labels con pandas
metadata = pd.read_csv(metadata_path)
# El csv original viene con " e s p a c i o s " basicamente esto arregla un problema en que
# algunos registros tienen columna N/A en frustration.
metadata.columns = metadata.columns.str.strip()

# Ver Labels para comprobar que es el archivo correcto
print(metadata.head())

# Quitar extension de archivo 
def remove_extension(filename):
    return os.path.splitext(filename)[0]


# Recorremos el csv asociando 
for idx, row in metadata.iterrows():
    clip_id = remove_extension(row['ClipID']) # Esto quita extensiones .avi .mp4 etc...
    labels = {
        'Boredom': row.get('Boredom', 'N/A'),
        'Engagement': row.get('Engagement', 'N/A'),
        'Confusion': row.get('Confusion', 'N/A'),
        'Frustration': row.get('Frustration', 'N/A')
    }

    # Construimos paths a la carpeta que buscamos segun el registro csv
    folder_path = os.path.join(dataset_folder, clip_id[:6], clip_id)

    # Debugging: Print the constructed folder path
    # print(f"Checking folder path: {folder_path}")

    if os.path.exists(folder_path):
        # List all jpg files in the folder
        image_files = [f for f in os.listdir(folder_path) if f.endswith('.jpg')]
        
        if not image_files:
            print(f"No .jpg files found in {folder_path}")  # Debug print
            
        for image_file in image_files:
            file_path = os.path.join(folder_path, image_file)
            
            try:
                with Image.open(file_path) as img:

                    #Example: Print image size and label
                    print(f"Processing image: {file_path}")
                    print(f"Size: {img.size}, Labels - {labels}")
                    
                    # Here you can save labels with images or use them directly for training
                    # e.g., save images and their labels into a format suitable for your ML framework
                    
            except Exception as e:
                print(f"Error processing image {file_path}: {e}")
    else:
        print(f"Folder missing for {clip_id}")

    #print(f"Expecting folder path: {folder_path}")
    parent_folder = os.path.dirname(folder_path)
    #print(f"Directory contents: {os.listdir(parent_folder) if os.path.exists(parent_folder) else 'Parent folder missing'}")

'''
    - Extrae frames para los videos en las carpetas del dataset
    - Requiere FFMPEG Linux!
    - Debe estar en la misma carpeta al folder DataSet
'''

import os
import subprocess

# Lista directorios en el data folder pero != es para saltar validation que al momento ya habia procesado
dataset = [folder for folder in os.listdir('DataSet/') if folder != 'Validation']

def split_video(video_file, image_name_prefix, destination_path):
    return subprocess.check_output('ffmpeg -i "' + destination_path + video_file + '" ' + image_name_prefix + '%d.jpg -hide_banner', shell=True, cwd=destination_path)

# El resto de aca es original al script que venia con el dataset y es proporcionado por como setup
# Process datasets
for ttv in dataset:
    users = os.listdir('DataSet/' + ttv + '/')
    for user in users:
        currUser = os.listdir('DataSet/' + ttv + '/' + user + '/')
        for extract in currUser:
            clip = os.listdir('DataSet/' + ttv + '/' + user + '/' + extract + '/')[0]
            print(f"Processing {clip[:-4]}")
            path = os.path.abspath('.') + '/DataSet/' + ttv + '/' + user + '/' + extract + '/'
            split_video(clip, clip[:-4], path)

print("================================================================================\n")
print("Frame Extraction Successful (Train and Test datasets)")


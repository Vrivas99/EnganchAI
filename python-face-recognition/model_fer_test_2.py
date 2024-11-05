import cv2
from ultralytics import YOLO
from deepface import DeepFace

# Cargar el modelo YOLOv8
yolo_model = YOLO("yolov8n-face.pt")  # Modelo YOLOv8 preentrenado para rostros

def get_face_bbox(frame):
    results = yolo_model(frame)
    faces_bboxes = []

    for result in results:  # YOLOv8 puede devolver una lista de resultados
        boxes = result.boxes.xyxy.cpu().numpy()
        for box in boxes:
            x_min, y_min, x_max, y_max = map(int, box[:4])
            faces_bboxes.append((x_min, y_min, x_max, y_max))

    return faces_bboxes

def analyze_emotions(face_crop):
    # Analizar el rostro y devolver la lista de emociones
    results = DeepFace.analyze(face_crop, actions=['emotion'], enforce_detection=False)
    print("Resultados de DeepFace:", results)  # Línea de depuración
    return results[0]['emotion']

def infer_custom_emotions(fer_emotions):
    engagement = boredom = confusion = frustration = 0

    # Ajusta las claves según el output que recibas de DeepFace
    if 'happy' in fer_emotions and fer_emotions['happy'] > 0.5:
        engagement = 1
    if 'neutral' in fer_emotions and fer_emotions['neutral'] > 10.10:
        boredom = 1
    if 'surprise' in fer_emotions and (0.3 < fer_emotions['surprise'] < 0.7):
        confusion = 1
    if 'sad' in fer_emotions and fer_emotions['sad'] > 0.3:
        frustration = 1
    if 'angry' in fer_emotions and fer_emotions['angry'] > 0.1:
        frustration = 1
    if 'fear' in fer_emotions and fer_emotions['fear'] > 0.1:
        confusion = 1

    return {
        'Engagement': engagement,
        'Boredom': boredom,
        'Confusion': confusion,
        'Frustration': frustration
    }

def process_frame(frame):
    faces_bboxes = get_face_bbox(frame)

    for (x_min, y_min, x_max, y_max) in faces_bboxes:
        face_crop = frame[y_min:y_max, x_min:x_max]

        if face_crop is not None:
            fer_emotions = analyze_emotions(face_crop)
            custom_emotions = infer_custom_emotions(fer_emotions)

            # Cambiar el color del bounding box dependiendo del valor de Engagement
            if custom_emotions['Engagement'] == 0:
                box_color = (0, 0, 255)  # Rojo si Engagement es 0
            else:
                box_color = (0, 255, 0)  # Verde si Engagement no es 0

            # Dibujar el bounding box
            cv2.rectangle(frame, (x_min, y_min), (x_max, y_max), box_color, 2)

            # Colocar el texto fuera del bounding box
            y_text = y_min - 10  # Ajustar para que el texto esté encima del bounding box
            cv2.putText(frame, f"Engagement: {custom_emotions['Engagement']}", 
                        (x_min, y_text), cv2.FONT_HERSHEY_SIMPLEX, 0.5, box_color, 1)
            cv2.putText(frame, f"Boredom: {custom_emotions['Boredom']}", 
                        (x_max - 100, y_text), cv2.FONT_HERSHEY_SIMPLEX, 0.5, box_color, 1)

            # Colocar el texto de frustración y confusión debajo
            y_text_below = y_max + 20  # Ajustar para que el texto esté debajo del bounding box
            cv2.putText(frame, f"Frustration: {custom_emotions['Frustration']}", 
                        (x_min, y_text_below), cv2.FONT_HERSHEY_SIMPLEX, 0.5, box_color, 1)
            cv2.putText(frame, f"Confusion: {custom_emotions['Confusion']}", 
                        (x_max - 100, y_text_below), cv2.FONT_HERSHEY_SIMPLEX, 0.5, box_color, 1)

    return frame

cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    processed_frame = process_frame(frame)
    cv2.imshow('Frame', processed_frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
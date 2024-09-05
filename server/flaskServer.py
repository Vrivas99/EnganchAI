from flask import Flask, Response
import cv2
import numpy as np
import tensorflow as tf
from ultralytics import YOLO

#pip install flask opencv-python-headless tensorflow ultralytics
#Necesita un modelo .h5 que pesa mas del limite de github, descargar para probar

app = Flask(__name__)

daisee_labels = ["Frustrated", "Confused", "Bored", "Engaged"]
engagement_model = tf.keras.models.load_model("modelo_cnn_knn.h5")
face_model = YOLO('yolov8n.pt')

cap = cv2.VideoCapture("http://162.191.81.11:81/cgi-bin/mjpeg?resolution=800x600&quality=1&page=1725548701621&Language=11")

if not cap.isOpened():
    raise Exception("Error: Could not open video stream.")

def generate_frames():
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Face detection
        results = face_model(frame)
        if results and len(results[0].boxes) > 0:
            for detection in results[0].boxes:
                x1, y1, x2, y2 = map(int, detection.xyxy[0])
                face = frame[y1:y2, x1:x2]
                if face.size == 0:
                    continue

                face_resized = cv2.resize(face, (224, 224))
                face_array = np.expand_dims(face_resized, axis=0) / 255.0
                engagement_prediction = engagement_model.predict(face_array)

                if engagement_prediction.ndim == 2 and engagement_prediction.shape[1] == len(daisee_labels):
                    predicted_index = np.argmax(engagement_prediction)
                    engagement_state = daisee_labels[predicted_index]
                    cv2.putText(frame, f'Engagement: {engagement_state}', (x1, y1 - 10), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
        
        # Convert the frame to JPEG format
        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue
        
        frame = buffer.tobytes()
        yield (b'--frame\r\n'
                        b'Content-Type:image/jpeg\r\n'
                        b'Content-Length: ' + f"{len(frame)}".encode() + b'\r\n'
                        b'\r\n' + frame + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')
                    #mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001)

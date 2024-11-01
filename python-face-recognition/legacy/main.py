from ultralytics import YOLO
import tensorflow as tf
import cv2
import numpy as np

daisee_labels = ["Frustrated","Confused","Bored","Engaged"]
engagement_model = tf.keras.models.load_model(
    "modelo_cnn_knn.h5", custom_objects=None, compile=True, safe_mode=True
)

face_model = YOLO('yolov8n.pt')

# source = 0 (camera feed)
#results = face_model (source = "http://193.192.223.69:7070/mjpg/1/video.mjpg?camera=1&timestamp=1724954915620"
 #                ,show=True
  #               ,conf=0.4
   #              ,save=False
    #             ,classes=[0,1])

cap = cv2.VideoCapture("http://193.192.223.69:7070/mjpg/1/video.mjpg?camera=1&timestamp=1724954915620")
#cap = cv2.VideoCapture(0)
# Ensure window backend is set
cv2.namedWindow('Video Feed', cv2.WINDOW_NORMAL)
cv2.startWindowThread()

if not cap.isOpened():
    print("Error: Could not open video stream.")
    exit()

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        print("Failed to grab frame.")
        break

    # Face detection
    results = face_model(frame)
    if results and len(results[0].boxes) > 0:
        print(f"Detected {len(results[0].boxes)} faces.")
        for detection in results[0].boxes:
            x1, y1, x2, y2 = map(int, detection.xyxy[0])
            face = frame[y1:y2, x1:x2]
            if face.size == 0:
                print("Detected face is empty.")
                continue
            
            face_resized = cv2.resize(face, (224, 224))
            face_array = np.expand_dims(face_resized, axis=0) / 255.0
            engagement_prediction = engagement_model.predict(face_array)

            # Print engagement prediction
            print(f"Engagement prediction: {engagement_prediction}")

            # Check prediction shape
            if engagement_prediction.ndim == 2 and engagement_prediction.shape[1] == len(daisee_labels):
                predicted_index = np.argmax(engagement_prediction)
                engagement_state = daisee_labels[predicted_index]
                cv2.putText(frame, f'Engagement: {engagement_state}', (x1, y1 - 10), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
            else:
                print("Unexpected engagement prediction shape.")
    else:
        print("No detections found.")
    
    # Display video feed
    cv2.imshow('Video Feed', frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
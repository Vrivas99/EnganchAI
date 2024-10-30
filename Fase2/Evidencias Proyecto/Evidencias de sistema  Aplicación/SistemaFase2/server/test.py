import cv2
from ultralytics import YOLO

# Load the trained YOLOv11 model
model = YOLO('best_model.pt')
model = model.to('cpu')#device
# Set up the webcam feed
cap = cv2.VideoCapture("TestVideos/4.mp4")  # 0 is the default camera

while True:
    # Capture frame-by-frame
    ret, frame = cap.read()
    if not ret:
        print("Failed to grab frame")
        break

    # Perform inference
    results = model(frame)

    print("len results: ", len(results[0].boxes))
    # Access the results
    for result in results:
        boxes = result.boxes  # Extract the bounding boxes

        for box in boxes:
            # Extract the box's coordinates
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()  # Bounding box coordinates
            
            # Extract class ID and confidence score
            class_id = int(box.cls[0])  # Class ID
            confidence = box.conf[0].cpu().numpy()  # Confidence score

            # You can print or display the information
            print(f'Class ID: {class_id}, Confidence: {confidence}')
            print(f'Bounding Box: ({x1}, {y1}, {x2}, {y2})')

            # Draw the bounding box and class ID on the frame
            cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (255, 0, 0), 2)
            cv2.putText(frame, f'ID: {class_id}', (int(x1), int(y1) - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 0, 0), 2)

    # Render the results on the frame
    frame_with_boxes = results[0].plot()  # Draw bounding boxes and labels on the frame

    # Display the resulting frame
    cv2.imshow('YOLOv11 Inference', frame_with_boxes)

    # Exit on 'q' key press
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# When everything is done, release the capture
cap.release()
cv2.destroyAllWindows()
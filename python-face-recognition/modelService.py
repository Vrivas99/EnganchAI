from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
import numpy as np
from PIL import Image
import io
import concurrent.futures

# Inicializar la aplicación Flask
app = Flask(__name__)

# Directorios de los modelos
engagement_model_path = 'Engagement.keras'
boredom_model_path = 'Boredom.keras'
confusion_model_path = 'Confusion.keras'
frustration_model_path = 'Frustration.keras'

# Cargar los modelos
engagement_model = load_model(engagement_model_path)
boredom_model = load_model(boredom_model_path)
confusion_model = load_model(confusion_model_path)
frustration_model = load_model(frustration_model_path)

models = [engagement_model, boredom_model, confusion_model, frustration_model]

# Preprocesar el frame 
def preprocess_frame(image):
    # Redimensionar la imagen a 224x224
    image = image.resize((224, 224))

    # Convertir la imagen a un array numpy
    frame = np.array(image)

    # Normalizar la imagen
    frame = frame.astype('float32') / 255.0  # Normalizar entre 0 y 1
    frame = np.expand_dims(frame, axis=0)  # Añadir la dimensión del batch
    return frame

# Función que hace la predicción con un modelo
def make_prediction(model, preprocessed_frame):
    return model.predict(preprocessed_frame)

# Función para hacer las predicciones de manera paralela
def predict_with_models(models, preprocessed_frame):
    with concurrent.futures.ThreadPoolExecutor() as executor:
        predictions = list(executor.map(lambda model: make_prediction(model, preprocessed_frame), models))
    return predictions

# Ruta para recibir la imagen y devolver predicciones
@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    image_file = request.files['image']
    
    # Convertir la imagen de binario a un objeto PIL
    image = Image.open(io.BytesIO(image_file.read()))

    # Preprocesar la imagen
    preprocessed_frame = preprocess_frame(image)

    # Realizar predicciones con los modelos
    predictions = predict_with_models(models, preprocessed_frame)

    # Asignar las predicciones
    engagement_pred, boredom_pred, confusion_pred, frustration_pred = predictions

    # Crear un diccionario con las predicciones y las confianzas
    prediction_result = {
        'Engagement': {
            'predicted_class': int(engagement_pred[0].argmax()),
            'confidence': float(engagement_pred[0][engagement_pred[0].argmax()])
        },
        'Boredom': {
            'predicted_class': int(boredom_pred[0].argmax()),
            'confidence': float(boredom_pred[0][boredom_pred[0].argmax()])
        },
        'Confusion': {
            'predicted_class': int(confusion_pred[0].argmax()),
            'confidence': float(confusion_pred[0][confusion_pred[0].argmax()])
        },
        'Frustration': {
            'predicted_class': int(frustration_pred[0].argmax()),
            'confidence': float(frustration_pred[0][frustration_pred[0].argmax()])
        }
    }

    # Devolver las predicciones en formato JSON
    return jsonify(prediction_result)

if __name__ == '__main__':
    app.run(debug=True)

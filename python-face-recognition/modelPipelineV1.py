from tensorflow.keras.models import load_model
import numpy as np
from PIL import Image
import concurrent.futures

# Directorios de los modelos
engagement_model_path = 'Engagement.keras'
boredom_model_path = 'Boredom.keras'
confusion_model_path = 'Confusion.keras'
frustration_model_path = 'Frustration.keras'

engagement_model = load_model(engagement_model_path)
boredom_model = load_model(boredom_model_path)
confusion_model = load_model(confusion_model_path)
frustration_model = load_model(frustration_model_path)

# Lista de modelos que tienes 
models = [engagement_model, boredom_model, confusion_model, frustration_model]

# Preprocesar el frame
def preprocess_frame(image_path):
    # Cargar la imagen desde el archivo
    image = Image.open(image_path)

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
    try:
        return model.predict(preprocessed_frame)
    except Exception as e:
        print(f"Error al predecir con el modelo: {e}")
        return None

# Función para hacer las predicciones de manera paralela
def predict_with_models(models, preprocessed_frame):
    with concurrent.futures.ThreadPoolExecutor() as executor:
        # Crear una lista de predicciones paralelizadas
        predictions = list(executor.map(lambda model: make_prediction(model, preprocessed_frame), models))
    
    return predictions

# Supongamos que tenemos un frame que ya fue capturado kekw
frame_path = 'prueba.jpg'  # Aquí va tu imagen/frame

# Preprocesar el frame
preprocessed_frame = preprocess_frame(frame_path)
# Realizar las predicciones con los modelos en paralelo
predictions = predict_with_models(models, preprocessed_frame)

# Asignar cada predicción a la etiqueta correspondiente
engagement_pred, boredom_pred, confusion_pred, frustration_pred = predictions

# Combinar predicciones en un diccionario para mayor claridad
predictions = {
    'Engagement': engagement_pred[0].argmax(),  # Por ejemplo, si es softmax, esto devuelve la clase
    'Boredom': boredom_pred[0].argmax(),
    'Confusion': confusion_pred[0].argmax(),
    'Frustration': frustration_pred[0].argmax()
}

print(f"Predicciones para el frame:")
for emotion, pred in predictions.items():
    print(f"{emotion}: {pred}")

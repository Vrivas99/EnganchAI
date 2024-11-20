""" Full imports dependiendo de dependencias locales
- keras._tf_keras.
- tensorflow.python.keras
- tensorflow.keras
- keras """

import tensorflow as tf
from keras._tf_keras.keras.models import Sequential
from keras._tf_keras.keras.layers import Dense, Conv2D, Flatten, Dropout, MaxPooling2D, Dense, Dropout
from keras._tf_keras.keras.preprocessing.image import ImageDataGenerator
import pandas as pd
import os 

""" Rutas de los CSV procesados con 
framesLabelScrapper script """

# Carga CSVs [ train, test, validation ]
train_csv = '~/engagement_model_folder/lib/daisee/DAiSEE/Labels/framesTrainLabels.csv'
test_csv = '~/engagement_model_folder/lib/daisee/DAiSEE/Labels/framesTestLabels.csv'
val_csv = '~/engagement_model_folder/lib/daisee/DAiSEE/Labels/framesValidationLabels.csv'

train_data = pd.read_csv(train_csv)
test_data = pd.read_csv(test_csv)
val_data = pd.read_csv(val_csv)

""" Traer las imagenes no es importante porque su ruta
se encuentra descrita en los csvs correspondientes """

# ImageDataGenerator (Augmentation/Normalization)
datagen = ImageDataGenerator(rescale=1.0/255.0)

# Input Size
input_shape = (480,640,3)

# Create Data Generators

# Train
train_generator = datagen.flow_from_dataframe(
    dataframe=train_data, # Data CSV
    x_col='ImagePath',
    y_col=['Boredom', 'Engagement', 'Confusion', 'Frustration'],
    target_size=(480,640),
    class_mode='raw', # Multi Label ?
    batch_size=32,
    shuffle=True
)

# Validation
val_generator = datagen.flow_from_dataframe(
    dataframe=val_data, # Data CSV
    x_col='ImagePath',
    y_col=['Boredom','Engagement','Confusion','Frustration'],
    target_size=(480,640),
    class_mode='raw',
    batch_size=32,
    shuffle=True
)

# Test
test_generator = datagen.flow_from_dataframe(
    dataframe=test_data, # Data CSV
    x_col='ImagePath',
    y_col=['Boredom','Engagement','Confusion','Frustration'],
    target_size=(480,640),
    class_mode='raw',
    batch_size=32,
    shuffle=False
)

# --------------------
# --------------------
# CNN Architecture

model = Sequential([
    Conv2D(32,(3,3),activation='relu',input_shape=input_shape),
       MaxPooling2D(pool_size=(2, 2)),
    
    Conv2D(64, (3, 3), activation='relu'),
    MaxPooling2D(pool_size=(2, 2)),
    
    Conv2D(128, (3, 3), activation='relu'),
    MaxPooling2D(pool_size=(2, 2)),
    
    Flatten(),
    Dense(512, activation='relu'),
    Dropout(0.5),
    
    Dense(4, activation='softmax')  # 4 output labels (Boredom, Engagement, Confusion, Frustration)
])

model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

# Summary of the model
model.summary()

# Path to save the model checkpoints
checkpoint_filepath = '~/engagement_model_folder/checkpoints/cnn_model.{epoch:02d}.keras'

 
# Callback to save the model after every epoch
checkpoint_callback = tf.keras.callbacks.ModelCheckpoint(
    filepath=checkpoint_filepath,
    save_weights_only=False,
    save_best_only=True,
    monitor='val_loss',
    verbose=1
)

# To resume, load the model from the last checkpoint
# model = tf.keras.models.load_model('~/engagement_model_folder/checkpoints/cnn_model.05.h5')  # Example for resuming from epoch 5

import matplotlib.pyplot as plt

# Training the model
history = model.fit(
    train_generator,
    steps_per_epoch=len(train_generator),
    validation_data=val_generator,
    validation_steps=len(val_generator),
    epochs=10,  # Modify number of epochs as needed
    callbacks=[checkpoint_callback],  # Save model at each epoch
    batch_size=32
)

# Save training history for future use
history_df = pd.DataFrame(history.history)
history_df.to_csv('~/engagement_model_folder/training_history.csv')

# Plot training accuracy and validation accuracy
plt.plot(history.history['accuracy'], label='Training Accuracy')
plt.plot(history.history['val_accuracy'], label='Validation Accuracy')
plt.title('Accuracy over Epochs')
plt.xlabel('Epoch')
plt.ylabel('Accuracy')
plt.legend()
plt.show()

# Plot training loss and validation loss
plt.plot(history.history['loss'], label='Training Loss')
plt.plot(history.history['val_loss'], label='Validation Loss')
plt.title('Loss over Epochs')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.legend()
plt.show()
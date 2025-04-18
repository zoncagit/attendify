import os
import numpy as np
import cv2
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout
from tensorflow.keras.utils import to_categorical
from sklearn.model_selection import train_test_split

# Load images
data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dataset"))
X, y = [], []
labels = os.listdir(data_dir)

# Load and label images
for idx, name in enumerate(labels):
    person_dir = os.path.join(data_dir, name)
    for img_name in os.listdir(person_dir):
        img_path = os.path.join(person_dir, img_name)
        img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
        img = cv2.resize(img, (100, 100))
        X.append(img)
        y.append(idx)

# Convert to arrays
X = np.array(X).reshape(-1, 100, 100, 1) / 255.0  # Normalize
y = to_categorical(np.array(y))  # One-hot labels

# Split data
X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

# Build model
model = Sequential()
model.add(Conv2D(32, (3, 3), activation='relu', input_shape=(100, 100, 1)))  # conv layer
model.add(MaxPooling2D((2, 2)))  # downsample
model.add(Conv2D(64, (3, 3), activation='relu'))
model.add(MaxPooling2D((2, 2)))
model.add(Flatten())  # flatten to 1D
model.add(Dense(128, activation='relu'))  # dense layer
model.add(Dropout(0.3))  # prevent overfitting
model.add(Dense(len(labels), activation='softmax'))  # output

# Compile model
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

# Train model
history = model.fit(X_train, y_train, epochs=15, validation_data=(X_val, y_val))

# Save model
model.save(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models", "face_model.h5")))

print("✅ Model trained and saved.")
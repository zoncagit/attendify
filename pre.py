# Load the Pretrained FaceNet Model
from keras_facenet import FaceNet

embedder = FaceNet()

#Prepare Your Face Image
#Same as the current system — load image, detect face, crop, resize to (160,160,3), and normalize

import cv2
import numpy as np

def preprocess_face(img):
    img = cv2.resize(img, (160,160))
    img = img.astype('float32') / 255.0
    return img

# Generate the 128-D Embedding
#The function expects a list of images even if it’s just one image.
face_img = preprocess_face(face_img)
embedding = embedder.embeddings([face_img])[0]

#Compare Embeddings

from numpy.linalg import norm

distance = norm(embedding - stored_embedding)
if distance < 0.8:
    print("Same person")
else:
    print("Different person")

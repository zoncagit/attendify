
import os
import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.layers import Layer
from numpy.linalg import norm

class L2Normalization(Layer):
    def __init__(self, **kwargs):
        super(L2Normalization, self).__init__(**kwargs)

    def call(self, inputs):
        return tf.nn.l2_normalize(inputs, axis=1)

    def get_config(self):
        config = super().get_config()
        return config
    
embedding_model = tf.keras.models.load_model("C:/Users/hmani/new_test/model/trained_embedding_model_retrainedv3.keras", custom_objects={"L2Normalization": L2Normalization})

stored_embeddings = np.load("C:/Users/hmani/new_test/students/students_embeddings.npy", allow_pickle=True).item()
xml_path = os.path.join(cv2.data.haarcascades, 'haarcascade_frontalface_default.xml')
video =cv2.VideoCapture(0)
face_detected = cv2.CascadeClassifier(xml_path)

while True:
    ret , frame =video.read()
    if not ret:
        print("frame not captured")
        break 
    bgr_frame=cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    face=face_detected.detectMultiScale(bgr_frame,1.3,5)
    embeddings=[]
    collected_im=[]
    
    for (x, y, w, h) in face:
        cropped_frame = frame[y:y+h, x:x+w]
        resized_face = cv2.resize(cropped_frame, (160, 160))
        normalized_face = resized_face.astype('float32') / 255.0
        collected_im.append((normalized_face, (x, y, w, h)))
    for face_img, (x, y, w, h) in collected_im:
        embedding = embedding_model.predict(np.expand_dims(face_img, axis=0))[0]
        embeddings.append((embedding, (x, y, w, h)))
    
   
    for emb, (x, y, w, h) in embeddings:
        match_name="unknown"
        color = (0, 0, 255)
        for name, stored_embedding in stored_embeddings.items():
            distance = norm(emb- stored_embedding)  
            if distance <0.5:
                color = (0, 255, 0)
                match_name=name
                break
            
        cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
        cv2.putText(frame, match_name, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)
    cv2.imshow("Face detection", frame)   
    
    if cv2.waitKey(1) & 0xFF == ord("e"):
        break
video.release()
cv2.destroyAllWindows()
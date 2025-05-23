import os
import cv2
import numpy as np 
from generate_emb import embedding_model

xml_path = os.path.join(cv2.data.haarcascades, 'haarcascade_frontalface_default.xml')
video =cv2.VideoCapture(0)
face_detected = cv2.CascadeClassifier(xml_path)
name=input("your name:\t")

path='C:/Users/hmani/new_test/students/students_embeddings.npy'
count=0
student_img=[]
while True:
    ret , frame =video.read()
    if not ret:
        print("frame not captured")
        break
    bgr_frame=cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    face=face_detected.detectMultiScale(bgr_frame,1.3,5)
    
    for (x, y, w, h) in face:
        cropped_frame=frame[y:y+h,x:x+w]
        resized_face = cv2.resize(cropped_frame, (160, 160))
        normalized_face = resized_face.astype('float32') / 255.0
        student_img.append(normalized_face)
        print(f"Saved image {count}")
        cv2.rectangle(frame,(x,y),(x+w,y+h),(200,0,0),2)
        cv2.imshow("Face detection", frame)
        count+=1
         
    
    if cv2.waitKey(1) & 0xFF == ord("e")or count==31:
        break
video.release()
cv2.destroyAllWindows()
embeddings=[]
for emb in student_img:
    embedding =embedding_model.predict(np.expand_dims(emb,axis=0))[0]
    embeddings.append(embedding)
mean_embeddings=np.mean(embeddings, axis=0)
embedding_dict = {name: mean_embeddings}
if os.path.exists(path):
    existing_embeddings = np.load(path, allow_pickle=True).item()
    existing_embeddings[name] = mean_embeddings
else:
    existing_embeddings = embedding_dict

np.save(path, existing_embeddings)
print(f"Embedding for {name} saved successfully.")


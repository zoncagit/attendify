import os
import face_recognition
import numpy as np
import pickle
from sklearn.metrics import accuracy_score

data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "student"))

known_encodings = []
known_names = []


for student_name in os.listdir(data_dir):
    student_path = os.path.join(data_dir, student_name)#nparcouri kamel lfolders li fihom student's pics 

    if not os.path.isdir(student_path):
        continue

    
    for img_name in os.listdir(student_path):
        img_path = os.path.join(student_path, img_name)
        image = face_recognition.load_image_file(img_path)#yparcouri kamel les images ta3 the same student w yloadihom bch nprocessiwhom

      
        face_locations = face_recognition.face_locations(image)
        if len(face_locations) == 0:
            print(f"No face found in {img_path}, skipping.")
            continue

        encoding = face_recognition.face_encodings(image, known_face_locations=face_locations)[0]
        #(known_face_locations)machi variable key word lazm tst3mlo pca la fonction ta3 face_encodings haka mkhdouma 
    
        known_encodings.append(encoding)
        known_names.append(student_name)
        #haka 3mrt l arrays b l encodings w names 

data = {"encodings": known_encodings, "names": known_names} #hada dictionaire haka tweli encodings m3ntha l array ta3 numpy li fih face encodings

with open("face_encodings.pickle", "wb") as f:
    pickle.dump(data, f)
    #haka derna binary file storina fih face encodings bch lmodel ykhdm bihom fel face comparison 

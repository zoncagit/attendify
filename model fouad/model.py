import os
import face_recognition
import pickle
import numpy as np
import cv2

with open("face_encodings.pickle", "rb") as f:
    data = pickle.load(f)

known_encodings = data["encodings"]
known_names = data["names"]

cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()

    if not ret:
        print("no face detected")
        break
    

    small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)

    
    rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)


    name = "Unknown"

    face_locations = face_recognition.face_locations(rgb_small_frame)
    face_encodings = face_recognition.face_encodings(rgb_small_frame, [face_locations[0]])
    if len(face_encodings)>0:
        matches = face_recognition.compare_faces(known_encodings, face_encodings[0])
        face_distances = face_recognition.face_distance(known_encodings, face_encodings[0])
    

        if True in matches:
            best_match_index = np.argmin(face_distances)
            name = known_names[best_match_index]
    
    
    top, right, bottom, left = [val * 4 for val in face_locations[0]]

    
    cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
    cv2.putText(frame, name, (left, top - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

    
    cv2.imshow("Face Recognition", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break
else:
    print("no face located")
    


    
cap.release()
cv2.destroyAllWindows()
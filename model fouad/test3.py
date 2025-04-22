import cv2
import os 
import face_recognition

name=input("type the student's name\t")

base_path = "C:/Users/hmani/students"
student_folder= os.path.join(base_path, name)

if not os.path.exists(student_folder):
    os.makedirs(student_folder)

cap=cv2.VideoCapture(0)

count = 0

while count < 10:  
    ret, frame = cap.read()  
    
    if not ret:
        print("Failed to grab frame!")
        break
    
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    face_locations=face_recognition.face_locations(rgb_frame)

    if face_locations:
        cv2.imwrite(f"{base_path}/{name}/{count}.jpg", frame) 
        count += 1

      
cap.release()
cv2.destroyAllWindows()


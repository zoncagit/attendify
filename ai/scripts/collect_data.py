import cv2
import os

user_id = input("Enter user ID (e.g., student name or number): ")
base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dataset"))
save_path = os.path.join(base_path, user_id)
print("Creating folder at:", save_path)
os.makedirs(save_path, exist_ok=True)

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

# webcam
cam = cv2.VideoCapture(0)
count = 0
max_images = 200

print("Starting face capture. Look at the camera...")

while True:
    ret, frame = cam.read()
    if not ret:
        break

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)

    for (x, y, w, h) in faces:
        count += 1
        face_img = gray[y:y+h, x:x+w]

        cv2.imwrite(f"{save_path}/{user_id}_{count}.jpg", face_img)
        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)

        cv2.imshow('Face Capture', frame)

    if cv2.waitKey(2) & 0xFF == ord('q') or count >= max_images:
        break

print(f"[INFO] Collected {count} face images for user '{user_id}'")
print("Saving to:", save_path)
cam.release()
cv2.destroyAllWindows()
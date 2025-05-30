# Face Recognition Attendance System

A real-time face recognition attendance system built with FastAPI and Socket.IO. The system allows users to register their faces and mark attendance using face recognition with a custom TensorFlow model.

## Features

- Real-time face registration and recognition
- Web-based interface with live camera feed
- Socket.IO for real-time communication
- Face embedding extraction using custom TensorFlow model
- In-memory storage for face embeddings and attendance logs
- OpenCV-based face detection

## Prerequisites

- Python 3.8 or higher
- Webcam
- Modern web browser with camera access
- Custom trained TensorFlow face recognition model (.keras file)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <repository-name>
```

2. Create a virtual environment and activate it:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Place your trained TensorFlow model:
   - Put your trained .keras model file in the `app/models` directory
   - Name it `face_model.keras`

## Running the Application

1. Start the FastAPI server:
```bash
uvicorn app.main:socket_app --host 127.0.0.0 --port 8000 --reload
```

2. Open your web browser and navigate to:
```
http://localhost:8000
```

## Usage

1. **Register a Face**:
   - Enter a User ID in the input field
   - Click "Register Face" button
   - Position your face in the camera view
   - Wait for the registration confirmation

2. **Mark Attendance**:
   - Click "Mark Attendance" button
   - Position your face in the camera view
   - The system will automatically recognize your face and mark attendance

## Project Structure

```
.
├── app/
│   ├── main.py              # FastAPI and Socket.IO server
│   ├── models/
│   │   └── face_model.keras # Your trained TensorFlow model
│   ├── utils/
│   │   ├── face_utils.py    # Face recognition utilities
│   │   └── model_loader.py  # TensorFlow model loader
│   └── static/
│       └── index.html       # Frontend client
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## Notes

- The system uses in-memory storage, so face embeddings and attendance logs will be cleared when the server restarts
- Face recognition accuracy depends on your trained model's quality and lighting conditions
- The system uses OpenCV's Haar Cascade classifier for face detection
- Make sure your TensorFlow model outputs face embeddings of consistent dimensions

## License

MIT License 
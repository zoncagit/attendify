# Attendify

A web-based attendance management system that uses QR codes and face recognition for marking attendance.

## Features

- User authentication (teachers and students)
- Face recognition-based attendance
- QR code-based attendance
- Class management
- Attendance reporting and analytics
- Email notifications

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: FastAPI
- Database: MySQL
- AI: TensorFlow, OpenCV
- Authentication: Email/Password

## Project Structure

```
attendify/
├── frontend/           # Frontend application
│   ├── src/           # Source files
│   ├── public/        # Static files
│   └── dist/          # Build output
├── backend/           # FastAPI backend
│   ├── app/          # Application code
│   ├── tests/        # Backend tests
│   └── alembic/      # Database migrations
├── ai/               # Face recognition module
│   ├── models/       # ML models
│   └── utils/        # Helper functions
└── docs/             # Documentation
```

## Setup Instructions

1. Clone the repository
2. Set up the backend:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Set up the frontend:
   ```bash
   cd frontend
   npm install
   ```

4. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the values as needed

5. Start the development servers:
   - Backend: `uvicorn app.main:app --reload`
   - Frontend: `npm run dev`

## API Documentation

API documentation is available at `/docs` when running the backend server.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License

# Attendify Backend Setup Guide

## Prerequisites
- Python 3.8 or higher
- pip (Python package manager)
- Git (for cloning the repository)

## Setup Steps

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd attendify/backend2
   ```

2. **Create and Activate Virtual Environment**
   ```bash
   # On Windows
   python -m venv venv
   .\venv\Scripts\activate

   # On macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Setup**
   Create a `.env` file in the backend2 directory with the following variables:
   ```
   # Database Configuration
   DATABASE_URL=sqlite:///./attendify.db

   # JWT Configuration
   SECRET_KEY=your-secret-key-here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30

   # Email Configuration (if using email features)
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=your-app-specific-password
   ```

5. **Initialize Database**
   ```bash
   # Run database migrations
   alembic upgrade head
   ```

6. **Run the Application**
   ```bash
   uvicorn app.main:app --reload
   ```

The server will start at `http://127.0.0.1:8000`

## API Documentation
Once the server is running, you can access:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

## Common Issues and Solutions

1. **Database Connection Issues**
   - Ensure the database file path is correct
   - Check file permissions for the database directory

2. **Port Already in Use**
   - Change the port using: `uvicorn app.main:app --reload --port 8001`

3. **Module Not Found Errors**
   - Ensure you're in the correct directory
   - Verify virtual environment is activated
   - Try reinstalling requirements: `pip install -r requirements.txt --force-reinstall`

4. **Email Configuration Issues**
   - For Gmail, use App Password instead of regular password
   - Enable "Less secure app access" or use OAuth2

## Development Notes

- The application uses SQLite by default for development
- For production, consider using PostgreSQL or MySQL
- Always use environment variables for sensitive information
- Keep the virtual environment activated while working on the project

## Testing

To run tests:
```bash
pytest
```

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run tests
4. Submit a pull request

## License

[Your License Here] 
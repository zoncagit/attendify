# Deploying Attendify to PythonAnywhere

This guide provides step-by-step instructions to deploy the Attendify application to PythonAnywhere.

## Prerequisites
- A PythonAnywhere account.
- The `attendify` codebase uploaded to your PythonAnywhere file storage (e.g., in `~/attendify`).

## Step 1: Upload Code
1. Upload the entire `attendify` folder to your PythonAnywhere home directory.
2. Ensure the directory structure resembles:
   ```
   /home/yourusername/attendify/
       backend/
       frontend/
       ...
   ```

## Step 2: Virtual Environment
1. Open a Bash console on PythonAnywhere.
2. Navigate to the project directory: `cd ~/attendify`
3. Create a virtual environment:
   ```bash
   mkvirtualenv --python=/usr/bin/python3.10 attendify-env
   ```
   *(Or use `python3 -m venv venv` and activate it)*
4. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

## Step 3: Web App Configuration
1. Go to the **Web** tab in PythonAnywhere dashboard.
2. **Add a new web app**.
3. Select **Manual configuration** (since we have a custom WSGI file) and choose **Python 3.10** (or matching your venv).
4. **Virtualenv**: Enter the path to your virtual environment (e.g., `/home/yourusername/.virtualenvs/attendify-env`).
5. **WSGI configuration file**: Click/edit the WSGI configuration file.
   - Delete existing content.
   - Paste the contents of `backend/wsgi.py`.
   - **Crucial**: Update the path in `wsgi.py` if your project location differs. currently it assumes `/home/yourusername/attendify`. You might need to edit `backend/wsgi.py` to uncomment and set the correct `project_home`.

## Step 4: Static Files
1. In the **Web** tab, scroll to **Static files**.
2. Add the following mapping to serve backend uploads:
   - **URL**: `/static`
   - **Directory**: `/home/yourusername/attendify/backend/static` (Ensure this directory exists and contains user uploads/assets)
3. **Frontend Serving**:
   - The application has been configured to serve the Frontend (HTML/CSS/JS) directly from the root URL `/`.
   - **No additional static mapping is required for the frontend** if using the WSGI app, as FastAPI handles it.
   - However, for better performance, you *can* add a mapping:
     - **URL**: `/styles` -> `/home/yourusername/attendify/frontend/styles`
     - **URL**: `/scripts` -> `/home/yourusername/attendify/frontend/scripts`
     - **URL**: `/assets` -> `/home/yourusername/attendify/frontend/assets`

## Step 5: Database
1. Initialize the database:
   ```bash
   cd ~/attendify/backend
   python migrations/add_new_fields.py
   ```
   *(Run this to update schema. Standard Tables are created on app startup via `models.Base.metadata.create_all`)*

## Step 6: Environment Variables
1. Set environment variables in the WSGI file or a `.env` file loaded by it.
   - `DEBUG=False`
   - `SECRET_KEY=your_secure_secret_key`
   - `DATABASE_URL=sqlite:///./attendify.db` (or your MySQL connection string)

## Step 7: Reload
1. Click the **Reload** button in the Web tab.
2. Visit your site: `https://yourusername.pythonanywhere.com`.

## Troubleshooting
- Check the **Error log** in the Web tab if the site crashes.
- Ensure `FaceRecognitionService` paths to the model are absolute or correctly relative to the working directory.

## Important Note on WebSockets
- PythonAnywhere's free tier and standard web workers **do not support WebSockets** (Socket.IO) natively with persistent connections. They will fallback to HTTP long-polling, which Socket.IO handles automatically. 
- The frontend `config.js` has been updated to automatically use the correct API URL in production.

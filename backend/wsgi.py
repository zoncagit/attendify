"""
WSGI entry point for PythonAnywhere deployment.

Configuration for PythonAnywhere:
1. Go to the "Web" tab
2. Set the WSGI configuration file path to point to this file
3. Set the working directory to the backend folder
4. Configure the virtualenv path

In the WSGI configuration file on PythonAnywhere, use:
```python
import sys
path = '/home/YOUR_USERNAME/attendify/backend'
if path not in sys.path:
    sys.path.insert(0, path)

from wsgi import application
```
"""
import sys
import os

# Add the backend directory to the path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Load environment variables from .env file if present
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(backend_dir, '.env'))
except ImportError:
    pass

# Import the ASGI app
from app.main import socket_app

# For PythonAnywhere, we need a WSGI application
# Since we're using ASGI (FastAPI + Socket.IO), we need to use an ASGI-to-WSGI adapter
# However, PythonAnywhere supports ASGI directly for some plans

# For ASGI support (recommended):
application = socket_app

# Alternative: If you need pure WSGI (no WebSocket support),
# you can use just the FastAPI app:
# from app.main import app as application

from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
import json
import os

# First, download your credentials JSON file from Google Cloud Console
# and place it in the same directory as this script
# The file should be named 'credentials.json'

# Load your credentials JSON file
flow = InstalledAppFlow.from_client_secrets_file(
    'credentials.json',
    scopes=['https://mail.google.com/'],
    redirect_uri='http://localhost:8000/auth/callback'
)

# Run the flow to get credentials
credentials = flow.run_local_server(port=0)

# Save the credentials to a JSON string
credentials_dict = {
    'token': credentials.token,
    'refresh_token': credentials.refresh_token,
    'token_uri': credentials.token_uri,
    'client_id': credentials.client_id,
    'client_secret': credentials.client_secret,
    'scopes': credentials.scopes
}

# Print the credentials JSON to copy to your .env file
print("Copy this JSON to your .env file as SMTP_PASSWORD:")
print(json.dumps(credentials_dict))

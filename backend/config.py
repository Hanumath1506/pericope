import os
from firebase_admin import credentials, initialize_app, storage, firestore
import firebase_admin
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

def init_firebase():
    if not firebase_admin._apps:
        cred = credentials.Certificate({
            "type": "service_account",
            "project_id": os.getenv("FIREBASE_PROJECT_ID"),
            "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
            "private_key": os.getenv("FIREBASE_PRIVATE_KEY").replace("\\n", "\n"),
            "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
            "client_id": os.getenv("FIREBASE_CLIENT_ID"),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        })
        initialize_app(cred, {"storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET")})

init_firebase()

def get_firestore():
    return firestore.client()

def get_storage():
    return storage.bucket()

def get_groq_client() -> Groq:
    return Groq(api_key=os.getenv("GROQ_API_KEY"))
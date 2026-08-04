"""
Vercel Python serverless entry point.
This file imports the FastAPI app from backend/main.py and mounts it
under /api so that Vercel's path routing matches FastAPI's internal routes.
"""
import sys
import os
from fastapi import FastAPI

# Add backend directory to Python path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from main import app as backend_app

app = FastAPI()
app.mount("/api", backend_app)

"""
Vercel Python serverless entry point.
This file imports the FastAPI app from backend/main.py and exposes it
as `app` for Vercel's Python runtime.
"""
import sys
import os

# Add backend directory to Python path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from main import app  # noqa: F401 - Vercel needs this import

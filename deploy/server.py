"""Self-hosted entry point serving FastAPI under /api and the static frontend."""

from pathlib import Path
import sys

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# Add backend directory to Python path so internal imports work
sys.path.insert(0, str(Path(__file__).resolve().parent / "backend"))

from main import app as backend_app

app = FastAPI()
app.mount("/api", backend_app)

STATIC = Path(__file__).resolve().parent / "static"
app.mount("/assets", StaticFiles(directory=STATIC / "assets"), name="assets")


@app.get("/{path:path}", include_in_schema=False)
async def frontend(path: str):
    candidate = (STATIC / path).resolve()
    if candidate.is_relative_to(STATIC) and candidate.is_file():
        return FileResponse(candidate)
    return FileResponse(STATIC / "index.html", headers={"Cache-Control": "no-cache"})

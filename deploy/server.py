"""Self-hosted entry point, retaining Vercel's /api routing contract."""

from pathlib import Path

from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from api.index import app

STATIC = Path(__file__).resolve().parent / "static"
app.mount("/assets", StaticFiles(directory=STATIC / "assets"), name="assets")


@app.get("/{path:path}", include_in_schema=False)
async def frontend(path: str):
    candidate = (STATIC / path).resolve()
    if candidate.is_relative_to(STATIC) and candidate.is_file():
        return FileResponse(candidate)
    return FileResponse(STATIC / "index.html", headers={"Cache-Control": "no-cache"})

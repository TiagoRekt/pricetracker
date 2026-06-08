from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

# Servir frontend estático
app.mount("/site/static", StaticFiles(directory="frontend"), name="frontend_static")

@app.get("/")
def root():
    return {"message": "PriceTracker API online!"}

@app.get("/search")
def search():
    return {"status": "ok", "data": []}

@app.get("/alertas")
def alertas():
    return {"status": "ok", "alertas": []}

# Serve index.html quando o utilizador acede a /site ou /site/
@app.get("/site")
def site_root():
    return FileResponse(os.path.join("frontend", "index.html"))

@app.get("/site/")
def site_root_slash():
    return FileResponse(os.path.join("frontend", "index.html"))

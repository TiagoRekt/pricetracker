from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# Servir frontend
app.mount("/site", StaticFiles(directory="frontend"), name="frontend")

@app.get("/")
def root():
    return {"message": "PriceTracker API online!"}

@app.get("/search")
def search():
    return {"status": "ok", "data": []}

@app.get("/alertas")
def alertas():
    return {"status": "ok", "alertas": []}

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import sqlite3
import os

DB_PATH = "data.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS alertas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        produto TEXT NOT NULL,
        preco_max REAL NOT NULL
    )
    """)
    c.execute("""
    CREATE TABLE IF NOT EXISTS notificacoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        loja TEXT,
        preco TEXT,
        preco_max REAL,
        url TEXT
    )
    """)
    conn.commit()
    conn.close()

init_db()

app = FastAPI()

# Servir frontend estático (arquivos CSS/JS/imagens)
app.mount("/site/static", StaticFiles(directory="frontend"), name="frontend_static")

@app.get("/")
def root():
    return {"message": "PriceTracker API online!"}

# Serve index.html em /site e /site/
@app.get("/site")
def site_root():
    return FileResponse(os.path.join("frontend", "index.html"))

@app.get("/site/")
def site_root_slash():
    return FileResponse(os.path.join("frontend", "index.html"))

# --- Endpoints usados pelo frontend ---

@app.get("/search")
def search(q: str = ""):
    sample = [
      {"nome":"Gráfica Asus GeForce RTX 5070 TUF Gaming 12GB GDDR7 DLSS4","loja":"PcComponentes PT","preco":"601,88 €","url":"https://www.pccomponentes.pt/"},
      {"nome":"ASUS Dual GeForce RTX 5070 12GB GDDR7 OC","loja":"PcComponentes PT","preco":"604,73 €","url":"https://www.pccomponentes.pt/"},
      {"nome":"Placa gráfica PNY GeForce RTX 5070 Dual-Fan Slim OC 12GB","loja":"PCDiga","preco":"689,90 €","url":"https://www.pcdiga.com/"},
      {"nome":"Placa Gráfica Palit GeForce RTX 5070 Infinity 3 12GB","loja":"PCDiga","preco":"699,90 €","url":"https://www.pcdiga.com/"},
      {"nome":"PNY GeForce RTX 5070 Placa Gráfica 12GB GDDR7","loja":"PCDiga","preco":"699,90 €","url":"https://www.pcdiga.com/"},
      {"nome":"Gráfica Zotac GeForce RTX 5070 Solid 12GB GDDR7 DLSS4","loja":"PCDiga","preco":"699,90 €","url":"https://www.pcdiga.com/"}
    ]
    if not q:
        return {"resultados": sample, "cache": False}
    ql = q.lower()
    filtered = [r for r in sample if ql in r["nome"].lower() or ql in r["loja"].lower()]
    return {"resultados": filtered, "cache": False}

@app.get("/alertas")
def get_alertas():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id, produto, preco_max FROM alertas ORDER BY id DESC")
    rows = c.fetchall()
    conn.close()
    alertas = [{"id": r[0], "produto": r[1], "preco_max": r[2]} for r in rows]
    return alertas

@app.post("/alertas")
async def post_alerta(request: Request):
    params = dict(request.query_params)
    produto = params.get("produto") or None
    preco_max = params.get("preco_max") or None
    if not produto or not preco_max:
        raise HTTPException(status_code=400, detail="produto e preco_max obrigatórios")
    try:
        preco_val = float(preco_max)
    except:
        raise HTTPException(status_code=400, detail="preco_max inválido")
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT INTO alertas (produto, preco_max) VALUES (?, ?)", (produto, preco_val))
    conn.commit()
    new_id = c.lastrowid
    conn.close()
    return {"id": new_id, "produto": produto, "preco_max": preco_val}

@app.delete("/alertas/{alerta_id}")
def delete_alerta(alerta_id: int):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("DELETE FROM alertas WHERE id = ?", (alerta_id,))
    conn.commit()
    conn.close()
    return JSONResponse(status_code=204, content={})

@app.get("/notificacoes")
def get_notificacoes():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id, nome, loja, preco, preco_max, url FROM notificacoes ORDER BY id DESC")
    rows = c.fetchall()
    conn.close()
    notifs = [{"id": r[0], "nome": r[1], "loja": r[2], "preco": r[3], "preco_max": r[4], "url": r[5]} for r in rows]
    return notifs

@app.post("/notificacoes/limpar")
def limpar_notificacoes():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("DELETE FROM notificacoes")
    conn.commit()
    conn.close()
    return {"status": "ok"}

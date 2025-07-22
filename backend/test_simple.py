from fastapi import FastAPI

app = FastAPI(title="MX70 Test", description="Simple test API", version="1.0.0")

@app.get("/")
def read_root():
    return {"message": "MX70 Test API is running!"} 
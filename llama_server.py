from llama_cpp import Llama
from flask import Flask, request, jsonify
from pymongo import MongoClient
import os
from datetime import datetime

app = Flask(__name__)

# -------------------------------
# Resolve absolute model path
# -------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "llama-2-7b.Q4_K_M.gguf"
)

# -------------------------------
# MongoDB Connection
# -------------------------------
mongo_client = MongoClient("mongodb://localhost:27017/")
db = mongo_client["chatdoctor_db"]
collection = db["llama_logs"]

print("MongoDB connected (LLaMA logs)")

# -------------------------------
# Load LLaMA model
# -------------------------------
llm = Llama(
    model_path=MODEL_PATH,
    n_ctx=2048,
    n_threads=8
)

# -------------------------------
# API endpoint for generation
# -------------------------------
@app.route("/generate", methods=["POST"])
def generate():
    data = request.json or {}
    prompt = data.get("prompt", "").strip()

    if not prompt:
        return jsonify({"response": "No input prompt provided."})

    output = llm(
        f"You are a medical assistant.\nUser: {prompt}\nAssistant:",
        max_tokens=256,
        stop=["User:"]
    )

    response_text = output["choices"][0]["text"].strip()

    # -------------------------------
    # Store in MongoDB (LOG ONLY)
    # -------------------------------
    collection.insert_one({
        "prompt": prompt,
        "response": response_text,
        "createdAt": datetime.utcnow()
    })

    return jsonify({
        "response": response_text
    })

# -------------------------------
# Run server
# -------------------------------
if __name__ == "__main__":
    print(f"Loading LLaMA model from: {MODEL_PATH}")
    app.run(host="0.0.0.0", port=8001)

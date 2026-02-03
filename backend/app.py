from flask import Flask, request, jsonify
from flask_cors import CORS
CORS(app)
import random
import time

app = Flask(__name__)

# 🔥 IMPORTANT: allow all origins
CORS(app, resources={r"/*": {"origins": "*"}})

QUESTIONS = [
    {"id": 1, "code": "print(type([]))", "answer": "<class 'list'>"},
    {"id": 2, "code": "print(2 ** 3 ** 2)", "answer": "512"},
    {"id": 3, "code": "print(bool('False'))", "answer": "True"},
    {"id": 4, "code": "print(len({1,2,2,3}))", "answer": "3"},
    {"id": 5, "code": "print('a' * 3)", "answer": "aaa"},
]

leaderboard = []

@app.route("/questions")
def questions():
    selected = random.sample(QUESTIONS, 3)
    return jsonify({
        "questions": selected,
        "start_time": time.time()
    })

@app.route("/submit", methods=["POST"])
def submit():
    data = request.json

    name = data.get("name")
    answers = data.get("answers", {})
    start_time = data.get("start_time")

    end_time = time.time()
    total_time = round(end_time - start_time, 2)

    score = 0
    for q in QUESTIONS:
        qid = str(q["id"])
        if qid in answers and answers[qid].strip() == q["answer"]:
            score += 1

    leaderboard.append({
        "name": name,
        "score": score,
        "time": total_time
    })

    leaderboard.sort(key=lambda x: (-x["score"], x["time"]))

    return jsonify({
        "score": score,
        "time": total_time
    })

@app.route("/leaderboard")
def board():
    return jsonify(leaderboard)

if __name__ == "__main__":
    app.run(port=5000, debug=True)

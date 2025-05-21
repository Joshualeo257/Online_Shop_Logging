# app.py
from flask import Flask, render_template

app = Flask(__name__, static_folder="static", template_folder=".")

# Route for the home page (http://localhost:5000/)
@app.route("/")
def index():
    # main.html must be in the same folder as app.py
    return render_template("main.html")

if __name__ == "__main__":
    # debug=True enables auto‑reload on file changes
    app.run(host="0.0.0.0", port=5000, debug=True)

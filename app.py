import os
import sqlite3

from flask import (
    Flask,
    render_template,
    request,
    jsonify,
    g,
    session,
    send_file
)

from werkzeug.security import (
    generate_password_hash,
    check_password_hash
)

from main import analyze_stock


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
STATIC_DIR = os.path.join(BASE_DIR, "static")
DATABASE = os.path.join(BASE_DIR, "equitylens.db")


# ============================================================
# FLASK APP
# ============================================================
app = Flask(
    __name__,
    template_folder=TEMPLATES_DIR,
    static_folder=STATIC_DIR,
    static_url_path="/static"
)

app.secret_key = os.environ.get(
    "FLASK_SECRET_KEY",
    "equitylens-development-secret-change-in-production"
)


# ============================================================
# TEMPLATE ASSETS
# ============================================================

@app.route("/assets/<path:filename>")
def template_asset(filename):
    safe_path = os.path.abspath(os.path.join(TEMPLATES_DIR, filename))
    templates_root = os.path.abspath(TEMPLATES_DIR) + os.sep

    if not safe_path.startswith(templates_root):
        return jsonify({"success": False, "message": "Invalid asset path."}), 400

    if not os.path.isfile(safe_path):
        return jsonify({"success": False, "message": "Asset not found."}), 404

    return send_file(safe_path)


# ============================================================
# DATABASE
# ============================================================

def get_db():
    db = getattr(g, "_database", None)

    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row

    return db


@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, "_database", None)
    if db is not None:
        db.close()


def init_db():
    with app.app_context():
        db = get_db()
        cursor = db.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                status TEXT DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS watchlists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                ticker TEXT NOT NULL,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                UNIQUE(user_id, ticker)
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS analysis_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                ticker TEXT NOT NULL,
                current_price REAL NOT NULL,
                signal TEXT NOT NULL,
                rsi REAL,
                macd REAL,
                predicted_price REAL,
                analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS stock_searches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                ticker TEXT NOT NULL,
                searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("SELECT id FROM users WHERE username = ?", ("admin",))
        if not cursor.fetchone():
            cursor.execute(
                "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
                ("admin", "admin@equitylens.io", generate_password_hash("AdminPass123!"), "admin")
            )

        cursor.execute("SELECT id FROM users WHERE username = ?", ("trader1",))
        if not cursor.fetchone():
            cursor.execute(
                "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
                ("trader1", "trader1@equitylens.io", generate_password_hash("UserPass123!"), "user")
            )

        db.commit()


init_db()


# ============================================================
# AUTH HELPERS
# ============================================================

def get_current_user():
    if "user_id" not in session:
        return None

    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT id, username, email, role, status FROM users WHERE id = ?", (session["user_id"],))
    return cursor.fetchone()


def require_admin():
    user = get_current_user()
    return bool(user and user["role"] == "admin")


# ============================================================
# FRONTEND & AUTH ROUTES
# ============================================================

@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")


@app.route("/signup", methods=["POST"])
def signup():
    data = request.get_json() or {}
    username = str(data.get("username", "")).strip()
    email = str(data.get("email", "")).strip()
    password = str(data.get("password", "")).strip()

    if not username or not email or not password:
        return jsonify({"success": False, "message": "All fields are required."}), 400

    db = get_db()
    cursor = db.cursor()

    try:
        cursor.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            (username, email, generate_password_hash(password))
        )
        db.commit()

        cursor.execute("SELECT id, username, email, role FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        session["user_id"] = user["id"]
        session["role"] = user["role"]

        return jsonify({"success": True, "user": dict(user)})

    except sqlite3.IntegrityError:
        return jsonify({"success": False, "message": "Username or Email already exists."}), 409


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = str(data.get("username", "")).strip()
    password = str(data.get("password", "")).strip()

    if not username or not password:
        return jsonify({"success": False, "message": "Username and password required."}), 400

    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ? OR email = ?", (username, username))
    user = cursor.fetchone()

    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"success": False, "message": "Invalid credentials."}), 401

    if user["status"] != "active":
        return jsonify({"success": False, "message": "Account deactivated. Contact administrator."}), 403

    session["user_id"] = user["id"]
    session["role"] = user["role"]

    return jsonify({
        "success": True,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "role": user["role"]
        }
    })


@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"success": True, "message": "Logged out successfully."})


@app.route("/check-auth", methods=["GET"])
def check_auth():
    user = get_current_user()
    if not user:
        return jsonify({"authenticated": False})

    return jsonify({
        "authenticated": True,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "role": user["role"]
        }
    })


# ============================================================
# STOCK ANALYZER (WITH SMART SUFFIX AUTO-FALLBACK)
# ============================================================

def safe_analyze(ticker):
    clean_ticker = ticker.strip().upper()
    try:
        return analyze_stock(clean_ticker, STATIC_DIR)
    except Exception as first_exc:
        # Auto-fallback: Try adding .NS for Indian symbols if plain ticker fails
        if not clean_ticker.endswith(".NS") and not clean_ticker.endswith(".BO"):
            try:
                return analyze_stock(f"{clean_ticker}.NS", STATIC_DIR)
            except Exception:
                pass
        raise first_exc


@app.route("/api/stock/<ticker>", methods=["GET"])
def stock_data(ticker):
    try:
        result = safe_analyze(ticker)

        user = get_current_user()
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            "INSERT INTO stock_searches (user_id, ticker) VALUES (?, ?)",
            (user["id"] if user else None, result["ticker"])
        )
        db.commit()

        return jsonify({
            "success": True,
            "ticker": result["ticker"],
            "current_price": result["current_price"],
            "history": result["history"]
        })

    except Exception as exc:
        return jsonify({
            "success": False,
            "message": f"No data found for '{ticker}'. For Indian stocks, try adding .NS (e.g., {ticker.upper()}.NS or RELIANCE.NS)."
        }), 500


@app.route("/api/predict", methods=["POST"])
def predict():
    data = request.get_json() or {}
    ticker = str(data.get("ticker", data.get("stock", "POWERGRID.NS"))).strip().upper()

    try:
        result = safe_analyze(ticker)
        user = get_current_user()

        if user:
            current_price = result["current_price"]
            future_prices = result["predictions"]

            if future_prices and future_prices[-1] > current_price:
                signal = "Bullish"
            elif future_prices and future_prices[-1] < current_price:
                signal = "Bearish"
            else:
                signal = "Neutral"

            db = get_db()
            cursor = db.cursor()
            cursor.execute(
                """
                INSERT INTO analysis_history (user_id, ticker, current_price, signal, predicted_price)
                VALUES (?, ?, ?, ?, ?)
                """,
                (user["id"], result["ticker"], current_price, signal, future_prices[-1] if future_prices else current_price)
            )
            db.commit()

        return jsonify({
            "success": True,
            "ticker": result["ticker"],
            "future_dates": result["future_dates"],
            "predictions": result["predictions"],
            "mae": result["mae"],
            "rmse": result["rmse"],
            "r2": result["r2"],
            "test_dates": result["test_dates"],
            "actual": result["actual"],
            "test_predictions": result["test_predictions"]
        })

    except Exception as exc:
        return jsonify({
            "success": False,
            "message": f"Prediction failed for {ticker}."
        }), 500


@app.route("/api/compare", methods=["POST"])
def compare_stocks():
    data = request.get_json() or {}
    raw_tickers = data.get("tickers", [])

    if isinstance(raw_tickers, str):
        raw_tickers = [t.strip() for t in raw_tickers.split(",") if t.strip()]

    tickers = [str(t).strip().upper() for t in raw_tickers if str(t).strip()]
    tickers = list(dict.fromkeys(tickers))

    if len(tickers) < 2 or len(tickers) > 3:
        return jsonify({"success": False, "message": "Compare requires 2 or 3 tickers."}), 400

    compared_results = []
    errors = []

    for ticker in tickers:
        try:
            res = safe_analyze(ticker)
            curr = res["current_price"]
            fut = res["predictions"][-1] if res.get("predictions") else curr
            pct_change = ((fut - curr) / curr) * 100 if curr else 0.0

            compared_results.append({
                "ticker": res["ticker"],
                "current_price": curr,
                "predicted_price": fut,
                "expected_change_pct": round(pct_change, 2),
                "signal": "Bullish" if pct_change > 0.5 else "Bearish" if pct_change < -0.5 else "Neutral",
                "mae": res["mae"],
                "rmse": res["rmse"],
                "r2": res["r2"],
                "history": res["history"],
                "future_dates": res["future_dates"],
                "predictions": res["predictions"]
            })
        except Exception as exc:
            errors.append(f"{ticker}: Try adding .NS (e.g. {ticker}.NS)")

    if not compared_results:
        return jsonify({"success": False, "message": "Failed to analyze selected stocks. " + "; ".join(errors)}), 500

    return jsonify({"success": True, "count": len(compared_results), "results": compared_results, "errors": errors})


# ============================================================
# WATCHLIST & HISTORY API
# ============================================================

@app.route("/api/watchlist", methods=["GET", "POST", "DELETE"])
def watchlist():
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "Authentication required."}), 401

    db = get_db()
    cursor = db.cursor()

    if request.method == "GET":
        cursor.execute("SELECT id, ticker, added_at FROM watchlists WHERE user_id = ? ORDER BY added_at DESC", (user["id"],))
        return jsonify({"success": True, "watchlist": [dict(row) for row in cursor.fetchall()]})

    data = request.get_json() or {}
    ticker = str(data.get("ticker", "")).strip().upper()

    if not ticker:
        return jsonify({"success": False, "message": "Ticker symbol required."}), 400

    if request.method == "POST":
        try:
            cursor.execute("INSERT INTO watchlists (user_id, ticker) VALUES (?, ?)", (user["id"], ticker))
            db.commit()
            return jsonify({"success": True, "message": f"{ticker} added to watchlist."})
        except sqlite3.IntegrityError:
            return jsonify({"success": False, "message": "Ticker already in watchlist."}), 409

    cursor.execute("DELETE FROM watchlists WHERE user_id = ? AND ticker = ?", (user["id"], ticker))
    db.commit()
    return jsonify({"success": True, "message": f"{ticker} removed from watchlist."})


@app.route("/api/analyses", methods=["GET", "POST"])
def analyses():
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "Authentication required."}), 401

    db = get_db()
    cursor = db.cursor()

    if request.method == "GET":
        cursor.execute(
            "SELECT id, ticker, current_price, signal, rsi, macd, predicted_price, analyzed_at FROM analysis_history WHERE user_id = ? ORDER BY analyzed_at DESC LIMIT 20",
            (user["id"],)
        )
        return jsonify({"success": True, "analyses": [dict(row) for row in cursor.fetchall()]})

    data = request.get_json() or {}
    cursor.execute(
        """
        INSERT INTO analysis_history (user_id, ticker, current_price, signal, rsi, macd, predicted_price)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (user["id"], str(data.get("ticker", "AAPL")).upper(), data.get("current_price", 0.0), data.get("signal", "Neutral"), data.get("rsi"), data.get("macd"), data.get("predicted_price", 0.0))
    )
    db.commit()
    return jsonify({"success": True, "message": "Analysis recorded successfully."})


# ============================================================
# ADMIN
# ============================================================

@app.route("/admin/overview", methods=["GET"])
def admin_overview():
    if not require_admin():
        return jsonify({"success": False, "message": "Admin privileges required."}), 403

    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT COUNT(*) AS count FROM users")
    total_users = cursor.fetchone()["count"]

    cursor.execute("SELECT COUNT(*) AS count FROM users WHERE status = 'active'")
    active_users = cursor.fetchone()["count"]

    cursor.execute("SELECT COUNT(*) AS count FROM analysis_history")
    total_analyses = cursor.fetchone()["count"]

    cursor.execute("SELECT ticker, COUNT(ticker) AS cnt FROM stock_searches GROUP BY ticker ORDER BY cnt DESC LIMIT 1")
    row = cursor.fetchone()

    return jsonify({
        "success": True,
        "metrics": {
            "total_users": total_users,
            "active_users": active_users,
            "total_analyses": total_analyses,
            "most_analyzed_stock": row["ticker"] if row else "N/A"
        }
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
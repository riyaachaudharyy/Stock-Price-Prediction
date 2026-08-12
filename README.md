# 📈 EquityLens — AI-Powered Fintech Stock Analytics & Multi-Stock Comparison Terminal

**EquityLens** is a next-generation quantitative financial analytics platform engineered to bridge the gap between heavy technical indicators and deep learning forecasts. It provides real-time market telemetry, technical analysis (EMA, RSI, MACD), and high-accuracy 15-day stock price trajectories using pre-trained **LSTM Neural Networks**.

---

## 🚀 Key Features

* **Real-Time Stock Analytics:** Fetch up-to-date historical OHLCV data from Yahoo Finance with smart fallback and caching mechanisms.
* **Pre-Trained Deep Learning (LSTM) Forecasting:** Predicts the next 15-day price trajectory recursively using a pre-trained Keras model without requiring runtime retraining.
* **Multi-Stock Comparison Terminal:** Compare 2 to 3 stocks simultaneously with individual performance graphs, normalized growth charts (Base = 100), absolute historical price trends, and side-by-side metric tables (MAE, RMSE, R²).
* **Technical Indicators Suite:** Real-time calculation of Exponential Moving Averages (EMA 20, 50, 100, 200), RSI oscillators, and MACD trendline crossovers.
* **Trader Workstation & Watchlist:** User-authenticated session controls, secure password hashing, isolated personal watchlists, and search history persistence.
* **Executive Admin Portal:** System overview metrics, user management (activate/deactivate status), and search telemetry analytics.
* **Data Export Suite:** Export historical data, predictions, and combined report analytics directly to CSV or JSON formats.

---

## 🛠️ Tech Stack

* **Backend:** Python, Flask, Gunicorn, SQLite (`equitylens.db`)
* **Machine Learning & Data:** TensorFlow / Keras, Scikit-Learn, Pandas, NumPy, YFinance
* **Frontend:** HTML5, Modern CSS3 (Glassmorphism & Cyber-Grid Theme), Plotly.js, Vanilla JavaScript
* **Deployment:** Render / Gunicorn Production Server

---

## 📊 System Architecture & Flowchart

The high-level data flow and application workflow of EquityLens:

```text
       [ User / Client Browser ]
                  │
                  ▼
       [ Flask Web Server (app.py) ]
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
   [ SQLite DB ]     [ YFinance API ]
  (Auth/Watchlist)   (Real-Time Data)
        │                   │
        └─────────┬─────────┘
                  ▼
      [ Quantitative Engine (main.py) ]
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
[ Technical Analysis ]  [ Pre-Trained LSTM Model ]
(EMA, RSI, MACD)        (15-Day Trajectory Forecast)
        │                   │
        └─────────┬─────────┘
                  ▼
         [ JSON API Response ]
                  │
                  ▼
   [ Interactive Plotly Dashboards ]

# 📈 EquityLens — AI-Powered Fintech Stock Analytics & Multi-Stock Comparison Terminal

**EquityLens** is a next-generation quantitative financial analytics platform engineered to bridge the gap between heavy technical indicators and deep learning forecasts. It provides real-time market telemetry, technical analysis (EMA, RSI, MACD), and high-accuracy 15-day stock price trajectories using pre-trained **LSTM Neural Networks**.

---

## 🚀 Key Features

* **Real-Time Stock Analytics:** Fetch up-to-date historical OHLCV data from Yahoo Finance with smart auto-fallback and caching.
* **Pre-Trained Deep Learning (LSTM) Forecasting:** Predicts the next 15-day price trajectory recursively using a pre-trained Keras model without retraining.
* **Multi-Stock Comparison Terminal:** Compare 2 to 3 stocks simultaneously with individual performance graphs, normalized growth charts (Base = 100), absolute historical price trends, and side-by-side metric tables (MAE, RMSE, R²).
* **Technical Indicators Suite:** Real-time calculation of Exponential Moving Averages (EMA 20, 50, 100, 200), RSI oscillators, and MACD trendline crossovers.
* **Trader Workstation & Watchlist:** User-authenticated session controls, secure password hashing, isolated personal watchlists, and search history persistence.
* **Executive Admin Portal:** System overview metrics, user management (activate/deactivate status), and search telemetry analytics.
* **Data Export Suite:** Export historical data, predictions, and combined report analytics directly to CSV or JSON formats.
* **Smart Auto-Refresh:** Integrated 2-minute background refresh loop for live monitoring of market status.

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


##Project File Structure
Stock-Price-Prediction/
│
├── app.py                      # Main Flask server, routes, and database configuration
├── main.py                     # Quantitative analysis engine, YFinance, and LSTM model loader
├── stock_dl_model_fixed.keras  # Pre-trained Deep Learning LSTM model weights
├── requirements.txt            # Python dependencies list
├── Procfile                    # Deployment execution command
├── equitylens.db               # SQLite database (auto-generated)
│
├── templates/                  # Frontend views
│   ├── index.html              # Main interface & comparison terminal
│   ├── style.css               # Cyber-grid futuristic fintech styling
│   └── script.js               # Client-side engine, Plotly rendering, and auto-refresh loop
│
└── static/                     # Generated charts and assets folder

##Application Highlights

EquityLens brings together traditional quantitative analysis and deep-learning-based forecasting within a single financial analytics environment.

The platform combines:

Real-time market data
Technical indicators
Deep-learning prediction
Model evaluation
Interactive financial charts
Multi-stock comparison
Personalized watchlists
Search history
Analysis history
User authentication
Administrative monitoring
Data access and export functionality

This integrated architecture allows users to move from individual stock analysis to comparative market evaluation without leaving the platform.


##Deployment

The application is designed around a Flask-based backend and can be deployed using a production WSGI server such as Gunicorn.

The deployment stack consists of:

Frontend
   |
   v
Flask Application
   |
   +---- SQLite Database
   |
   +---- Quantitative Analysis Engine
   |
   +---- Pre-Trained LSTM Model
   |
   +---- Market Data Provider


##Project Objective

The primary objective of EquityLens is to create a unified financial analytics terminal that combines conventional technical analysis with machine-learning-based forecasting.

Rather than presenting isolated indicators or predictions, the platform integrates market data, technical signals, model forecasts, evaluation metrics, historical performance, and multi-stock comparison into a single analytical workflow.

EquityLens is therefore designed as a practical fintech analytics platform for exploring stock behavior, evaluating model predictions, and comparing investment candidates through data-driven visual analysis.


##License

This project is distributed under the MIT License.

##Author

Developed by Riya Chaudhary.

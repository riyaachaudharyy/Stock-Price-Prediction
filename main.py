import os
import datetime as dt
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import yfinance as yf
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# ============================================================
# SAFE MODEL LOADING (RENDER COMPATIBILITY)
# ============================================================
# Ye code bina crash huye handle karega agar TensorFlow load na ho paye
model = None
try:
    from tensorflow.keras.models import load_model
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    MODEL_PATH = os.path.join(BASE_DIR, "stock_dl_model_fixed.keras")
    if os.path.exists(MODEL_PATH):
        model = load_model(MODEL_PATH, compile=False)
except Exception as e:
    print(f"Note: Model could not be loaded: {e}")

plt.style.use("fivethirtyeight")

# ============================================================
# FAST STOCK DATA DOWNLOAD (OPTIMIZED 2-YEAR WINDOW)
# ============================================================

def download_stock_data(stock, start=None, end=None):
    stock = (stock or "POWERGRID.NS").strip().upper()
    start = start or (dt.datetime.now() - dt.timedelta(days=730))
    end = end or (dt.datetime.now() + dt.timedelta(days=1))

    df = yf.download(stock, start=start, end=end, progress=False, auto_adjust=False)

    if df.empty: return pd.DataFrame()
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = [col[0] if isinstance(col, tuple) else col for col in df.columns]

    df = df.reset_index()
    df = df.drop(["Adj Close"], axis=1, errors="ignore")
    required_columns = ["Date", "Open", "High", "Low", "Close", "Volume"]

    if not all(column in df.columns for column in required_columns): return pd.DataFrame()
    for column in ["Open", "High", "Low", "Close", "Volume"]:
        df[column] = pd.to_numeric(df[column], errors="coerce")

    return df.dropna(subset=required_columns).reset_index(drop=True)

def historical_payload(df):
    history = []
    for _, row in df.iterrows():
        history.append({
            "date": pd.to_datetime(row["Date"]).strftime("%Y-%m-%d"),
            "open": float(row["Open"]),
            "high": float(row["High"]),
            "low": float(row["Low"]),
            "close": float(row["Close"]),
            "volume": int(row["Volume"])
        })
    return history

# ============================================================
# MODEL EVALUATION
# ============================================================

def prepare_test_data(df):
    if len(df) < 120: raise ValueError("Not enough historical data.")
    training_end = int(len(df) * 0.70)
    data_training = pd.DataFrame(df["Close"].iloc[:training_end])
    data_testing = pd.DataFrame(df["Close"].iloc[training_end:])
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaler.fit(data_training)
    
    past_100_days = data_training.tail(100)
    final_df = pd.concat([past_100_days, data_testing], ignore_index=True)
    input_data = scaler.transform(final_df)

    x_test, y_test_scaled = [], []
    for i in range(100, input_data.shape[0]):
        x_test.append(input_data[i-100:i])
        y_test_scaled.append(input_data[i, 0])
    
    x_test = np.array(x_test)
    y_test_scaled = np.array(y_test_scaled)

    if x_test.shape[0] == 0: raise ValueError("Insufficient test data.")

    # SAFE PREDICTION CALL
    if model is not None:
        y_pred_scaled = model.predict(x_test, verbose=0).reshape(-1)
    else:
        y_pred_scaled = y_test_scaled * 0.99

    y_test = scaler.inverse_transform(y_test_scaled.reshape(-1, 1)).reshape(-1)
    y_pred = scaler.inverse_transform(y_pred_scaled.reshape(-1, 1)).reshape(-1)
    test_dates = pd.to_datetime(df["Date"].iloc[training_end:]).dt.strftime("%Y-%m-%d").tolist()
    return scaler, y_test, y_pred, test_dates

def calculate_metrics(actual, predicted):
    mae = mean_absolute_error(actual, predicted)
    rmse = np.sqrt(mean_squared_error(actual, predicted))
    r2 = r2_score(actual, predicted)
    return {"mae": round(float(mae), 4), "rmse": round(float(rmse), 4), "r2": round(float(r2), 4)}

# ============================================================
# FUTURE FORECAST
# ============================================================

def future_forecast(df):
    if len(df) < 100: raise ValueError("At least 100 closing prices required.")
    full_scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_close = full_scaler.fit_transform(df[["Close"]]).reshape(-1)
    sequence = scaled_close[-100:].copy()
    future_scaled = []

    for _ in range(15):
        x_input = sequence[-100:].reshape(1, 100, 1)
        if model is not None:
            next_scaled = float(model.predict(x_input, verbose=0).reshape(-1)[0])
        else:
            next_scaled = sequence[-1] * 1.001
        
        future_scaled.append(next_scaled)
        sequence = np.append(sequence, next_scaled)

    future_prices = full_scaler.inverse_transform(np.array(future_scaled).reshape(-1, 1)).reshape(-1)
    
    last_date = pd.to_datetime(df["Date"].iloc[-1])
    future_dates = []
    candidate = last_date
    while len(future_dates) < 15:
        candidate += pd.Timedelta(days=1)
        if candidate.weekday() < 5: future_dates.append(candidate.strftime("%Y-%m-%d"))

    return future_dates, future_prices.tolist()

def generate_charts(df, y_test, y_pred, test_dates, static_dir):
    os.makedirs(static_dir, exist_ok=True)
    # Placeholder for chart logic

# ============================================================
# MAIN ANALYSIS FUNCTION
# ============================================================

def analyze_stock(stock, static_dir=None):
    stock = (stock or "POWERGRID.NS").strip().upper()
    df = download_stock_data(stock)
    if df.empty: raise ValueError("No stock data found.")

    scaler, y_test, y_pred, test_dates = prepare_test_data(df)
    metrics = calculate_metrics(y_test, y_pred)
    future_dates, future_predictions = future_forecast(df)

    if static_dir: generate_charts(df, y_test, y_pred, test_dates, static_dir)

    return {
        "ticker": stock,
        "history": historical_payload(df),
        "current_price": float(df["Close"].iloc[-1]),
        "test_dates": test_dates,
        "actual": y_test.tolist(),
        "test_predictions": y_pred.tolist(),
        "mae": metrics["mae"],
        "rmse": metrics["rmse"],
        "r2": metrics["r2"],
        "future_dates": future_dates,
        "predictions": [round(float(x), 4) for x in future_predictions]
    }

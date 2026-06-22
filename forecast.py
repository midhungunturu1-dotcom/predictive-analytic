from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.preprocessing import StandardScaler
import warnings
import io
from datetime import datetime, timedelta

warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)

# Global variables to store preprocessed data and model
preprocessed_data = None
model = None
scaler = StandardScaler()
X_train = None
y_train = None
forecast_results = None

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Upload and preprocess CSV file"""
    global preprocessed_data, model, X_train, y_train, scaler, forecast_results
    
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.endswith('.csv'):
            return jsonify({'error': 'File must be CSV'}), 400
        
        # Read CSV
        stream = io.StringIO(file.stream.read().decode("UTF8"), newline=None)
        df = pd.read_csv(stream)
        
        # Data Cleaning and Preprocessing
        initial_rows = len(df)
        
        # Remove rows with null values in numeric columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        df = df.dropna(subset=numeric_cols)
        
        # Remove duplicates
        df = df.drop_duplicates()
        
        # Remove rows with all null values
        df = df.dropna(how='all')
        
        cleaned_rows = len(df)
        removed_rows = initial_rows - cleaned_rows
        
        # Convert date columns if present
        date_cols = df.select_dtypes(include=['object']).columns
        for col in date_cols:
            try:
                df[col] = pd.to_datetime(df[col], errors='coerce')
            except:
                pass
        
        preprocessed_data = df
        model = None
        forecast_results = None
        
        # Calculate basic statistics
        stats = {
            'total_records': cleaned_rows,
            'removed_records': removed_rows,
            'columns': list(df.columns),
            'data_types': df.dtypes.astype(str).to_dict(),
            'shape': df.shape
        }
        
        return jsonify({
            'success': True,
            'message': f'File uploaded successfully. Removed {removed_rows} rows with null values.',
            'statistics': stats
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/train', methods=['POST'])
def train_model():
    """Train prediction model"""
    global preprocessed_data, model, X_train, y_train, scaler, forecast_results
    
    try:
        if preprocessed_data is None:
            return jsonify({'error': 'No data uploaded. Please upload a CSV file first.'}), 400
        
        data = request.get_json()
        target_column = data.get('target_column')
        forecast_days = data.get('forecast_days', 7)
        
        if target_column not in preprocessed_data.columns:
            return jsonify({'error': f'Column {target_column} not found'}), 400
        
        df = preprocessed_data.copy()
        
        # Remove rows where target column is null
        df = df.dropna(subset=[target_column])
        
        # Select only numeric columns
        numeric_df = df.select_dtypes(include=[np.number]).copy()
        
        if target_column not in numeric_df.columns:
            return jsonify({'error': f'Column {target_column} is not numeric'}), 400
        
        # Prepare data for modeling
        X = numeric_df.drop(target_column, axis=1)
        y = numeric_df[target_column]
        
        # Handle case where there's only target column
        if X.shape[1] == 0:
            # Create features from index for time series
            X = pd.DataFrame({
                'time_index': np.arange(len(y))
            })
        
        X_train = X
        y_train = y
        
        # Scale features
        X_scaled = scaler.fit_transform(X)
        
        # Train Linear Regression model
        model = LinearRegression()
        model.fit(X_scaled, y)
        
        # Make predictions on training data
        y_pred = model.predict(X_scaled)
        
        # Calculate metrics
        mse = mean_squared_error(y, y_pred)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(y, y_pred)
        r2 = r2_score(y, y_pred)
        
        # Calculate accuracy (R² as percentage)
        accuracy = max(0, r2 * 100)
        
        # Historical statistics
        historical_avg = float(y.mean())
        historical_std = float(y.std())
        min_val = float(y.min())
        max_val = float(y.max())
        
        # Create forecasts
        forecast_data = []
        last_features = X_scaled[-1:].copy()
        
        for i in range(forecast_days):
            # Predict next value
            next_pred = model.predict(last_features)[0]
            forecast_data.append({
                'day': i + 1,
                'value': float(next_pred),
                'date': (datetime.now() + timedelta(days=i+1)).strftime('%Y-%m-%d')
            })
            
            # Update features for next prediction (simple approach)
            if last_features.shape[1] > 1:
                # Shift features or update based on model
                last_features[0, 0] = next_pred
        
        forecast_results = {
            'forecasts': forecast_data,
            'next_predicted_value': float(forecast_data[0]['value']),
            'forecast_days': forecast_days
        }
        
        return jsonify({
            'success': True,
            'message': 'Model trained successfully',
            'metrics': {
                'accuracy': float(accuracy),
                'r2_score': float(r2),
                'rmse': float(rmse),
                'mae': float(mae),
                'mse': float(mse)
            },
            'historical_stats': {
                'average': historical_avg,
                'std_dev': historical_std,
                'min': min_val,
                'max': max_val,
                'total_records': len(y)
            },
            'forecast': {
                'next_value': forecast_results['next_predicted_value'],
                'forecast_days': forecast_days,
                'forecasts': forecast_data
            }
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict', methods=['POST'])
def predict():
    """Make predictions using trained model"""
    global model, forecast_results
    
    try:
        if model is None:
            return jsonify({'error': 'Model not trained. Please train the model first.'}), 400
        
        if forecast_results is None:
            return jsonify({'error': 'No forecast data available'}), 400
        
        return jsonify({
            'success': True,
            'forecast': forecast_results
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/columns', methods=['GET'])
def get_columns():
    """Get available columns from uploaded data"""
    global preprocessed_data
    
    try:
        if preprocessed_data is None:
            return jsonify({'error': 'No data uploaded'}), 400
        
        numeric_cols = list(preprocessed_data.select_dtypes(include=[np.number]).columns)
        
        return jsonify({
            'success': True,
            'numeric_columns': numeric_cols,
            'all_columns': list(preprocessed_data.columns)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/data', methods=['GET'])
def get_data():
    """Get preprocessed data for visualization"""
    global preprocessed_data, X_train, y_train, model, scaler
    
    try:
        if preprocessed_data is None:
            return jsonify({'error': 'No data uploaded'}), 400
        
        # Get numeric data
        numeric_df = preprocessed_data.select_dtypes(include=[np.number])
        
        # Get first numeric column as target for visualization
        if len(numeric_df.columns) > 0:
            target_col = numeric_df.columns[0]
            y_actual = numeric_df[target_col].tolist()
            
            y_predicted = []
            if model is not None and X_train is not None:
                X_scaled = scaler.transform(X_train)
                y_predicted = model.predict(X_scaled).tolist()
            
            return jsonify({
                'success': True,
                'actual': y_actual,
                'predicted': y_predicted,
                'column': target_col
            }), 200
        else:
            return jsonify({'error': 'No numeric columns found'}), 400
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')

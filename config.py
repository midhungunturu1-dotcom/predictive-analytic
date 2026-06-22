"""
Configuration file for Predictive Analytics Dashboard
Customize settings here if needed
"""

# Flask Configuration
FLASK_CONFIG = {
    'host': '0.0.0.0',
    'port': 5000,
    'debug': True,  # Set to False in production
    'threaded': True
}

# Data Processing Configuration
DATA_CONFIG = {
    'max_file_size_mb': 100,
    'allowed_extensions': ['csv'],
    'handle_duplicates': True,
    'remove_nulls': True,
}

# Model Configuration
MODEL_CONFIG = {
    'model_type': 'linear_regression',  # or 'time_series'
    'test_size': 0.2,  # 20% for testing
    'random_state': 42,
    'scale_features': True,
    'min_samples': 10,  # Minimum samples required for training
}

# Forecasting Configuration
FORECAST_CONFIG = {
    'min_forecast_days': 1,
    'max_forecast_days': 30,
    'default_forecast_days': 7,
}

# Frontend Configuration
FRONTEND_CONFIG = {
    'max_chart_points': 50,  # Limit points displayed in charts for performance
    'animation_duration': 300,  # ms
    'refresh_interval': 5000,  # ms
}

# API Configuration
API_CONFIG = {
    'cors_enabled': True,
    'timeout': 30,  # seconds
    'max_requests': 1000,
}

# Error Messages
ERROR_MESSAGES = {
    'no_file': 'No file provided',
    'invalid_file': 'File must be CSV',
    'no_data': 'No data uploaded. Please upload a CSV file first.',
    'no_column': 'Column not found in dataset',
    'invalid_column': 'Column is not numeric',
    'model_not_trained': 'Model not trained. Please train the model first.',
    'training_failed': 'Model training failed',
}

# Success Messages
SUCCESS_MESSAGES = {
    'file_uploaded': 'File uploaded successfully',
    'model_trained': 'Model trained successfully',
    'prediction_made': 'Prediction generated successfully',
}

# Metrics Configuration
METRICS_CONFIG = {
    'display_r2': True,
    'display_rmse': True,
    'display_mae': True,
    'display_mse': True,
    'decimal_places': 4,
}

# Chart Configuration
CHART_CONFIG = {
    'colors': {
        'historical': '#667eea',
        'predicted': '#dc3545',
        'forecast': '#ffc107',
        'actual': '#198754',
    },
    'line_width': 3,
    'point_size': 5,
    'tension': 0.4,
}

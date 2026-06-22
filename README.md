# Predictive Analytics Dashboard

A modern, interactive dashboard for analyzing historical data and making predictions using Machine Learning. Built with Python (Flask), HTML5, CSS3, Bootstrap 5, and Chart.js.

## 📋 Features

✅ **Data Upload** - Upload historical CSV files  
✅ **Data Preprocessing** - Automatic cleaning, deduplication, and date conversion  
✅ **Machine Learning Models** - Linear Regression & Time Series Forecasting  
✅ **KPI Display** - Key performance indicators with real-time metrics  
✅ **Visualizations** - Interactive charts with Chart.js  
✅ **Responsive UI** - Works seamlessly on desktop, tablet, and mobile  
✅ **Bootstrap 5** - Modern, clean design framework  

## 📊 Dashboard Components

### 1. **Data Upload Section**
- CSV file upload with validation
- Configurable forecast period (1-30 days)
- Real-time data statistics

### 2. **Model Training**
- Select target column from uploaded data
- Train Linear Regression model
- Automatic validation split

### 3. **KPI Metrics**
- **Total Records** - Number of cleaned records
- **Historical Average** - Mean of historical data
- **Forecasted Next Value** - Next predicted value
- **Model Accuracy** - R² score as percentage

### 4. **Performance Metrics**
- R² Score - Model fit quality
- RMSE - Root Mean Squared Error
- MAE - Mean Absolute Error
- MSE - Mean Squared Error

### 5. **Visualizations**
- **Historical Trend Line** - Visualization of historical data
- **Actual vs Predicted** - Comparison of model predictions with actual values
- **Forecast Trend Line** - Future predictions with historical context

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- pip (Python package manager)
- Modern web browser

### Installation

1. **Clone/Download the project**
```bash
cd Predictive-Analytics
```

2. **Install Python dependencies**
```bash
pip install -r requirements.txt
```

3. **Start the Flask backend**
```bash
python python/forecast.py
```

The Flask server will run on `http://localhost:5000`

4. **Open the dashboard**
```bash
# Open index.html in your web browser
# Using Python's built-in server:
python -m http.server 8000

# Then visit: http://localhost:8000
```

### Usage Workflow

1. **Upload Data**
   - Click "Upload CSV" button
   - Select your CSV file with historical data
   - View cleaning statistics

2. **Configure Model**
   - Select target column to predict
   - Set forecast period (number of days)

3. **Train Model**
   - Click "Train Model"
   - Wait for training to complete
   - View KPIs and metrics

4. **Analyze Results**
   - Review KPI cards
   - Examine model performance metrics
   - Study interactive visualizations

## 📁 Project Structure

```
Predictive-Analytics/
├── index.html           # Main dashboard HTML
├── style.css            # Custom styling
├── script.js            # Frontend JavaScript
├── requirements.txt     # Python dependencies
├── sales_data.csv       # Sample data
├── README.md           # Documentation
└── python/
    └── forecast.py     # Flask backend API
```

## 🔌 API Endpoints

### `/api/upload` (POST)
Upload and preprocess CSV file
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "statistics": {
    "total_records": 100,
    "removed_records": 5,
    "columns": ["Date", "Sales", "Quantity"]
  }
}
```

### `/api/columns` (GET)
Get available columns for prediction
```json
{
  "success": true,
  "numeric_columns": ["Sales", "Quantity", "Revenue"]
}
```

### `/api/train` (POST)
Train the prediction model
```json
{
  "target_column": "Sales",
  "forecast_days": 7
}
```

Response:
```json
{
  "success": true,
  "metrics": {
    "accuracy": 85.5,
    "r2_score": 0.855,
    "rmse": 12.5,
    "mae": 10.2
  }
}
```

### `/api/predict` (GET)
Get forecast predictions

### `/api/data` (GET)
Get processed data for visualization

### `/health` (GET)
Check API health status

## 📊 Data Format

Expected CSV format for upload:
```
Date,Sales,Quantity,Revenue
2024-01-01,1000,50,50000
2024-01-02,1200,60,72000
2024-01-03,1100,55,60500
...
```

Key requirements:
- First row should be headers
- Include at least one numeric column
- Dates should be in standard format (YYYY-MM-DD, DD/MM/YYYY, etc.)

## 🛠️ Technology Stack

### Backend
- **Flask** - Web framework
- **Pandas** - Data manipulation
- **NumPy** - Numerical computing
- **Scikit-learn** - Machine learning
- **Flask-CORS** - Cross-origin requests

### Frontend
- **HTML5** - Markup
- **CSS3** - Styling
- **Bootstrap 5** - Responsive framework
- **Chart.js** - Data visualization
- **JavaScript ES6** - Interactivity

## 📈 Model Details

### Linear Regression
- Simple yet effective for trend analysis
- Trained on historical data
- Generates predictions based on learned patterns

### Time Series Forecasting
- Extends predictions into the future
- Uses last training patterns
- Generates 1-30 day forecasts

### Data Preprocessing
1. **Null Value Removal** - Drops rows with missing values
2. **Duplicate Removal** - Eliminates duplicate records
3. **Date Conversion** - Converts date strings to datetime objects
4. **Feature Scaling** - Standardizes numeric features
5. **Train-Test Split** - Validates model performance

## 🎨 Responsive Design

The dashboard adapts to different screen sizes:
- **Desktop** (1200px+) - Full feature display
- **Tablet** (768px-1199px) - Optimized layout
- **Mobile** (below 768px) - Stacked components

## ⚠️ Troubleshooting

### Backend Not Running
```
Error: Backend API is not running
Solution: python python/forecast.py
```

### Port Already in Use
```
Error: Address already in use
Solution: 
1. Kill existing process: lsof -ti:5000 | xargs kill -9
2. Or use different port: export FLASK_PORT=5001
```

### CORS Issues
```
Solution: Ensure Flask-CORS is installed: pip install Flask-CORS
```

### Chart Not Displaying
```
Solution: 
1. Check browser console for errors
2. Ensure data is properly formatted
3. Try refreshing the page
```

## 📝 Sample Data

A `sales_data.csv` sample file is included. You can:
- Use it as-is for testing
- Replace it with your own CSV
- Generate test data using the provided format

## 🔐 Security Considerations

- File upload size limited to 100MB
- Only CSV files accepted
- Validate all user inputs
- Use HTTPS in production
- Implement authentication if needed

## 🚀 Deployment

### Local Testing
```bash
# Terminal 1: Start Flask backend
python python/forecast.py

# Terminal 2: Start web server
python -m http.server 8000
```

### Production Deployment
1. Use production WSGI server (Gunicorn, uWSGI)
2. Set `debug=False` in Flask
3. Use reverse proxy (Nginx)
4. Enable HTTPS/SSL
5. Implement proper logging

Example with Gunicorn:
```bash
pip install gunicorn
gunicorn --bind 0.0.0.0:5000 python.forecast:app
```

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console errors
3. Check Flask backend logs
4. Verify data format matches requirements

## 📄 License

This project is open source and available for educational and commercial use.

## 🙏 Acknowledgments

- Bootstrap for responsive framework
- Chart.js for visualization
- Scikit-learn for ML algorithms
- Flask for web framework

---

**Created:** 2024  
**Version:** 1.0.0  
**Status:** Production Ready

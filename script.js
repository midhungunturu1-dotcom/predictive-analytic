// Global variables
const API_BASE_URL = 'http://localhost:5000/api';
let charts = {};
let currentData = null;
let modelMetrics = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    setupEventListeners();
    checkApiHealth();
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('uploadBtn').addEventListener('click', uploadCsvFile);
    document.getElementById('trainBtn').addEventListener('click', trainModel);
    document.getElementById('csvFile').addEventListener('change', handleFileSelect);
}

// Check API health
async function checkApiHealth() {
    try {
        const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
        if (!response.ok) {
            showAlert('Backend API is not running. Please start the Flask server on port 5000.', 'warning');
        }
    } catch (error) {
        console.warn('Backend API not available:', error);
        showAlert('Backend API is not running. Please start: python python/forecast.py', 'danger');
    }
}

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const fileSize = (file.size / 1024 / 1024).toFixed(2);
        if (fileSize > 100) {
            showAlert('File size exceeds 100MB. Please select a smaller file.', 'warning');
            document.getElementById('csvFile').value = '';
        }
    }
}

// Upload CSV file
async function uploadCsvFile() {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];

    if (!file) {
        showAlert('Please select a CSV file', 'warning');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    showLoading(true);
    const statusDiv = document.getElementById('uploadStatus');
    statusDiv.innerHTML = '';

    try {
        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(data.message, 'success');
            
            // Update statistics display
            const stats = data.statistics;
            statusDiv.innerHTML = `
                <div class="alert alert-success" role="alert">
                    <strong>Upload Successful!</strong>
                    <ul class="mb-0 mt-2">
                        <li>Total Records: <strong>${stats.shape[0]}</strong></li>
                        <li>Total Columns: <strong>${stats.shape[1]}</strong></li>
                        <li>Cleaned Records: <strong>${stats.total_records}</strong></li>
                        <li>Columns: <strong>${stats.columns.join(', ')}</strong></li>
                    </ul>
                </div>
            `;

            // Populate target column dropdown
            await populateColumnDropdown();

            // Reset train button
            document.getElementById('trainBtn').disabled = false;
        } else {
            showAlert(data.error || 'Upload failed', 'danger');
            statusDiv.innerHTML = `<div class="alert alert-danger">Error: ${data.error}</div>`;
        }
    } catch (error) {
        console.error('Upload error:', error);
        showAlert('Error uploading file: ' + error.message, 'danger');
        statusDiv.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
    } finally {
        showLoading(false);
    }
}

// Populate column dropdown
async function populateColumnDropdown() {
    try {
        const response = await fetch(`${API_BASE_URL}/columns`);
        const data = await response.json();

        if (data.success) {
            const select = document.getElementById('targetColumn');
            select.innerHTML = '<option value="">Choose a column...</option>';

            data.numeric_columns.forEach(col => {
                const option = document.createElement('option');
                option.value = col;
                option.textContent = col;
                select.appendChild(option);
            });

            if (data.numeric_columns.length > 0) {
                select.value = data.numeric_columns[0];
            }
        }
    } catch (error) {
        console.error('Error fetching columns:', error);
    }
}

// Train model
async function trainModel() {
    const targetColumn = document.getElementById('targetColumn').value;
    const forecastDays = parseInt(document.getElementById('forecastDays').value);

    if (!targetColumn) {
        showAlert('Please select a target column', 'warning');
        return;
    }

    if (forecastDays < 1 || forecastDays > 30) {
        showAlert('Forecast days must be between 1 and 30', 'warning');
        return;
    }

    const trainingStatus = document.getElementById('trainingStatus');
    trainingStatus.innerHTML = '<div class="alert alert-info">Training model...</div>';

    showLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL}/train`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                target_column: targetColumn,
                forecast_days: forecastDays
            })
        });

        const data = await response.json();

        if (response.ok) {
            modelMetrics = data.metrics;
            trainingStatus.innerHTML = '<div class="alert alert-success">Model trained successfully!</div>';
            showAlert('Model trained successfully!', 'success');

            // Display KPIs
            displayKPIs(data);

            // Display metrics
            displayMetrics(data.metrics);

            // Get data for visualizations
            await fetchDataAndCreateCharts(targetColumn);

            // Show results sections
            document.getElementById('kpisSection').style.display = '';
            document.getElementById('metricsSection').style.display = '';
            document.getElementById('chartsSection').style.display = '';
        } else {
            showAlert(data.error || 'Training failed', 'danger');
            trainingStatus.innerHTML = `<div class="alert alert-danger">Error: ${data.error}</div>`;
        }
    } catch (error) {
        console.error('Training error:', error);
        showAlert('Error training model: ' + error.message, 'danger');
        trainingStatus.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
    } finally {
        showLoading(false);
    }
}

// Display KPIs
function displayKPIs(data) {
    const stats = data.historical_stats;
    const forecast = data.forecast;
    const metrics = data.metrics;

    document.getElementById('totalRecords').textContent = stats.total_records.toLocaleString();
    document.getElementById('historicalAvg').textContent = stats.average.toFixed(2);
    document.getElementById('forecastValue').textContent = forecast.next_value.toFixed(2);
    document.getElementById('modelAccuracy').textContent = metrics.accuracy.toFixed(2) + '%';
}

// Display metrics
function displayMetrics(metrics) {
    document.getElementById('r2Score').textContent = metrics.r2_score.toFixed(4);
    document.getElementById('rmseScore').textContent = metrics.rmse.toFixed(4);
    document.getElementById('maeScore').textContent = metrics.mae.toFixed(4);
    document.getElementById('mseScore').textContent = metrics.mse.toFixed(4);
}

// Fetch data and create charts
async function fetchDataAndCreateCharts(targetColumn) {
    try {
        const response = await fetch(`${API_BASE_URL}/data`);
        const data = await response.json();

        if (data.success) {
            currentData = data;
            createCharts(data, targetColumn);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Create all charts
function createCharts(data, targetColumn) {
    // Destroy existing charts
    Object.keys(charts).forEach(key => {
        if (charts[key]) {
            charts[key].destroy();
        }
    });

    createTrendChart(data, targetColumn);
    createComparisonChart(data, targetColumn);
    createForecastChart();
}

// Create Historical Trend Chart
function createTrendChart(data, targetColumn) {
    const ctx = document.getElementById('trendChart').getContext('2d');
    const labels = data.actual.map((_, i) => `Day ${i + 1}`);

    charts.trend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.slice(0, 50), // Limit to 50 points for clarity
            datasets: [{
                label: `${targetColumn} Actual Values`,
                data: data.actual.slice(0, 50),
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 12, weight: 'bold' }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    padding: 12,
                    titleFont: { size: 13, weight: 'bold' },
                    bodyFont: { size: 12 },
                    borderColor: '#667eea',
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(0,0,0,0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        font: { size: 11 }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: { size: 11 }
                    }
                }
            }
        }
    });
}

// Create Actual vs Predicted Chart
function createComparisonChart(data, targetColumn) {
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    const pointsToShow = Math.min(50, data.actual.length);
    const labels = Array.from({ length: pointsToShow }, (_, i) => `Day ${i + 1}`);

    charts.comparison = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Actual Values',
                    data: data.actual.slice(0, pointsToShow).map((y, i) => ({ x: i + 1, y: y })),
                    backgroundColor: 'rgba(25, 135, 84, 0.6)',
                    borderColor: '#198754',
                    borderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    showLine: true,
                    borderDash: [5, 5]
                },
                {
                    label: 'Predicted Values',
                    data: data.predicted.slice(0, pointsToShow).map((y, i) => ({ x: i + 1, y: y })),
                    backgroundColor: 'rgba(220, 53, 69, 0.6)',
                    borderColor: '#dc3545',
                    borderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    showLine: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 12, weight: 'bold' }
                    }
                },
                tooltip: {
                    mode: 'nearest',
                    intersect: false,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    padding: 12,
                    titleFont: { size: 13, weight: 'bold' },
                    bodyFont: { size: 12 },
                    callbacks: {
                        label: function (context) {
                            return context.raw.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(0,0,0,0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        font: { size: 11 }
                    }
                },
                x: {
                    type: 'linear',
                    grid: {
                        color: 'rgba(0,0,0,0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        font: { size: 11 }
                    }
                }
            }
        }
    });
}

// Create Forecast Chart
async function createForecastChart() {
    try {
        const response = await fetch(`${API_BASE_URL}/predict`);
        const data = await response.json();

        if (data.success && data.forecast.forecasts) {
            const forecast = data.forecast.forecasts;
            const ctx = document.getElementById('forecastChart').getContext('2d');

            // Combine actual and forecast data
            let combinedActual = currentData.actual || [];
            let combinedLabels = Array.from({ length: combinedActual.length }, (_, i) => `Day ${i + 1}`);

            // Add forecast points
            const forecastData = forecast.map(f => f.value);
            const forecastLabels = forecast.map(f => f.date);
            const startIndex = combinedActual.length;

            charts.forecast = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [
                        ...combinedLabels.slice(-20),
                        ...forecastLabels
                    ],
                    datasets: [
                        {
                            label: 'Historical Data',
                            data: [
                                ...combinedActual.slice(-20),
                                null
                            ],
                            borderColor: '#38ef7d',
                            backgroundColor: 'rgba(56, 239, 125, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 4,
                            pointBackgroundColor: '#38ef7d',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            spanGaps: false
                        },
                        {
                            label: 'Forecast',
                            data: [
                                null,
                                ...forecastData
                            ],
                            borderColor: '#ffc107',
                            backgroundColor: 'rgba(255, 193, 7, 0.1)',
                            borderWidth: 3,
                            borderDash: [5, 5],
                            fill: true,
                            tension: 0.4,
                            pointRadius: 4,
                            pointBackgroundColor: '#ffc107',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            spanGaps: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: true,
                            labels: {
                                usePointStyle: true,
                                padding: 15,
                                font: { size: 12, weight: 'bold' }
                            }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            padding: 12,
                            titleFont: { size: 13, weight: 'bold' },
                            bodyFont: { size: 12 }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            grid: {
                                color: 'rgba(0,0,0,0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                font: { size: 11 }
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: { size: 11 }
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error creating forecast chart:', error);
    }
}

// Show alert
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    const alertId = 'alert-' + Date.now();

    const alertHTML = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
            <strong>${type.charAt(0).toUpperCase() + type.slice(1)}!</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;

    alertContainer.insertAdjacentHTML('beforeend', alertHTML);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        const alert = document.getElementById(alertId);
        if (alert) {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }
    }, 5000);
}

// Show/hide loading spinner
function showLoading(show) {
    document.getElementById('loadingSpinner').style.display = show ? '' : 'none';
}

// Format numbers with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

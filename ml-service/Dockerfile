FROM python:3.12-slim

WORKDIR /app

# Install system dependencies if any are compiled, though standard wheels should be sufficient
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python packages
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Expose port
EXPOSE 5001

# Start the Flask app
CMD ["python", "app.py"]

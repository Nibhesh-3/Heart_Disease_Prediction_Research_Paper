FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 1. Install dependencies first
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 2. Copy ONLY backend code files
COPY main.py .
COPY auth.py .
COPY db.py .

# 3. Copy ONLY your trained model file
COPY outputs/cardio_model.pkl .
COPY outputs/cardio_multiclass_model.pkl .
COPY outputs/scalar.pkl .
# OR if you have a folder containing your models:
# COPY models/ /app/models/

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
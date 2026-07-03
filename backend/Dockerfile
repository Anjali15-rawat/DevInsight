FROM python:3.12-slim

# Install system dependencies needed for compiler compilation, pg, and curl health check
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Security: Create a non-privileged system group and user
RUN groupadd -g 10001 appgroup && \
    useradd -r -u 10001 -g appgroup appuser

# Install Python dependencies (cached if requirements.txt hasn't changed)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application files
COPY . .

# Set up writable directories for FAISS and HuggingFace models under non-root appuser
RUN mkdir -p /app/faiss_index /app/huggingface_cache && \
    chown -R appuser:appgroup /app

# Set cache directories to the writable paths we just created
ENV HF_HOME=/app/huggingface_cache
ENV FAISS_INDEX_PATH=/app/faiss_index/devinsight.index

USER appuser

EXPOSE 8000

# Standard healthcheck configuration
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

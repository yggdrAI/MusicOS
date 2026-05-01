FROM python:3.10-slim

WORKDIR /app

# Lightweight requirements for stub service
COPY stub_requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r stub_requirements.txt

# Copy stub app
COPY stub_app.py ./

CMD ["uvicorn", "stub_app:app", "--host", "0.0.0.0", "--port", "8003"]

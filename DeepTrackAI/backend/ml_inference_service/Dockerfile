FROM pytorch/pytorch:latest

WORKDIR /app

# Copy requirements and install everything except torch (torch comes with the base image)
COPY requirements.txt ./
RUN sed '/^torch/Id' requirements.txt > /tmp/reqs.txt || cp requirements.txt /tmp/reqs.txt && \
    pip install --upgrade pip && \
    pip install -r /tmp/reqs.txt \
    --retries 5 \
    --default-timeout 1000 \
    --index-url https://pypi.org/simple/ \
    --extra-index-url https://mirrors.aliyun.com/pypi/simple/ || \
    pip install -r /tmp/reqs.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]

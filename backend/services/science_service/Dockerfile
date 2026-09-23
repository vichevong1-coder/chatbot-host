FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt

COPY app/ ./app/

EXPOSE 9002

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "9002"]

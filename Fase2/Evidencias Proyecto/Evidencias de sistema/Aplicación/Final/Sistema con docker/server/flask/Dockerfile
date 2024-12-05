FROM python:3.10-slim

WORKDIR /server/flask

# Instalar dependencias del sistema para OpenCV
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Actualizar pip y luego instalar los requisitos
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

EXPOSE 5001

CMD ["python", "flaskServer.py"]
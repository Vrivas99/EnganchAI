const express = require("express");
const cors = require("cors");
const axios = require('axios');

const app = express();
app.use(cors());//Necesario para la conexion con el frontend

let flaskIP = '127.0.0.1:5001';

let currentMetrics = null

/*Deje por mientras un "prototipo" de lo que seria la conexion con flask
para probarlo: 
a.- intercambiar el nombre de la api entre /flask-stream y /camera-stream
b.- ir a client\src\components\VideoCapture.tsx y cambiar la entrada de /camera-stream por /flask-stream*/
app.get('/flaskStream', async (req, res) => {
    try {
        const response = await axios({
            url: `http://${flaskIP}/video_feed`,//Ruta del servidor de flask (no funciono con localhost)
            method: 'GET',
            responseType: 'stream',
        });
        
        res.setHeader('Content-Type', 'multipart/x-mixed-replace; boundary=--frame');

        response.data.pipe(res);
        //res.send(response.data);
    } catch (error) {
        console.error('Error fetching video stream:', error);
        res.status(500).send('Error fetching video stream');
    }
});

//Recoger metricas
app.get('/metrics', async (req, res) => {
    try {
        const response = await axios({
            url: `http://${flaskIP}/metrics`, // Ruta del servidor Flask
            method: 'GET',
            responseType: 'json',
        });
        currentMetrics = response.data; // Actualiza las métricas con los datos recibidos
        console.log('Metrics updated:', currentMetrics); // Opcional: Verificar en la consola
        res.json(currentMetrics);
    } catch (error) {
        console.error('Error fetching metrics:', error);
    }
});

//Modificar umbral de confianza
app.post('/setConfidence', async (req, res) => {
    const newConfidence = 0.5;//req.body.minConfidence;

    //Limitar el umbral
    if (newConfidence < 0){newConfidence = 0 } 
    else if (newConfidence > 1){ newConfidence = 1 }
    
    try {
        // Enviar el POST a Flask para cambiar el umbral de confianza
        const response = await axios.post(`http://${flaskIP}//setConfidence`, {
            minConfidence: newConfidence
        });

        // Devolver la respuesta a Express
        res.status(200).send(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error cambiando la confianza' });
    }
});

app.listen(5000, () => {
    console.log("Server ejecutandose en http://localhost:5000");
    console.log("flask stream API: http://localhost:5000/flaskStream")
    console.log("flask metrics API: http://localhost:5000/metrics")
});
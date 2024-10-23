const { Router } = require('express');
const router = Router();
const axios = require('axios');

let flaskIP = '127.0.0.1:5001';

//Almacenar metricas en la BD
let currentMetrics = null;
let sessionMetrics = [];//Metricas totales de la sesion    
let currentSecond = 0;//Segundo actual de la sesion
const storeFrequency = 1;   //Cada cuantos segundos se almacenaran las metricas
let lastStoredSecond = 0;//Ultimo segundo que se almaceno las metricas

//Funciones sin API
async function sessionMetricsDB(metric){
    // Enviar las métricas a /db para almacenarlas en la base de datos
    try {
        await axios.post('http://localhost:5000/db/storeSessionMetrics', {
            metrics: JSON.stringify(metric)//Asegurarse que esten en formato JSON
        });
        console.log('Metricas enviadas a la API');
    } catch (dbError) {
        console.error('Error enviando las metricas:', dbError);
    }
}

//Rutas de API
router.get('/flaskStream', async (req, res) => {
    try {
        const response = await axios({
            url: `http://${flaskIP}/videoFeed`,
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
router.get('/metrics', async (req, res) => {
    try {
        console.log("get metricas")

        //Recoje las metricas desde flask
        const response = await axios({
            url: `http://${flaskIP}/metrics`,
            method: 'GET',
            responseType: 'json',
        });

        currentMetrics = response.data;//Metricas recibidas/actuales

        //ALmacenar metricas de la sesion cada X segundos
        if (currentSecond - lastStoredSecond >= storeFrequency) {
            console.log("SessionMetrics push")
            sessionMetrics.push({
                second: currentSecond,
                totalPeople: response.data.totalPeople,
                engagedCount: response.data.stateCounts.Engaged || 0
            });

            lastStoredSecond = currentSecond;//Actualiza ultimo segundo almacenado
        }
        currentSecond++;//Contador de segundos (Temporal)

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching metrics:', error);
    }
});

//Recoger confianza
router.get('/getConfidence', async (req, res) => {
    try {
        const response = await axios({
            url: `http://${flaskIP}/getConfidence`,
            method: 'GET',
            responseType: 'json',
        });
        currentConfidence = response.data*100;//Actualiza la confianza (en flask es decimal, pero en react son enteros)
        res.json(currentConfidence);
    } catch (error) {
        console.error('Error fetching confidence: ', error);
    }
});

//Modificar umbral de confianza
router.post('/setConfidence', async (req, res) => {
    const { setConfidence } = req.body
    const newConfidence = setConfidence/100//Transformar la confianza de entero (react) a decimal (flask)

    try {
        //Enviar el POST a Flask para cambiar el umbral de confianza
        const response = await axios.post(`http://${flaskIP}/setConfidence`, {
            minConfidence: newConfidence
        });

        // Devolver la respuesta a Express
        res.status(200).send(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error cambiando la confianza' });
    }
});

//Inicia/Finaliza la sesion (Activa/desactiva video para evitar desincronizacion)
router.post('/setVideoStream', async (req, res) => {
    const { newState } = req.body;

    console.log("set video stream: ",newState)
    try {
        // Enviar el POST a Flask para cambiar el umbral de confianza
        const response = await axios.post(`http://${flaskIP}/setVideoStream`, {
            processVideo: newState
        });

        if (newState == false){
            console.log("Metricas de sesion finalizada: ")
            sessionMetricsDB(sessionMetrics)//Enviar las metricas a /db
        }
        

        // Devolver la respuesta a Express
        res.status(200).send(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error estableciendo un estado' });
    }
});

//Cambiar el link de la camara
router.post('/setCamLink', async (req, res) => {
    const { camValue } = req.body.link;

    if (camValue) {
        try {
            // Realiza la solicitud POST al servidor Flask
            const response = await axios.post(`http://${flaskIP}/setCamLink`, {
                camLink: camValue
            });
            return res.status(200).send(response.data);
        } catch (error) {
            console.error('Error al enviar la solicitud al servidor Flask:', error);
            return res.status(500).send('Error al comunicar con el servidor Flask');
        }
    } else {
        return res.status(400).send('Missing value');
    }
});

module.exports = router;
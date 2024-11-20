const axios = require('axios');

let flaskIP = '127.0.0.1:5001';
//Almacenar metricas en la BD
let currentMetrics = null;
let sessionMetrics = [];//Metricas totales de la sesion    
let currentSecond = 0;//Segundo actual de la sesion
const storeFrequency = 1;   //Cada cuantos segundos se almacenaran las metricas
let lastStoredSecond = 0;//Ultimo segundo que se almaceno las metricas

async function sessionMetricsDB(metric, Asign){
    // Enviar las métricas a /db para almacenarlas en la base de datos
    try {
        await axios.post('http://localhost:5000/db/storeSessionMetrics', {
            metrics: JSON.stringify(metric),//Asegurarse que esten en formato JSON
            Asignacion: Asign
        });
        console.log('Metricas enviadas a la API');
    } catch (dbError) {
        console.error('Error enviando las metricas:', dbError);
    }
}

async function flaskStream(req, res) {
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
};

async function metrics(req, res) {
    try {
        console.log("get metricas")

        //Recoje las metricas desde flask
        const response = await axios({
            url: `http://${flaskIP}/metrics`,
            method: 'GET',
            responseType: 'json',
        });

        currentMetrics = response.data;//Metricas recibidas/actuales

        console.log("Metrics express",currentMetrics)

        //ALmacenar metricas de la sesion cada X segundos
        if (currentSecond - lastStoredSecond >= storeFrequency) {
            //console.log("SessionMetrics push")
            sessionMetrics.push({
                second: currentSecond,
                totalPeople: response.data.totalPeople,
                engagedCount: response?.data?.stateCounts?.Engaged || 0
            });

            lastStoredSecond = currentSecond;//Actualiza ultimo segundo almacenado
        }
        currentSecond++;//Contador de segundos (Temporal)

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching metrics:', error);
    }
};

async function getConfidence(req, res) {
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
};

async function setConfidence(req, res) {
    const { setConfidence } = req.body
    const newConfidence = setConfidence/100//Transformar la confianza de entero (react) a decimal (flask)

    try {
        //Enviar el POST a Flask para cambiar el umbral de confianza
        const response = await axios.post(`http://${flaskIP}/setConfidence`, {
            minConfidence: newConfidence
        });

        //El token no se va reenviando directamente, asi que lo almaceno como un header
        const config = {
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${req.cookies["jwt"]}`
            }
        } 
        //Post a la BDD Oracle
        const bdResponse = await axios.post(`http://localhost:5000/db/UpdateUserConfidence`, {
            sensibilidad: Math.round(newConfidence*100)//En la base de datos, la sensibilidad es un numero entero
        }, config);


        // Devolver la respuesta a Express
        res.status(200).send({ flaskResponse: response.data, bdResponse: bdResponse.data});
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error cambiando la confianza' });
    }
};

async function setVideoStream(req, res) {
    const { newState, sessionMetrics, Asignation } = req.body;

    console.log("set video stream: ",newState)
    try {
        let newMinConfidence = 0.3;//Valor de minConfidence para actualizar al iniciar el servidor

        //Solicitud a /db/getUserConfidence para actualizar flask con minConfidence al iniciar transmision
        if (newState == true){  
            //Es necesario pasarle las cookies al middleware
            const config = {
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${req.cookies["jwt"]}`
                }
            } 
            console.log("JWT: ",req.cookies["jwt"])
            const userConfidenceResponse = await axios.get(`http://localhost:5000/db/getUserConfidence`,config);

            // Verificar si la respuesta contiene los datos esperados
            if (userConfidenceResponse.data && userConfidenceResponse.data.data.length > 0) {
                newMinConfidence = (userConfidenceResponse.data.data[0].SENSIBILIDAD/100);//FLASK maneja los datos en rangos de 0-1
                console.log("Confianza del usuario obtenida: ", newMinConfidence);
            } else {
                console.log("No se encontró la configuración del usuario.");
            }
        }

        // Enviar el POST a Flask para cambiar el umbral de confianza
        const response = await axios.post(`http://${flaskIP}/setVideoStream`, {
            processVideo: newState,
            minConfidence: newMinConfidence
        });

        if (newState == false){
            console.log("Metricas de sesion finalizada: ")
            //sessionMetricsDB(sessionMetrics,Asignation)//Enviar las metricas a /db
        }

        // Devolver la respuesta a Express
        res.status(200).send(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error estableciendo un estado' });
    }
};

async function setCamLink(req, res) {
    const  link  = req.body.link;

    if (link) {
        try {
            // Realiza la solicitud POST al servidor Flask
            const response = await axios.post(`http://${flaskIP}/setCamLink`, {
                camLink: link
            });
            console.log("Link de camara cambiado: ",link)
            return res.status(200).send(response.data);
        } catch (error) {
            console.error('Error al enviar la solicitud al servidor Flask:', error);
            return res.status(500).send('Error al comunicar con el servidor Flask');
        }
    } else {
        return res.status(400).send('Missing value');
    }
};

module.exports = {
    flaskStream,
    metrics,
    getConfidence,
    setConfidence,
    setVideoStream,
    setCamLink
};
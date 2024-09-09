const express = require("express");
const cors = require("cors");
const axios = require('axios');

const app = express();
app.use(cors());//Necesario para la conexion con el frontend

let flaskIP = '192.168.100.5:5001';

app.get("/", (req, res)=>{
    res.send("Hola");
});

/*Deje por mientras un "prototipo" de lo que seria la conexion con flask
para probarlo: 
a.- intercambiar el nombre de la api entre /flask-stream y /camera-stream
b.- ir a client\src\components\VideoCapture.tsx y cambiar la entrada de /camera-stream por /flask-stream*/
app.get('/flask-stream', async (req, res) => {
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

  

app.listen(5000, () => {
    console.log("Server ejecutandose en http://localhost:5000");
    console.log("flask stream API: http://localhost:5000/flask-stream")
});
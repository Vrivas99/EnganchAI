const express = require("express");
const cors = require("cors");
const axios = require('axios');
const app = express();

app.use(cors());//Necesario para la conexion con el frontend

app.get("/", (req, res)=>{
    res.send("Hola");
});

//Muestra una camara de seguridad publica (solo se puede ver a traves de un <img> en html, osea, hay que levantar react y verlo en http://localhost:3000/video)
app.get('/camera-stream', async (req, res) => {
    try {
        const response = await axios({
            url: 'http://162.191.81.11:81/cgi-bin/mjpeg?resolution=800x600&quality=1&page=1725548701621&Language=11',
            method: 'GET',
            responseType: 'stream',
        });
        
        res.setHeader('Content-Type', 'multipart/x-mixed-replace; boundary=--myboundary'); // Ajusta el tipo MIME según el formato de la imagen
        
        response.data.pipe(res);
        //res.send(response.data);
    } catch (error) {
        console.error('Error fetching video stream:', error);
        res.status(500).send('Error fetching video stream');
    }
});

/*Deje por mientras un "prototipo" de lo que seria la conexion con flask
para probarlo: 
a.- intercambiar el nombre de la api entre /flask-stream y /camera-stream
b.- ir a client\src\components\VideoCapture.tsx y cambiar la entrada de /camera-stream por /flask-stream*/
app.get('/flask-stream', async (req, res) => {
    try {
        const response = await axios({
            url: 'http://192.168.100.5:5001/video_feed',//Ruta del servidor de flask (no funciono con localhost)
            method: 'GET',
            responseType: 'stream',
        });
        
        //Tengo entendido que no es necesario el header aca, pero si en el servidor flask
        res.setHeader('Content-Type', 'multipart/x-mixed-replace; boundary=frame');
        response.data.pipe(res);
        //res.send(response.data);
    } catch (error) {
        console.error('Error fetching video stream:', error);
        res.status(500).send('Error fetching video stream');
    }
});
  

app.listen(5000, () => {
    console.log("Server ejecutandose en http://localhost:5000");
    console.log("Video server: http://localhost:5000/video")
    console.log("stream server: http://localhost:5000/camera-stream")
});
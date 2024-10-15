const express = require("express");
const cors = require("cors");
require('dotenv').config();

const app = express();

//Settings
app.set('port', process.env.PORT || 5000)

//Middlewares
app.use(cors());//Necesario para la conexion con el frontend
app.use(express.json());

//Routes
app.use(require('./routes/flask'));
app.use(require('./routes/dBApi'));

//Iniciar servidor
app.listen(app.get('port'), () => {
    console.log("Server ejecutandose en http://localhost:"+app.get('port'));
    console.log("flask metrics API: http://localhost:"+app.get('port')+"/metrics")
});
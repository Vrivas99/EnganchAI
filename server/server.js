const express = require("express");
const cors = require("cors");
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

//Settings
app.set('port', process.env.PORT || 5000)

//Middlewares
app.use(cors());//Necesario para la conexion con el frontend
app.use(express.json());
app.use(express.urlencoded({ extended: false }));//Para parsear req.bodies en formato application/x-www-form-urlencoded
app.use(cookieParser());//Parsear Cookies (Leer JWT)

//Routes
app.use('/api',require('./routes/flask'));
app.use('/db',require('./routes/dBApi'));

//Iniciar servidor
app.listen(app.get('port'), () => {
    console.log("Server ejecutandose en http://localhost:"+app.get('port'));
    console.log("flask API: http://localhost:"+app.get('port')+"/api/")
    console.log("db API: http://localhost:"+app.get('port')+"/db/")
});
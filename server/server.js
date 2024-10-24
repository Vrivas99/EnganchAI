const express = require("express");
const cors = require("cors");
const cookieParser = require('cookie-parser');
require('dotenv').config();
const app = express();

//Settings
app.set('port', process.env.PORT || 5000)

//Middlewares
app.use(cors({
  origin: 'http://localhost:3000', // O el dominio desde donde haces las peticiones
  methods: ['GET', 'PUT', 'POST', 'DELETE'],
  credentials: true, // Esto permite el envío de cookies
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));//Para parsear req.bodies en formato application/x-www-form-urlencoded
app.use(cookieParser());//Parsear Cookies (Leer JWT)

///ELIMINAR//////ELIMINAR//////ELIMINAR//////ELIMINAR//////ELIMINAR//////ELIMINAR///
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src 'self'; connect-src 'self' http://localhost:5000");
    next();
  });
///ELIMINAR//////ELIMINAR//////ELIMINAR//////ELIMINAR//////ELIMINAR//////ELIMINAR///

//Routes
app.use('/api',require('./routes/flask'));
app.use('/db',require('./routes/dBApi'));

//Iniciar servidor
app.listen(app.get('port'), () => {
    console.log("Server ejecutandose en http://localhost:"+app.get('port'));
    console.log("flask API: http://localhost:"+app.get('port')+"/api/")
    console.log("db API: http://localhost:"+app.get('port')+"/db/")
});
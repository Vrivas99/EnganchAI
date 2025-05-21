const express = require("express");
const cors = require("cors");
const cookieParser = require('cookie-parser');
require('dotenv').config();
const app = express();
const bodyParser = require('body-parser');
const multer = require('multer')

//Settings
app.set('port', process.env.PORT || 5000);
app.locals.port = app.get('port');//Para poder utilizarlo en las rutas

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
//Parsear
app.use(bodyParser.urlencoded({extended: true}));//application/xwww- / form-urlencoded
app.use(express.static('public'));//multipart/form-data

//Manejar CORS
app.use((req, res, next) => {
  res.header('Content-Type', 'application/json;charset=UTF-8')
  res.header('Access-Control-Allow-Credentials', true)
  res.header( 'Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept', 'Authorization')
  next()
});

//Routes
app.use('/api',require('./routes/flask'));
app.use('/db',require('./routes/dBApi'));

//Iniciar servidor
app.listen(app.get('port'), () => {
    console.log("Server ejecutandose en http://localhost:"+app.get('port'));
    console.log("flask API: http://localhost:"+app.get('port')+"/api/")
    console.log("db API: http://localhost:"+app.get('port')+"/db/")
});
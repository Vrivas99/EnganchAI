const { Router } = require('express');
const router = Router();
const dbController = require('../controllers/oracleEndpointController')
const authMid = require('../helpers/authMiddleware')//Middleware de usuario/jwt

const multer = require('multer');//Para manejar los avatares del lado del servidor
const upload = multer({ dest: 'uploads/' }); // Carpeta temporal para almacenar imágenes subidas


///No es exactamente de la BDD, pero como la BDD maneja la logica del usuario, pense en dejarlo aqui y no crear otro router solo para estas 3 funciones
//Recoger JWT
router.get('/getToken', authMid.validateToken, authMid.getToken);

//Validar existencia de token
router.get('/validateToken', authMid.validateToken, authMid.existsToken);

//Clear Token (para pruebas o cerrar sesion)
router.get('/deleteToken', authMid.validateToken, authMid.deleteToken);


//////////////
///  GET   ///
//////////////
//Recoger datos del usuario despues del login (se valida el token)
//Actualmente, los datos que se recuperan aqui estan dentro del token (/login), si en un futuro se decide no guardar esa informacion, se debe eliminar los datos del token y ocupar esta funcion
router.get('/getUserData', authMid.validateToken, dbController.getUserData);

//Recoger configuraciones del usuario
router.get('/getUserConfidence', authMid.validateToken, dbController.getUserConfidence);

//Recoge las asignaciones (Secciones+salas)
router.get('/getUserAsignation', authMid.validateToken, dbController.getUserAsignation);


//////////////
//POST (Uno o mas datos deben ser enviados desde el frontend)
//////////////
//Realiza el login
router.post('/login', dbController.login);


//Registrar un usuario (De momento, utilizar postman)
router.post('/register', upload.single('avatar'), dbController.register);

//Actualizar configuraciones del usuario
router.post('/UpdateUserConfidence', authMid.validateToken, dbController.UpdateUserConfidence);

//Link de camara de la sala actual
router.post('/getCameraLink', dbController.getCameraLink);

//Envia las metricas de la sesion
router.post('/storeSessionMetrics', dbController.storeSessionMetrics);

//Recoger las metricas de una sesion por asignacion
router.post('/getAsignationMetrics', dbController.getAsignationMetrics);

module.exports = router;
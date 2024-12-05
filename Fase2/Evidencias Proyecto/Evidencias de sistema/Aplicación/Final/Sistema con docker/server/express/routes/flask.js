const { Router, application } = require('express');
const router = Router();
const cookieParser = require('cookie-parser');
const flaskController = require('../controllers/flaskEndpointController')

router.use(cookieParser());

//////////////
//   GET    //
//////////////
//Rutas de API
router.get('/flaskStream', flaskController.flaskStream);

//Recoger metricas
router.get('/metrics', flaskController.metrics);

//Recoger confianza
router.get('/getConfidence', flaskController.getConfidence);

//////////////
//   POST   //
//////////////
//Modificar umbral de confianza (flask-Oracle)
router.post('/setConfidence', flaskController.setConfidence);

//Inicia/Finaliza la sesion (Activa/desactiva video para evitar desincronizacion)
router.post('/setVideoStream', flaskController.setVideoStream);

//Cambiar el link de la camara
router.post('/setCamLink', flaskController.setCamLink);

module.exports = router;
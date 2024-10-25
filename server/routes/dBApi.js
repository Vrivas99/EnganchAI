const { Router } = require('express');
const router = Router();
const { getDBConnection } = require('./dBConnect')
const oracledb = require('oracledb'); //Para utilizar outFormat
// bcryptjs 
const jsonwebtoken = require('jsonwebtoken')

//Middleware de usuario
function validateToken(req, res, next){
    const accessToken = req.cookies["jwt"] || req.headers.authorization?.split(" ")[1];;
    if (!accessToken) return res.status(401).json({ message: 'Acceso denegado' });
    
    try{
        const userToken = jsonwebtoken.verify(accessToken, process.env.JWTSECRET)
        req.body.correo = userToken.user;
        req.body.id = userToken.Id;
        req.body.Name = userToken.Name;
        req.body.Avatar = userToken.Avatar;
        req.body.Config = userToken.Config;
        next()
    }catch(err){
        res.clearCookie("jwt");
        return res.status(403).json({ message: 'Acceso denegado, token expirado o incorrecto' });
    }
};

//////////////
//GET (Los datos no se envian desde el frontend o no requiere datos)
//////////////
//get y validacion de JWT para frontend
//Recoger JWT
router.get('/getToken', validateToken, (req, res) => {
    res.status(200).json({
        correo: req.body.correo,
        id: req.body.id,
        name: req.body.Name,
        avatar: req.body.Avatar,
        config: req.body.Config
    });
});


//Validar existencia de token
router.get('/validateToken', validateToken, (req, res) => {
    res.status(200).json({ message: 'Token Ok' });
});

//Clear Token (para pruebas o cerrar sesion)
router.get('/deleteToken', validateToken, (req, res) => {
    res.clearCookie("jwt");
    res.status(200).json({ message: 'Token Eliminado' });
});

//Recoger datos del usuario despues del login (se valida el token)
//Actualmente, los datos que se recuperan aqui estan dentro del token (/login), si en un futuro se decide no guardar esa informacion, se debe eliminar los datos del token y ocupar esta funcion
router.get('/getUserData', validateToken, async(req,res) =>{
    try{
        const { correo } = req.body.correo;

        console.log("Correo: ", correo)

        const oracle = await getDBConnection();
        const result = await oracle.execute(
            'SELECT IDUSUARIO, NOMBRE, AVATAR FROM USUARIOS WHERE CORREO=:correo',
            { correo: correo}, 
            { outFormat: oracledb.OBJECT }
        );
        res.status(201).json({ data: result.rows });
    } catch(err){
        console.error('Error details:', err);
        res.status(500).json({ error: 'Error al hacer la solicitud', message: err.message });
    }
});

//Recoger configuraciones del usuario
router.get('/getUserConfidence', validateToken, async(req,res) =>{
    try{
        const correo = req.body.correo;//Obtenido desde el token

        const oracle = await getDBConnection();
        const result = await oracle.execute(
            'SELECT CF.SENSIBILIDAD FROM CONFIGURACIONES CF JOIN USUARIOS US ON CF.IDCONFIGURACION=US.CONFIG_IDCONFIGURACION WHERE CORREO=:correo',
            { correo: correo}, 
            { outFormat: oracledb.OBJECT }
        );
        res.status(201).json({ data: result.rows });
        console.log("Query res: ",result.rows)
    } catch(err){
        console.error('Error details:', err);
        res.status(500).json({ error: 'Error al hacer la solicitud', message: err.message });
    }
});

//Recoge las asignaciones (Secciones+salas)
router.get('/getUserAsignation', validateToken, async(req,res) =>{
    try{
        const usuarioID = req.body.id;

        console.log("user asignation, id: ",usuarioID)

        const oracle = await getDBConnection();
        const result = await oracle.execute(
            'SELECT AG.IDASIGNACION, SC.IDSECCION AS ID_SECCION, SC.NOMBRE AS SECCION, SL.IDSALA AS ID_SALA ,SL.NOMBRE AS SALA FROM ASIGNACIONES AG JOIN USUARIOS US ON AG.USUARIOS_IDUSUARIO=US.IDUSUARIO JOIN SECCIONES SC ON AG.SALAS_SECCIONES_SECCIONES_IDSECCION=SC.IDSECCION JOIN SALAS SL ON AG.SALAS_SECCIONES_SALAS_IDSALA=SL.IDSALA WHERE AG.USUARIOS_IDUSUARIO=:idUsuario',
            { idUsuario: usuarioID}, 
            { outFormat: oracledb.OBJECT }
        );
        res.status(201).json({ data: result.rows });
        console.log("Query res: ",result.rows)
    } catch(err){
        console.error('Error details:', err);
        res.status(500).json({ error: 'Error al hacer la solicitud', message: err.message });
    }
});


//////////////
//POST (Uno o mas datos deben ser enviados desde el frontend)
//////////////
//Realiza el login
router.post('/login', async(req,res) =>{
    try{
        const correo = req.body.email; 
        const contrasenna = req.body.password;

        const oracle = await getDBConnection();
        const result = await oracle.execute(
            'SELECT COUNT(*) FROM USUARIOS WHERE CORREO=:correo AND CONTRASENNA=:contrasenna',
            { correo: correo, contrasenna: contrasenna}, 
            { outFormat: oracledb.OBJECT }
        );

        //Login no exitoso
        if (result.rows[0]["COUNT(*)"] != 1){
            return res.status(400).json({ error: 'Usuario y/o contraseña invalidos' });
        }

        //Guardar informacion del usuario dentro del token (Eliminar si se usara /getUserData)
        const resultUser = await oracle.execute(
            'SELECT IDUSUARIO, NOMBRE, AVATAR, CONFIG_IDCONFIGURACION FROM USUARIOS WHERE CORREO=:correo',
            { correo: correo}, 
            { outFormat: oracledb.OBJECT }
        );

        //Crear token

        const tokenPayload = {
            user:correo, Id:resultUser.rows[0]["IDUSUARIO"], 
            Name: resultUser.rows[0]["NOMBRE"], 
            Avatar: resultUser.rows[0]["AVATAR"], 
            Config: resultUser.rows[0]["CONFIG_IDCONFIGURACION"]
        }
        // {expiresIn:process.env.JWTEXPIRATION}
        const token = jsonwebtoken.sign(tokenPayload, process.env.JWTSECRET)
        
        //Crear cookie del login
        const cookieLogin = {
            expires: new Date(Date.now() + process.env.JWTCOOKIEEXPIRE * 24 * 60 * 60 * 1000),//Transformar el numero a dias
            path: "/",
            httpOnly: true
        }

        //Enviar cookie al cliente
        res.cookie("jwt", token, cookieLogin);//cookieLogin
        console.log("Cookie D: ", token, cookieLogin)
        return res.status(201).json({ data: result.rows  });
    } catch(err){
        return res.status(400).json({ error: 'Usuario y/o contraseña invalidos', err: err.message });
    }
});

//Actualizar configuraciones del usuario
router.post('/UpdateUserConfidence', validateToken, async(req,res) =>{
    try{
        const configID = req.body.Config;//Enviado por validateToken
        const Sensibilidad = req.body.sensibilidad;//Enviado por /api/setConfidence
        console.log("Config: ",configID," Sensibilidad: ",Sensibilidad)

        const oracle = await getDBConnection();
        const result = await oracle.execute(
            'UPDATE CONFIGURACIONES SET SENSIBILIDAD =:nueSensibilidad WHERE IDCONFIGURACION=:idConfig',
            { nueSensibilidad: Sensibilidad, idConfig: configID}, 
            { autoCommit: true, outFormat: oracledb.OBJECT },//Asegura el commit
        );
        res.status(201).json({ message: 'RESULT:', result });
        console.log("Query res: ",result.rows)
    } catch(err){
        console.error('Error details:', err);
        res.status(500).json({ error: 'Error al hacer la solicitud', message: err.message });
    }
});

//Link de camara de la sala actual
router.post('/getCameraLink', async(req,res) =>{
    try{
        const { salaID } = req.body;

        const oracle = await getDBConnection();
        const result = await oracle.execute(
            'SELECT LINK FROM SALAs WHERE IDSALA=:idSala',
            { idSala: salaID}, 
            { outFormat: oracledb.OBJECT }
        );
        res.status(201).json({ data: result.rows });
    } catch(err){
        res.status(500).json({ error: 'Error al hacer la solicitud', message: err.message });
    }
});

//Envia las metricas de la sesion
router.post('/storeSessionMetrics', async(req,res) =>{
    try{
        const { metrics, Asignacion } = req.body;  //Recibe los datos enviados desde flask.js

        const oracle = await getDBConnection();
        const result = await oracle.execute(
            'INSERT INTO METRICAS (IDMETRICA, REGISTRO, ASIGNACIONES_IDASIGNACION) VALUES (:idMetrica, :jsonData, :idAsignacion)',
            { idMetrica: 0, jsonData: metrics, idAsignacion: Asignacion}, //idMetrica = 0 para ser tomado por el trigger de oracle
            { autoCommit: true }//Asegura el commit
        );

        res.status(201).json({ data: result.rows });
    } catch(err){
        res.status(500).json({ error: 'Error al hacer la solicitud', message: err.message });
    }
});

//Recoger las metricas de una sesion por asignacion
router.post('/getAsignationMetrics', async(req,res) =>{
    try{
        const Asignacion = req.body.asignacion;

        const oracle = await getDBConnection();
        const result = await oracle.execute(
            'SELECT REGISTRO FROM METRICAS WHERE ASIGNACIONES_IDASIGNACION=:idAsignacion',
            { idAsignacion: Asignacion}, 
            { outFormat: oracledb.OBJECT }
        );

        //Parsear CLOB->String->Json si hay resultados
        if (result.rows.length > 0) {
            //Extraer el CLOB y convertirlo a string
            const registros = await Promise.all(result.rows.map(async (row) => {
                const lob = row.REGISTRO; //CLOB como Lob
                const clobString = await lob.getData(); //Obtiene el contenido del CLOB como string
                return JSON.parse(clobString); //Intenta parsear a JSON
            }));

            res.status(200).json({ message: 'RESULT:', data: registros });
        } else {
            res.status(404).json({ message: 'No se encontraron métricas para la asignacion' });
        }
        
        //Si llega a este punto, o no hay nada, o devolvera error 500 por no poder parsear bien el CLOB
        //res.status(201).json({ message: 'RESULT:', result });
    } catch(err){
        console.error('Error details:', err);
        res.status(500).json({ error: 'Error al hacer la solicitud', message: err.message });
    }
});

module.exports = router;
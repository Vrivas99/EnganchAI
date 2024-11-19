const { getDBConnection } = require('../config/dBConnect');//Conectar con oracle
const oracledb = require('oracledb'); //Para utilizar outFormat
const {encrypt, compare} = require('../helpers/handleBcrypt');//Encriptar contraseñas
const sharp = require('sharp');//Redimensionar los Pfp
const { uploadAvatar } = require('../config/ociInit');//Acceder al bucket 

const jsonwebtoken = require('jsonwebtoken')//Token JWT(cookie)-Para el login


async function getUserData(req,res){
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
};

async function getUserConfidence(req,res) {
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
};

async function getUserAsignation(req,res) {
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
};

async function login(req,res){
    try{
        const correo = req.body.email; 
        const contrasenna = req.body.password;
        //const checkContra = await encrypt(contrasenna);//Encriptar la contraseña para compararla con la BD

        const oracle = await getDBConnection();
        
        //Se tiene que recuperar la contraseña del usuario debido a bcrypt (se tiene que comprobar localmente)
        const result = await oracle.execute(
            'SELECT CONTRASENNA FROM USUARIOS WHERE CORREO=:correo',
            { correo: correo}, 
            { outFormat: oracledb.OBJECT }
        );
        
        //Login no exitoso (no se encontro al usuario)
        if (result.rows.length === 0){
            console.log("not user")
            return res.status(400).json({ error: 'Usuario y/o contraseña invalidos' });
        }

        // Obtener el hash de la contraseña almacenada
        const hashContra = result.rows[0].CONTRASENNA;
        console.log("hash contra ",hashContra)
        // Usar bcrypt para comparar la contraseña ingresada con el hash
        const match = await compare(contrasenna, hashContra);

        if (!match) {
            console.log("not match")
            return res.status(400).json({ error: 'Usuario y/o contraseña invalidos' });
        }

        //Si coincide la contraseña, loguear y guardar informacion del usuario dentro del token (Eliminar si se usara /getUserData)
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
        console.error('Error details:', err);
        return res.status(400).json({ error: 'Usuario y/o contraseña invalidos', err: err.message });
    }
};

async function register(req,res){
    try{
        const {nombre, correo, contrasenna} = req.body;
        const avatar = req.file.path;

        const oracle = await getDBConnection();

        //Confirmar que el usuario (correo) no exista antes de registrarlo
        const resCount = await oracle.execute(
            'SELECT COUNT(*) FROM USUARIOS WHERE CORREO=:correo',
            { correo: correo}, 
            { outFormat: oracledb.OBJECT }
        );

        //Usuario ya existente
        if (result.rows[0]["COUNT(*)"] != 0){
            return res.status(400).json({ error: 'Usuario ya existente' });
        }

        //Si el usuario(correo) no existia, iniciar proceso:
        //Encriptar contraseña
        const passwordHash  = await encrypt(contrasenna);
        //Insertar Avatar en el bucket y retornar el link
        const avatarLink = await uploadAvatar(avatar,`pfp${correo}.png`);

        const result = await oracle.execute(
            'INSERT INTO USUARIOS (IDUSUARIO, NOMBRE, CORREO, CONTRASENNA, CONFIG_IDCONFIGURACION) VALUES (0,:nombre,:correo,:contrasenna,:avatar,0)',
            { nombre: nombre, correo: correo, contrasenna: passwordHash, avatar: avatarLink}, 
            { outFormat: oracledb.OBJECT }
        );
        res.status(200).json({ res: "Usuario registrado con exito" });
    } catch(err){
        return res.status(400).json({ error: 'Error al registrarse', err: err.message });
    }
};

async function UpdateUserConfidence(req,res) {
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
};

async function getCameraLink(req,res){
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
};

async function storeSessionMetrics(req,res){
    try{
        const { metrics, Asignacion } = req.body;  //Recibe los datos enviados desde flask.js
        
        const oracle = await getDBConnection();
        const result = await oracle.execute(
            'INSERT INTO METRICAS (IDMETRICA, REGISTRO, PROMEDIO, ASIGNACIONES_IDASIGNACION) VALUES (:idMetrica, :jsonData, :avgData, :idAsignacion)',
            { idMetrica: 0, jsonData: metrics, avgData: metrics.AVG, idAsignacion: Asignacion}, //idMetrica = 0 para ser tomado por el trigger de oracle
            { autoCommit: true }//Asegura el commit
        );

        res.status(201).json({ data: result.rows });
    } catch(err){
        res.status(500).json({ error: 'Error al hacer la solicitud', message: err.message });
    }
};

async function getAsignationMetrics(req,res){
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
};

async function getAVGWeeklyEngagement(req,res){
    try{
        const Asignacion = req.body.asignacion;

        const oracle = await getDBConnection();
        const result = await oracle.execute(
            "SELECT AVG(PROMEDIO) AS PROMEDIO FROM METRICAS WHERE ASIGNACIONES_IDASIGNACION=:idAsignacion AND FECHA BETWEEN TRUNC(SYSDATE, 'IW') AND SYSDATE",
            { idAsignacion: Asignacion}, 
            { outFormat: oracledb.OBJECT }
        );

        res.status(200).json({ message: 'RESULT:', data: result.rows[0] });
    } catch(err){
        console.error('Error details:', err);
        res.status(500).json({ error: 'Error al hacer la solicitud', message: err.message });
    }
};

module.exports = {
    getUserData,
    getUserConfidence,
    getUserAsignation,
    login,
    register,
    UpdateUserConfidence,
    getCameraLink,
    storeSessionMetrics,
    getAsignationMetrics,
    getAVGWeeklyEngagement
};
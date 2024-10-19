const { Router } = require('express');
const router = Router();
const { getDBConnection } = require('./dBConnect')
const oracledb = require('oracledb'); //Para utilizar outFormat
// bcryptjs 
const jsonwebtoken = require('jsonwebtoken')

//api de prueba, borrar despues
router.get('/getTestUsers', async (req,res) => {
    try{
        const oracle = await getDBConnection();
        const result = await oracle.execute(
            'SELECT * FROM TEST_TABLE',[], { outFormat: oracledb.OBJECT }
        );
        res.status(201).json({ message: 'RESULT:', result });
        console.log("Query res: ",result.rows)
    } catch(err){
        console.error('Error al hacer una solicitud ',err)
        res.status(500).json({ error: 'Error al hacer una solicitud', err });
    }
});

//Realiza el login
router.get('/login', async(req,res) =>{
    try{
        const oracle = await getDBConnection();
        const result = await oracle.execute(
            'SELECT COUNT(*) FROM USUARIOS WHERE CORREO=:correo AND CONTRASENNA=:contrasenna',
            { correo: 'correo@prueba.cl', contrasenna: '1234'}, 
            { outFormat: oracledb.OBJECT }
        );

        //Login no exitoso
        if (result.rows[0]["COUNT(*)"] != 1){
            res.status(400).json({ error: 'Usuario y/o contraseña invalidos' });
        }
        const token = jsonwebtoken.sign({user:'correo@prueba.cl'},
            process.env.JWTSECRET, 
            {expiresIn:process.env.JWTEXPIRATION})
        
        //Crear cookie del login
        const cookieLogin = {
            expires: new Date(Date.now() + process.env.JWTCOOKIEEXPIRE * 24 * 60 * 60 * 1000),//Transformar el numero a dias
            path: "/"
        }

        //Enviar cookie al cliente
        res.cookie("jwt", token, cookieLogin);
        res.status(201).json({ message: 'RESULT:', result });
    } catch(err){
        res.status(400).json({ error: 'Usuario y/o contraseña invalidos' });
    }
});

//Recoger datos del usuario despues del login
router.get('/getUserData', async(req,res) =>{
    try{
        const oracle = await getDBConnection();
        const result = await oracle.execute(
            'SELECT IDUSUARIO, NOMBRE, AVATAR FROM USUARIOS WHERE CORREO=:correo',
            { correo: 'correo@prueba.cl'}, 
            { outFormat: oracledb.OBJECT }
        );
        res.status(201).json({ message: 'RESULT:', result });
        console.log("Query res: ",result.rows)
    } catch(err){
        console.error('Error details:', err);
        res.status(500).json({ error: 'Error al hacer la solicitud', message: err.message });
    }
});

//Recoger configuraciones del usuario
router.get('/getUserConfidence', async(req,res) =>{
    try{
        const oracle = await getDBConnection();
        const result = await oracle.execute(
            'SELECT CF.SENSIBILIDAD FROM CONFIGURACIONES CF JOIN USUARIOS US ON CF.IDCONFIGURACION=US.CONFIG_IDCONFIGURACION WHERE CORREO=:correo',
            { correo: 'correo@prueba.cl'}, 
            { outFormat: oracledb.OBJECT }
        );
        res.status(201).json({ message: 'RESULT:', result });
        console.log("Query res: ",result.rows)
    } catch(err){
        console.error('Error details:', err);
        res.status(500).json({ error: 'Error al hacer la solicitud', message: err.message });
    }
});

//Actualizar configuraciones del usuario
router.get('/UpdateUserConfidence', async(req,res) =>{
    try{
        const oracle = await getDBConnection();
        const result = await oracle.execute(
            'UPDATE CONFIGURACIONES SET SENSIBILIDAD =:nueSensibilidad WHERE IDCONFIGURACION=:idConfig',
            { nueSensibilidad: 30, idConfig: 1}, 
            { outFormat: oracledb.OBJECT }
        );
        res.status(201).json({ message: 'RESULT:', result });
        console.log("Query res: ",result.rows)
    } catch(err){
        console.error('Error details:', err);
        res.status(500).json({ error: 'Error al hacer la solicitud', message: err.message });
    }
});


//Recoge las asignaciones (Secciones+salas)
router.get('/getUserAsignation', async(req,res) =>{
    try{
        const oracle = await getDBConnection();
        const result = await oracle.execute(
            'SELECT AG.IDASIGNACION, SC.IDSECCION AS ID_SECCION, SC.NOMBRE AS SECCION, SL.IDSALA AS ID_SALA ,SL.NOMBRE AS SALA FROM ASIGNACIONES AG JOIN USUARIOS US ON AG.USUARIOS_IDUSUARIO=US.IDUSUARIO JOIN SECCIONES SC ON AG.SALAS_SECCIONES_SECCIONES_IDSECCION=SC.IDSECCION JOIN SALAS SL ON AG.SALAS_SECCIONES_SALAS_IDSALA=SL.IDSALA WHERE AG.USUARIOS_IDUSUARIO=:idUsuario',
            { idUsuario: 1}, 
            { outFormat: oracledb.OBJECT }
        );
        res.status(201).json({ message: 'RESULT:', result });
        console.log("Query res: ",result.rows)
    } catch(err){
        console.error('Error details:', err);
        res.status(500).json({ error: 'Error al hacer la solicitud', message: err.message });
    }
});

//Link de camara de la sala actual
router.get('/getCameraLink', async(req,res) =>{
    try{
        const oracle = await getDBConnection();
        const result = await oracle.execute(
            'SELECT LINK FROM SALAs WHERE IDSALA=:idSala',
            { idSala: 1}, 
            { outFormat: oracledb.OBJECT }
        );
        res.status(201).json({ message: 'RESULT:', result });
        console.log("Query res: ",result.rows)
    } catch(err){
        console.error('Error details:', err);
        res.status(500).json({ error: 'Error al hacer la solicitud', message: err.message });
    }
});

//Envia las metricas de la sesion
router.post('/storeSessionMetrics', async(req,res) =>{
    const { metrics } = req.body;  //Recibe los datos enviados desde flask.js

    try{
        const oracle = await getDBConnection();
        const result = await oracle.execute(
            'INSERT INTO METRICAS (IDMETRICA, REGISTRO, ASIGNACIONES_IDASIGNACION) VALUES (:idMetrica, :jsonData, :idAsignacion)',
            { idMetrica: 1, jsonData: metrics, idAsignacion: 1}, 
            { autoCommit: true }//Asegura el commit
        );

        res.status(201).json({ message: 'Metricas almacenadas:', result });
        console.log("Metricas almacenadas",result)
    } catch(err){
        console.error('Error details:', err);
        res.status(500).json({ error: 'Error al hacer la solicitud', message: err.message });
    }
});

//Recoger las metricas de una sesion por asignacion
router.get('/getAsignationMetrics', async(req,res) =>{
    try{
        const oracle = await getDBConnection();
        const result = await oracle.execute(
            'SELECT REGISTRO FROM METRICAS WHERE ASIGNACIONES_IDASIGNACION=:idAsignacion',
            { idAsignacion: 1}, 
            { outFormat: oracledb.OBJECT }
        );

        console.log(result)

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
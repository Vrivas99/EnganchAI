const { Router } = require('express');
const router = Router();
const { getDBConnection } = require('./dBConnect')
const oracledb = require('oracledb'); //Para utilizar outFormat

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
        res.status(500).json({ error: 'Error al hacer una solicitud' });
    }
});

router.get('/login', async(req,res) =>{
    try{
        const oracle = await getDBConnection();
        const result = await oracle.execute(
            'SELECT COUNT(*) FROM USUARIOS WHERE CORREO=:correo AND CONTRASENNA=:contrasenna',
            { correo: 'correo@prueba.cl', contrasenna: '1234'}, 
            { outFormat: oracledb.OBJECT }
        );
        res.status(201).json({ message: 'RESULT:', result });
        console.log("Query res: ",result.rows)
    } catch(err){
        res.status(500).json({ error: 'Usuario y/o contraseña invalidos' });
    }
});

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
        res.status(500).json({ error: 'Error al hacer la solicitud' });
    }
});

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
        res.status(500).json({ error: 'Error al hacer la solicitud' });
    }
});


module.exports = router;
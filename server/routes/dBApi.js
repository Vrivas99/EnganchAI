const { Router } = require('express');
const router = Router();
const { getDBConnection } = require('./dBConnect')
const oracledb = require('oracledb'); //Para utilizar outFormat

router.get('/getTestUsers', async (req, res) => {
    try{
        const oracle = await getDBConnection();
        const result = await oracle.execute(
            'SELECT * FROM TEST_TABLE',[], { outFormat: oracledb.OBJECT }
        );
        res.status(201).json({ message: 'RESULT:', result });
        console.log("Hola: ",result.rows)
    } catch(err){
        console.error('Error al hacer una solicitud ',err)
        res.status(500).json({ error: 'Error al hacer una solicitud' });
    }
});

module.exports = router;
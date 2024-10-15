//const { Router } = require('express');
//const router = Router();

const oracledb = require('oracledb')
const path = require('path');
let connection;

//Ruta absoluta de la wallet
const walletPath = path.resolve(__dirname, '../Wallet_ENGANCHAIWWMTFUA9UICVJPXU');

async function getDBConnection() {
  if (!connection){
    connection = await oracledb.getConnection({
        user: "ADMIN",
        password: "Enganchadm1n",
        connectString: "(description= (retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1522)(host=adb.sa-saopaulo-1.oraclecloud.com))(connect_data=(service_name=gc78895a04fdbd9_enganchaiwwmtfua9uicvjpxu_medium.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes)))",
        walletLocation: walletPath,
        walletPassword: "Enganchadm1n"
    });
    console.log('Oracle conectado');
  }
  return connection;
}

    /* try {
      //oracledb.initOracleClient({ libDir: '/path/to/instantclient' }); // Necesario en algunos sistemas
      await oracledb.createPool({
        user: "ADMIN",
        password: "Enganchadm1n",
        connectString: "(description= (retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1522)(host=adb.sa-saopaulo-1.oraclecloud.com))(connect_data=(service_name=gc78895a04fdbd9_enganchaiwwmtfua9uicvjpxu_medium.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes)))",
        walletLocation: "/Wallet_ENGANCHAIWWMTFUA9UICVJPXU",
        walletPassword: "Enganchadm1n"
      });
      console.log('Oracle conectado');
    } catch (err) {
      console.error('Error conectando a Oracle', err);
    }
  } */
  
  //initDB();

module.exports = { getDBConnection };
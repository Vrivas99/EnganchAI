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
        user: process.env.DBUSER,
        password: process.env.DBPASS,
        connectString: process.env.DBCONSTRING,
        walletLocation: walletPath,
        walletPassword: process.env.DBWALLPASS
    });
    console.log('Oracle conectado');
  }
  return connection;
}

module.exports = { getDBConnection };
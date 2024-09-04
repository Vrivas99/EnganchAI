const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());//Necesario para la conexion con el frontend

app.get("/", (req, res)=>{
    res.send("Hola");
});

app.listen(5000, () => {
    console.log("Server ejecutandose en puerto", 5000);
});
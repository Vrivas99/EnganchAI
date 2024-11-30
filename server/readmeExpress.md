#Express Server#
Este servidor funciona como API intermediaria entre el servidor de flask y el frontend de express (también maneja las solicitudes a la BDD Oracle)


#Requisitos para desarrollar#
Antes de comenzar desarrollar debes tener instalado Node.JS en el equipo, después de eso simplemente ejecuta
el siguiente comando en la ruta Enganchai/server:
npm i

(El backend fue desarrollado utilizando Node v18.17.1)


#Uso#
Para iniciar el servidor puedes utilizar el siguiente comando en la ruta Enganchai/server:
node server.js

o también:
npm start

Este segundo comando inicia el servidor utilizando nodemon, lo que implica que cualquier cambio que se haga en el código reiniciara el servidor para compilar los 
cambios automáticamente.
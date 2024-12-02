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

#Archivos y elementos faltantes#
la carpeta express contiene algunos elementos importantes que no fueron subidos, la primera es la carpeta wallet de la base de datos de oracle que por razones 
obvias no subimos al repositorio ya que son bases de datos personales del equipo de desarrollo. Cuando creen su wallet de su base de datos deberán dejar la wallet 
descomprimida dentro de la carpeta "express", con el nombre " Wallet_ENGANCHAIWWMTFUA9UICVJPXU" (dentro de la carpeta wallet se deberán encontrar los archivos 
necesarios como ewallet.pem o similares), si se quiere cambiar el nombre de la wallet deberán cambiar su nombre respectivo en el código del archivo "express/config/dBConnect.js".
Relacionada con esta también podría ser requerida una carpeta .oci para utilizar un bucket de oracle cloud y subir avatares al registrar un nuevo usuario, dependerá de si 
el nuevo equipo de desarrollo opine que esta es una funcionalidad útil o no (La carpeta .oci es requerida en el archivo express/config/ociInit.js)

Ademas de ello hubieron algunas claves del archivo .env que tampoco fueron subidas, siendo estas: DBUSER, DBPASS, DBCONSTRING y DBWALLPASS, las cuales deberán 
especificar con los nuevos datos de su BDD, siendo estas el usuario de la base de datos, la contraseña del usuario, el string de conexión y la contraseña de la wallet (en ese mismo orden).
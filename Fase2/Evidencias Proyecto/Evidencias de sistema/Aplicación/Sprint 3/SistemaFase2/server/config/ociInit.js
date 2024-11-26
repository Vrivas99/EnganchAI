//const sdk = require('oci-sdk');//Manejar el bucket donde se guardaran las imagenes
const common = require('oci-common');
//const path = require('path');
const { ObjectStorageClient } = require('oci-objectstorage');
const sharp = require('sharp');
const fs = require('fs');

const provider = new common.ConfigFileAuthenticationDetailsProvider(".oci/config","DEFAULT");

const objectStorage = new ObjectStorageClient({
    authenticationDetailsProvider: provider,
  });

const namespace = 'grkaxtkeyryv';
const bucketName = 'bucketAvatar-20241028-0953';

async function uploadAvatar(imagePath, imageName) {
    // Redimensiona la imagen a 200x200
    const resizedImagePath = `./uploads/resized_${imageName}`;
    await sharp(imagePath).resize(200, 200).toFile(resizedImagePath);
  
    // Carga la imagen redimensionada al bucket
    const imageBuffer = fs.readFileSync(resizedImagePath);
    const putObjectRequest = {
      namespaceName: namespace,
      bucketName: bucketName,
      putObjectBody: imageBuffer,
      objectName: imageName, // Nombre de la imagen en el bucket
      contentType: 'image/png'
    };
  
    try {
      await objectStorage.putObject(putObjectRequest);
      console.log('Imagen subida con éxito');
  
      // Genera la URL de acceso público
      const imageUrl = `https://objectstorage.sa-saopaulo-1.oraclecloud.com/n/grkaxtkeyryv/b/bucketAvatar-20241028-0953/o/${encodeURIComponent(imageName)}`;
  
      // Limpia las imagenes temporales
      fs.unlinkSync(imagePath);
      fs.unlinkSync(resizedImagePath);
      
      return imageUrl; // Devuelve la URL de la imagen
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      throw error;
    }
};

module.exports = { uploadAvatar };
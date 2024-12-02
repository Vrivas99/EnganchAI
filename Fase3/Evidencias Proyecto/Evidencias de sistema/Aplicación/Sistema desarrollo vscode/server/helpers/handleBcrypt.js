const bcrypt = require('bcryptjs')

const encrypt = async ( plainText ) =>{
    const hash = await bcrypt.hash(plainText, 10)
    return hash
}

//Para comparar un texto plano con su variante encriptada (en caso de ser necesario)
const compare = async ( plainText, hashText) =>{
    return await bcrypt.compare(plainText, hashText)
}

module.exports = {encrypt, compare}
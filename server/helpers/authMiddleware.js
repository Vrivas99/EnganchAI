const jsonwebtoken = require('jsonwebtoken')//Token JWT(cookie)

function validateToken(req, res, next){
    const accessToken = req.cookies["jwt"] || req.headers.authorization?.split(" ")[1];
    if (!accessToken) return res.status(401).json({ message: 'Acceso denegado' });
    
    try{
        const userToken = jsonwebtoken.verify(accessToken, process.env.JWTSECRET)
        req.body.correo = userToken.user;
        req.body.id = userToken.Id;
        req.body.Name = userToken.Name;
        req.body.Avatar = userToken.Avatar;
        req.body.Config = userToken.Config;
        next()
    }catch(err){
        res.clearCookie("jwt");
        return res.status(403).json({ message: 'Acceso denegado, token expirado o incorrecto' });
    }
};

function getToken(req, res){
    return res.status(200).json({
        correo: req.body.correo,
        id: req.body.id,
        name: req.body.Name,
        avatar: req.body.Avatar,
        config: req.body.Config
    });
};

function existsToken(req, res){
    return res.status(200).json({ message: 'Token Ok' });
};

function deleteToken(req, res){
    res.clearCookie("jwt");
    res.status(200).json({ message: 'Token Eliminado' });
};

module.exports = { 
    validateToken,
    getToken,
    existsToken,
    deleteToken
}
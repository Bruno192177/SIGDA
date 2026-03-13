import bcryptjs from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const usuarios = [{  ///Pruebas
    user: "a",
    password: "a"
}]

async function login(req, res){
    console.log(req.body); ///Pruebas
    const user = req.body.user;
    const password = req.body.password;
    if(!user || !password){
        return res.status(400).send({status:"Error",message:"Los campos están incompletos"})
    }
    const usuarioARevisar = usuarios.find(usuario => usuario.user === user);
    if(!usuarioARevisar){
        return res.status(400).send({status:"Error",message:"Error durante login"})
    }
    const loginCorrecto = await bcryptjs.compare(password,usuarioARevisar.password);
    if(!loginCorrecto){
        return res.status(400).send({status:"Error",message:"Error durante login"})
    }
    const token = jsonwebtoken.sign({user:usuarioARevisar.user},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRATION});

    const cookieOption = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 *60 * 1000), path: "/"
    }
    res.cookie("jwt",token,cookieOption); 
    res.send({status:"ok", message:"Usuario loggeado", redirect:"/admin"});
}

export const methods = {
    login
}
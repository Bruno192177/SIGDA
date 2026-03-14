import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
import { conectarDB } from "../database.js";

dotenv.config();

async function soloAdmin(req, res, next){
    const logueado = await revisarCookie(req);
    if(logueado) return next();
    return res.redirect("/")
}

async function soloPublico(req, res, next){
    const logueado = await revisarCookie(req);
    if(!logueado) return next();
    return res.redirect("/admin")
}

async function revisarCookie(req){
    try{
        const cookieJWT = req.headers.cookie.split("; ").find(cookie => cookie.startsWith("jwt=")).slice(4);
        const decodificada = jsonwebtoken.verify(cookieJWT,process.env.JWT_SECRET);
        console.log(decodificada)
        
        const db = await conectarDB();
        const usuarioARevisar = await db.get(
            "SELECT * FROM usuarios WHERE user = ?",
            decodificada.user
        );
        console.log("Usuario verificado:", usuarioARevisar)
        
        if(!usuarioARevisar){
            return false
        }
        return true;
    }  
    catch{
        return false;
    } 
}


export const methods = {
    soloAdmin,
    soloPublico,
}
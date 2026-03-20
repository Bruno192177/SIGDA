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
        const cookieJWT = req.headers.cookie
            .split("; ")
            .find(cookie => cookie.startsWith("jwt="))
            .slice(4);

        const decodificada = jsonwebtoken.verify(cookieJWT, process.env.JWT_SECRET);

        const db = await conectarDB();
        const usuarioARevisar = await db.get(
            "SELECT * FROM usuarios WHERE user = ?",
            decodificada.user
        );

        if(!usuarioARevisar){
            return false;
        }

        // guardar usuario en request
        req.user = usuarioARevisar;

        return true;

    } catch {
        return false;
    }
}


export const methods = {
    soloAdmin,
    soloPublico,
}
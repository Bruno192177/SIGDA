
import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
import { conectarDB } from "../database.js";

dotenv.config();


async function login(req, res){
    console.log(req.body);

    const user = req.body.user;
    const password = req.body.password;

    if(!user || !password){
        return res.status(400).send({
            status:"Error",
            message:"Los campos están incompletos"
        })
    }

    const db = await conectarDB();

    const usuarioARevisar = await db.get(
        "SELECT * FROM usuarios WHERE user = ?",
        user
    );
    console.log("Usuario encontrado:", usuarioARevisar);

    if(!usuarioARevisar){
        return res.status(400).send({
            status:"Error",
            message:"Usuario no encontrado"
        })
    }

    const loginCorrecto = password === usuarioARevisar.password;

    if(!loginCorrecto){
        return res.status(400).send({
            status:"Error",
            message:"Contraseña incorrecta"
        })
    }

    const token = jsonwebtoken.sign(
        {user:usuarioARevisar.user},
        process.env.JWT_SECRET,
        {expiresIn:process.env.JWT_EXPIRATION}
    );

    const cookieOption = {
    expires: new Date(
        Date.now() +
        process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
    ),
        path: "/",
        httpOnly: true,   // evita acceso desde JS
        sameSite: "lax"
    };

    res.cookie("jwt",token,cookieOption);

    res.send({
        status:"ok",
        message:"Usuario loggeado",
        redirect:"/admin"
    });
}


export const methods = {
    login
}
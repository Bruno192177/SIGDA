import express from "express";
import cookieParser from "cookie-parser";
import { conectarDB } from "./database.js";
import multer from "multer";
import fs from "fs";

await conectarDB();

//Fix para __dirname
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { methods as authentication } from "./controllers/authentication.controller.js";
import { methods as authorization } from "./middlewares/authorization.js"; 

//Server
const app = express();
app.set("port", 4000);
app.listen(app.get("port"));
console.log("Servidor corriendo en puerto", app.get("port")); //Prueba

//Configuracion
app.use(express.static(__dirname + "/public"));
app.use(express.json());
app.use(cookieParser())

//Rutas
app.get("/",authorization.soloPublico, (req, res) => res.sendFile(__dirname + "/pages/login.html"));
app.get("/admin",authorization.soloAdmin, (req, res) => res.sendFile(__dirname + "/pages/admin/admin.html"));
app.post("/api/login", authentication.login);
app.get("/documentos", authorization.soloAdmin, (req, res) => res.sendFile(__dirname + "/pages/admin/documentos.html"));

app.get("/api/user", authorization.soloAdmin, (req, res) => {
    res.json({
        username: req.user.user,
        // si luego agregamos más campos por ejemplo:
        // email: req.user.email,
        // rol: req.user.rol
    });
});

app.get("/api/logout", (req, res) => {
    res.cookie("jwt", "", {
        expires: new Date(0),
        path: "/"
    });
    res.json({ message: "Logout exitoso" });
});

// Rutas para eventos
app.get("/api/events", authorization.soloAdmin, async (req, res) => {
    try {
        const db = await conectarDB();
        const eventos = await db.all("SELECT id, title, start, end, allDay FROM eventos");
        res.json(eventos.map(e => ({ ...e, allDay: !!e.allDay })));
    } catch (error) {
        res.status(500).json({ error: "Error al cargar eventos" });
    }
});

app.post("/api/events", authorization.soloAdmin, async (req, res) => {
    try {
        const { title, start, end, allDay } = req.body;
        const db = await conectarDB();
        const result = await db.run("INSERT INTO eventos (title, start, end, allDay) VALUES (?, ?, ?, ?)", 
            title, start, end || null, allDay ? 1 : 0);
        res.json({ id: result.lastID, title, start, end, allDay });
    } catch (error) {
        res.status(500).json({ error: "Error al guardar evento" });
    }
});

app.delete("/api/events/:id", authorization.soloAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const db = await conectarDB();
        await db.run("DELETE FROM eventos WHERE id = ?", id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar evento" });
    }
});

app.put("/api/events/:id", authorization.soloAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, start, end, allDay } = req.body;
        const db = await conectarDB();
        await db.run("UPDATE eventos SET title = ?, start = ?, end = ?, allDay = ? WHERE id = ?", 
            title, start, end || null, allDay ? 1 : 0, id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar evento" });
    }
});

// Config MULTER
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, __dirname + "/public/uploads");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

// RUTAS DOCUMENTOS
app.post("/api/documentos", authorization.soloAdmin, upload.single("archivo"), async (req, res) => {
    const db = await conectarDB();

    const nombre = req.file.originalname;
    const ruta = "/uploads/" + req.file.filename;
    const fecha = new Date().toISOString();

    await db.run(
        "INSERT INTO documentos (nombre, ruta, fecha) VALUES (?, ?, ?)",
        nombre, ruta, fecha
    );

    res.json({ success: true });
});

app.get("/api/documentos", authorization.soloAdmin, async (req, res) => {
    const db = await conectarDB();
    const docs = await db.all("SELECT * FROM documentos");
    res.json(docs);
});

app.delete("/api/documentos/:id", authorization.soloAdmin, async (req, res) => {
    try {
        const db = await conectarDB();

        //  Obtener documento
        const doc = await db.get(
            "SELECT * FROM documentos WHERE id = ?",
            req.params.id
        );

        if (!doc) {
            return res.status(404).json({ error: "Documento no encontrado" });
        }

        //  Borrar archivo físico
        const rutaArchivo = __dirname + "/public" + doc.ruta;

        if (fs.existsSync(rutaArchivo)) {
            fs.unlinkSync(rutaArchivo);
        }

        //  Borrar de la BD
        await db.run("DELETE FROM documentos WHERE id = ?", req.params.id);

        res.json({ success: true });

    } catch (error) {
        console.error("Error eliminando documento:", error);
        res.status(500).json({ error: "Error al eliminar documento" });
    }
});


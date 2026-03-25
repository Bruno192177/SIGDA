import express from "express";
import cookieParser from "cookie-parser";
import { conectarDB } from "./database.js";
import multer from "multer";
import fs from "fs";

// FIX __dirname
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// IMPORTS
import { methods as authentication } from "./controllers/authentication.controller.js";
import { methods as authorization } from "./middlewares/authorization.js"; 

// DB
await conectarDB();

// SERVER
const app = express();
app.set("port", 4000);
app.listen(app.get("port"));
console.log("Servidor corriendo en puerto", app.get("port"));

// CONFIG
app.use(express.static(__dirname + "/public"));
app.use(express.json());
app.use(cookieParser());

// RUTAS PRINCIPALES

app.get("/", authorization.soloPublico, (req, res) => 
    res.sendFile(__dirname + "/pages/login.html")
);

app.get("/admin", authorization.soloAdmin, (req, res) => 
    res.sendFile(__dirname + "/pages/admin/admin.html")
);

app.get("/documentos", authorization.soloAdmin, (req, res) => 
    res.sendFile(__dirname + "/pages/admin/documentos.html")
);

app.get("/padron", authorization.soloAdmin, (req, res) => 
    res.sendFile(__dirname + "/pages/admin/padron.html")
);

app.get("/empleado/:id", authorization.soloAdmin, (req, res) => 
    res.sendFile(__dirname + "/pages/admin/empleado.html")
);

// AUTH

app.post("/api/login", authentication.login);

// USER
app.get("/api/user", authorization.soloAdmin, (req, res) => {
    res.json({ username: req.user.user });
});

// LOGOUT
app.get("/api/logout", (req, res) => {
    res.cookie("jwt", "", {
        expires: new Date(0),
        path: "/"
    });
    res.json({ message: "Logout exitoso" });
});

// EVENTOS

app.get("/api/events", authorization.soloAdmin, async (req, res) => {
    try {
        const db = await conectarDB();
        const eventos = await db.all("SELECT * FROM eventos");

        res.json(
            eventos.map(e => ({
                id: e.id,
                title: e.title,
                start: e.start,
                end: e.end,
                allDay: !!e.allDay,
                extendedProps: {
                    description: e.description
                }
            }))
        );

    } catch {
        res.status(500).json({ error: "Error al cargar eventos" });
    }
});

app.post("/api/events", authorization.soloAdmin, async (req, res) => {
    try {
        const { title, start, end, allDay, description } = req.body;
        const db = await conectarDB();

        const result = await db.run(
            "INSERT INTO eventos (title, start, end, allDay, description) VALUES (?, ?, ?, ?, ?)",
            title,
            start,
            end || null,
            allDay ? 1 : 0,
            description || ""
        );

        res.json({ id: result.lastID, title, start, end, allDay });

    } catch {
        res.status(500).json({ error: "Error al guardar evento" });
    }
});

app.delete("/api/events/:id", authorization.soloAdmin, async (req, res) => {
    try {
        const db = await conectarDB();
        await db.run("DELETE FROM eventos WHERE id = ?", req.params.id);
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: "Error al eliminar evento" });
    }
});

app.put("/api/events/:id", authorization.soloAdmin, async (req, res) => {
    try {
        const { title, start, end, allDay, description } = req.body;
        const db = await conectarDB();

        await db.run(
            "UPDATE eventos SET title=?, start=?, end=?, allDay=?, description=? WHERE id=?",
            title,
            start,
            end || null,
            allDay ? 1 : 0,
            description || "",
            req.params.id
        );

        res.json({ success: true });

    } catch {
        res.status(500).json({ error: "Error al actualizar evento" });
    }
});

// CARPETAS

// GET
app.get("/api/carpetas", authorization.soloAdmin, async (req, res) => {
    const db = await conectarDB();
    const carpetas = await db.all("SELECT * FROM carpetas");
    res.json(carpetas);
});

// POST
app.post("/api/carpetas", authorization.soloAdmin, async (req, res) => {
    const { nombre } = req.body;
    const db = await conectarDB();

    const result = await db.run(
        "INSERT INTO carpetas (nombre) VALUES (?)",
        nombre
    );

    res.json({ id: result.lastID, nombre });
});

// PUT
app.put("/api/carpetas/:id", authorization.soloAdmin, async (req, res) => {
    const { nombre } = req.body;
    const db = await conectarDB();

    await db.run(
        "UPDATE carpetas SET nombre = ? WHERE id = ?",
        nombre,
        req.params.id
    );

    res.json({ success: true });
});

// DELETE
app.delete("/api/carpetas/:id", authorization.soloAdmin, async (req, res) => {
    const db = await conectarDB();

    await db.run(
        "UPDATE documentos SET carpeta_id = NULL WHERE carpeta_id = ?",
        req.params.id
    );

    await db.run(
        "DELETE FROM carpetas WHERE id = ?",
        req.params.id
    );

    res.json({ success: true });
});

// DOCUMENTOS

// MULTER
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, __dirname + "/public/uploads");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

// SUBIR
app.post("/api/documentos", authorization.soloAdmin, upload.single("archivo"), async (req, res) => {
    const db = await conectarDB();

    const nombre = req.file.originalname;
    const ruta = "/uploads/" + req.file.filename;
    const fecha = new Date().toISOString();
    const carpeta_id = req.body.carpeta || null;

    await db.run(
        "INSERT INTO documentos (nombre, ruta, fecha, carpeta_id) VALUES (?, ?, ?, ?)",
        nombre, ruta, fecha, carpeta_id
    );

    res.json({ success: true });
});

// LISTAR
app.get("/api/documentos", authorization.soloAdmin, async (req, res) => {
    const db = await conectarDB();

    const search = req.query.search || "";
    const carpeta = req.query.carpeta;

    let query = `
        SELECT d.*, c.nombre AS carpeta_nombre
        FROM documentos d
        LEFT JOIN carpetas c ON d.carpeta_id = c.id
        WHERE d.nombre LIKE ?
    `;

    let params = [`%${search}%`];

    if (carpeta && carpeta !== "all") {
        query += " AND d.carpeta_id = ?";
        params.push(carpeta);
    }

    const docs = await db.all(query, params);

    res.json(docs);
});

// ELIMINAR
app.delete("/api/documentos/:id", authorization.soloAdmin, async (req, res) => {
    try {
        const db = await conectarDB();

        const doc = await db.get(
            "SELECT * FROM documentos WHERE id = ?",
            req.params.id
        );

        if (!doc) {
            return res.status(404).json({ error: "Documento no encontrado" });
        }

        const rutaArchivo = __dirname + "/public" + doc.ruta;

        if (fs.existsSync(rutaArchivo)) {
            fs.unlinkSync(rutaArchivo);
        }

        await db.run("DELETE FROM documentos WHERE id = ?", req.params.id);

        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al eliminar documento" });
    }
});

// EMPLEADOS PADRON

// LISTAR
app.get("/api/empleados", authorization.soloAdmin, async (req, res) => {
    try {
        const db = await conectarDB();
        const empleados = await db.all("SELECT * FROM empleados");
        res.json(empleados);
    } catch {
        res.status(500).json({ error: "Error al obtener empleados" });
    }
});

// CREAR
app.post("/api/empleados", authorization.soloAdmin, async (req, res) => {
    try {
        const { nombre, estado } = req.body;
        const db = await conectarDB();

        const result = await db.run(
            "INSERT INTO empleados (nombre, estado) VALUES (?, ?)",
            nombre,
            estado || "activo"
        );

        res.json({ id: result.lastID, nombre, estado });
    } catch {
        res.status(500).json({ error: "Error al crear empleado" });
    }
});

// OBTENER UNO
app.get("/api/empleados/:id", authorization.soloAdmin, async (req, res) => {
    const db = await conectarDB();

    const emp = await db.get(
        "SELECT * FROM empleados WHERE id = ?",
        req.params.id
    );

    res.json(emp);
});

// DOCUMENTOS DEL EMPLEADO
app.get("/api/empleados/:id/documentos", authorization.soloAdmin, async (req, res) => {
    const db = await conectarDB();

    const docs = await db.all(
        "SELECT * FROM documentos_empleado WHERE empleado_id = ?",
        req.params.id
    );

    res.json(docs);
});

// SUBIR DOC A EMPLEADO

app.post("/api/empleados/:id/upload", authorization.soloAdmin, upload.single("archivo"), async (req, res) => {
    try {
        const db = await conectarDB();

        const nombre = req.file.originalname;
        const ruta = "/uploads/" + req.file.filename;
        const fecha = new Date().toISOString();
        const empleado_id = req.params.id;

        await db.run(
            "INSERT INTO documentos_empleado (nombre, ruta, fecha, empleado_id) VALUES (?, ?, ?, ?)",
            nombre,
            ruta,
            fecha,
            empleado_id
        );

        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al subir documento" });
    }
});

// ELIMINAR DOCUMENTO DE EMPLEADO
app.delete("/api/documentos-empleado/:id", authorization.soloAdmin, async (req, res) => {
    try {
        const db = await conectarDB();

        const doc = await db.get(
            "SELECT * FROM documentos_empleado WHERE id = ?",
            req.params.id
        );

        if (!doc) {
            return res.status(404).json({ error: "Documento no encontrado" });
        }

        const rutaArchivo = __dirname + "/public" + doc.ruta;

        if (fs.existsSync(rutaArchivo)) {
            fs.unlinkSync(rutaArchivo);
        }

        await db.run(
            "DELETE FROM documentos_empleado WHERE id = ?",
            req.params.id
        );

        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al eliminar documento" });
    }
});
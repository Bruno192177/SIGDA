import express from "express";
import cookieParser from "cookie-parser";
import { conectarDB } from "./database.js";
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


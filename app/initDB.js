import { conectarDB } from "./database.js";

const db = await conectarDB();

// USUARIOS
await db.exec(`
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT UNIQUE,
    password TEXT
)
`);

// EVENTOS
await db.exec(`
CREATE TABLE IF NOT EXISTS eventos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    start TEXT,
    end TEXT,
    allDay INTEGER DEFAULT 1,
    description TEXT
)
`);

// CARPETAS
await db.exec(`
CREATE TABLE IF NOT EXISTS carpetas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL
)
`);

// DOCUMENTOS GENERALES
await db.exec(`
CREATE TABLE IF NOT EXISTS documentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    ruta TEXT,
    fecha TEXT,
    carpeta_id INTEGER,
    FOREIGN KEY (carpeta_id) REFERENCES carpetas(id)
)
`);

// EMPLEADOS
await db.exec(`
CREATE TABLE IF NOT EXISTS empleados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    estado TEXT DEFAULT 'activo'
)
`);

// DOCUMENTOS POR EMPLEADO
await db.exec(`
CREATE TABLE IF NOT EXISTS documentos_empleado (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    ruta TEXT,
    fecha TEXT,
    empleado_id INTEGER,
    FOREIGN KEY (empleado_id) REFERENCES empleados(id)
)
`);

// DATOS INICIALES

// usuario demo
await db.run(`
INSERT OR IGNORE INTO usuarios (user,password)
VALUES ('demo','demo')
`);

// carpeta inicial
await db.run(`
INSERT OR IGNORE INTO carpetas (id, nombre)
VALUES (1, 'Principal')
`);

// empleado demo (para probar)
await db.run(`
INSERT OR IGNORE INTO empleados (id, nombre, estado)
VALUES (1, 'Empleado Demo', 'activo')
`);

console.log("Base de datos lista");
process.exit();
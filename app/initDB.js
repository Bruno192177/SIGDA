import { conectarDB } from "./database.js";

const db = await conectarDB();

await db.exec(`
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT UNIQUE,
    password TEXT
)
`);

await db.exec(`
CREATE TABLE IF NOT EXISTS eventos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    start TEXT,
    end TEXT,
    allDay INTEGER DEFAULT 1
)
`);

await db.run(`
INSERT OR IGNORE INTO usuarios (user,password)
VALUES ('demo','demo')
`);

console.log("Base de datos lista");
process.exit();
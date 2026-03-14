import sqlite3 from "sqlite3";
import { open } from "sqlite";

let db = null;

export async function conectarDB(){

    if(db) return db;

    db = await open({
        filename: "./database.db",
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user TEXT UNIQUE,
            password TEXT
        )
    `);

await db.run(`
INSERT OR REPLACE INTO usuarios (user,password)
VALUES ('demo','demo')
`);

    return db;
}
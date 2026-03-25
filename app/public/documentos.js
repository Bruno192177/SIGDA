document.addEventListener("DOMContentLoaded", () => {

    // USER
    fetch('/api/user', { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
        document.getElementById("username").textContent = "👤 " + data.username + " ▾";
        document.getElementById("user-name").textContent = data.username;
    })
    .catch(() => window.location.href = "/");

    // LOGOUT
    document.getElementById("logout-btn").addEventListener("click", async () => {
        await fetch("/api/logout", { credentials: "include" });
        window.location.href = "/";
    });

    // DROPDOWN
    const username = document.getElementById("username");
    const dropdown = document.getElementById("dropdown");

    username.addEventListener("click", () => {
        dropdown.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
        if (!username.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove("active");
        }
    });

    // EVENTOS BUSQUEDA
    document.getElementById("search-input").addEventListener("input", loadDocs);
    document.getElementById("folder-select").addEventListener("change", loadDocs);

    // SUBIR ARCHIVO
    document.getElementById("upload-form").addEventListener("submit", async (e) => {
        e.preventDefault();

        const file = document.getElementById("file-input").files[0];
        const carpeta = document.getElementById("folder-select").value;

        const formData = new FormData();
        formData.append("archivo", file);
        formData.append("carpeta", carpeta);

        await fetch("/api/documentos", {
            method: "POST",
            body: formData,
            credentials: "include"
        });

        loadDocs();
    });

    // CARPETAS
    document.getElementById("create-folder-btn").addEventListener("click", crearCarpeta);
    document.getElementById("rename-folder-btn").addEventListener("click", renombrarCarpeta);
    document.getElementById("delete-folder-btn").addEventListener("click", eliminarCarpeta);

    loadFolders();
    loadDocs();
});


// Carpetas

async function loadFolders() {
    const res = await fetch("/api/carpetas", {
        credentials: "include"
    });

    const carpetas = await res.json();

    const select = document.getElementById("folder-select");
    select.innerHTML = `<option value="all">📁 Todas</option>`;

    carpetas.forEach(c => {
        const option = document.createElement("option");
        option.value = c.id;
        option.textContent = "📁 " + c.nombre;
        select.appendChild(option);
    });
}

async function crearCarpeta() {
    const nombre = document.getElementById("new-folder-name").value;

    if (!nombre) return alert("Escribe un nombre");

    await fetch("/api/carpetas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre }),
        credentials: "include"
    });

    document.getElementById("new-folder-name").value = "";
    loadFolders();
}

async function renombrarCarpeta() {
    const id = document.getElementById("folder-select").value;
    const nuevoNombre = document.getElementById("new-folder-name").value;

    if (!id || id === "all") return alert("Selecciona una carpeta");
    if (!nuevoNombre) return alert("Escribe el nuevo nombre");

    await fetch("/api/carpetas/" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nuevoNombre }),
        credentials: "include"
    });

    document.getElementById("new-folder-name").value = "";
    loadFolders();
}

async function eliminarCarpeta() {
    const id = document.getElementById("folder-select").value;

    if (!id || id === "all") return alert("Selecciona una carpeta");

    if (!confirm("¿Eliminar carpeta?")) return;

    await fetch("/api/carpetas/" + id, {
        method: "DELETE",
        credentials: "include"
    });

    loadFolders();
    loadDocs();
}


//Documentos

async function loadDocs() {
    const search = document.getElementById("search-input").value;
    const carpeta = document.getElementById("folder-select").value;

    const res = await fetch(`/api/documentos?search=${search}&carpeta=${carpeta}`, {
        credentials: "include"
    });

    const docs = await res.json();

    const tbody = document.querySelector("#docs-table tbody");
    tbody.innerHTML = "";

    docs.forEach(doc => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${doc.nombre}</td>
            <td>${formatearFecha(doc.fecha)}</td>
            <td>${doc.carpeta_nombre || "Sin carpeta"}</td>
            <td>
                <a href="${doc.ruta}" target="_blank">⬇</a>
                <button onclick="deleteDoc(${doc.id})">🗑</button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function formatearFecha(fechaISO) {
    const fecha = new Date(fechaISO);

    return fecha.toLocaleString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

async function deleteDoc(id) {
    await fetch("/api/documentos/" + id, {
        method: "DELETE",
        credentials: "include"
    });

    loadDocs();
}
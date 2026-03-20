document.addEventListener("DOMContentLoaded", () => {

    // Usuario
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

    // Documentos
    loadDocs();

    document.getElementById("upload-form").addEventListener("submit", async (e) => {
        e.preventDefault();

        const file = document.getElementById("file-input").files[0];
        const formData = new FormData();
        formData.append("archivo", file);

        await fetch("/api/documentos", {
            method: "POST",
            body: formData,
            credentials: "include"
        });

        loadDocs();
    });

});

async function loadDocs() {
    const res = await fetch("/api/documentos", { credentials: "include" });
    const docs = await res.json();

    const tbody = document.querySelector("#docs-table tbody");
    tbody.innerHTML = "";

    docs.forEach(doc => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${doc.nombre}</td>
            <td>${formatearFecha(doc.fecha)}</td>
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
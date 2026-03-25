// OBTENER ID DE LA URL
const path = window.location.pathname;
const empleadoId = path.split("/").pop();

// ELEMENTOS
const nameEl = document.getElementById("employee-name");
const statusEl = document.getElementById("employee-status");
const titleEl = document.getElementById("employee-title");

const form = document.getElementById("upload-form");
const fileInput = document.getElementById("file-input");
const docsBody = document.getElementById("docs-body");

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

// CARGAR EMPLEADO
async function cargarEmpleado() {
    const res = await fetch(`/api/empleados/${empleadoId}`);
    const emp = await res.json();

    nameEl.textContent = emp.nombre;
    titleEl.textContent = emp.nombre;

    statusEl.textContent = emp.estado;
    statusEl.className = `status ${emp.estado}`;
}

// CARGAR DOCUMENTOS
async function cargarDocs() {
    const res = await fetch(`/api/empleados/${empleadoId}/documentos`);
    const docs = await res.json();

    docsBody.innerHTML = "";

    docs.forEach(doc => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${doc.nombre}</td>
            <td>${formatearFecha(doc.fecha)}</td>
            <td>
                <a href="${doc.ruta}" target="_blank">📄</a>
                <button onclick="eliminarDoc(${doc.id})">🗑</button>
            </td>
        `;

        docsBody.appendChild(tr);
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

// SUBIR DOCUMENTO
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("archivo", fileInput.files[0]);

    await fetch(`/api/empleados/${empleadoId}/upload`, {
        method: "POST",
        body: formData
    });

    form.reset();
    cargarDocs();
});

// ELIMINAR
async function eliminarDoc(id) {
    await fetch(`/api/documentos-empleado/${id}`, {
        method: "DELETE"
    });

    cargarDocs();
}

// INICIO
cargarEmpleado();
cargarDocs();
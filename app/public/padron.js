// ELEMENTOS
const grid = document.getElementById("employee-grid");
const modal = document.getElementById("employee-modal");

const addBtn = document.getElementById("add-employee-btn");
const closeModalBtn = document.getElementById("close-modal");
const saveBtn = document.getElementById("save-employee");

const nameInput = document.getElementById("employee-name");
const statusSelect = document.getElementById("employee-status");

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

// CARGAR EMPLEADOS
async function cargarEmpleados() {
    try {
        const res = await fetch("api/empleados");
        const empleados = await res.json();

        grid.innerHTML = "";

        empleados.forEach(emp => {
            const card = document.createElement("div");
            card.classList.add("employee-card");

            card.innerHTML = `
                <h3>${emp.nombre}</h3>
                <p class="status ${emp.estado}">${emp.estado}</p>
            `;

            card.addEventListener("click", () => {
                window.location.href = `/empleado/${emp.id}`;
            });

            grid.appendChild(card);
        });

    } catch (error) {
        console.error("Error cargando empleados:", error);
    }
}

// ABRIR MODAL
addBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
});

// CERRAR MODAL
closeModalBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
});

// GUARDAR EMPLEADO
saveBtn.addEventListener("click", async () => {
    const nombre = nameInput.value.trim();
    const estado = statusSelect.value;

    if (!nombre) {
        alert("El nombre es obligatorio");
        return;
    }

    try {
        const res = await fetch("api/empleados", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nombre, estado })
        });

        if (!res.ok) throw new Error("Error al guardar");

        modal.classList.add("hidden");

        // limpiar inputs
        nameInput.value = "";
        statusSelect.value = "activo";

        cargarEmpleados();

    } catch (error) {
        console.error(error);
        alert("Error al crear empleado");
    }
});

// INICIO
cargarEmpleados();
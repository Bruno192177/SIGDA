document.addEventListener("DOMContentLoaded", () => {

    // Elementos 
    const usernameEl = document.getElementById("username");
    const userNameDropdown = document.getElementById("user-name");
    const dropdown = document.getElementById("dropdown");
    const logoutBtn = document.getElementById("logout-btn");

    const modal = document.getElementById("event-modal");
    const saveBtn = document.getElementById("save-event");
    const closeBtn = document.getElementById("close-modal");
    const deleteBtn = document.getElementById("delete-event");

    const inputTitle = document.getElementById("event-title");
    const inputStart = document.getElementById("event-start");
    const inputEnd = document.getElementById("event-end");
    const inputDesc = document.getElementById("event-desc");

    let selectedEventId = null; 

    // USUARIO 
    fetch('/api/user', { credentials: 'include' })
    .then(res => {
        if (!res.ok) throw new Error("No autenticado");
        return res.json();
    })
    .then(data => {
        usernameEl.textContent = `👤 ${data.username} ▾`;
        userNameDropdown.textContent = data.username;
    })
    .catch(() => window.location.href = "/");

    // DROPDOWN 
    usernameEl.addEventListener("click", () => {
        dropdown.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
        if (!usernameEl.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove("active");
        }
    });

    // LOGOUT 
    logoutBtn.addEventListener("click", async () => {
        if (confirm("¿Cerrar sesión?")) {
            await fetch("/api/logout", { credentials: "include" });
            window.location.href = "/";
        }
    });

    // CALENDARIO 
    const calendarEl = document.getElementById('calendar');
    let calendar;

    if (calendarEl) {
        calendar = new FullCalendar.Calendar(calendarEl, {

            initialView: 'timeGridWeek', 
            editable: true,
            events: '/api/events',

            slotMinTime: "07:00:00",
            slotMaxTime: "22:00:00",

            //  CREAR EVENTO 
            dateClick: function(info) {

                selectedEventId = null;

                modal.classList.remove("hidden");

                inputTitle.value = "";
                inputDesc.value = "";

                inputStart.value = info.dateStr + "T09:00";
                inputEnd.value = info.dateStr + "T10:00";
            },

            // EDITAR EVENTO 
            eventClick: function(info) {

                const event = info.event;

                selectedEventId = event.id;

                modal.classList.remove("hidden");

                inputTitle.value = event.title;
                inputStart.value = event.startStr;
                inputEnd.value = event.endStr || "";
                inputDesc.value = event.extendedProps.description || "";
            },

            // MOVER EVENTO 
            eventDrop: function(info) {
                fetch('/api/events/' + info.event.id, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        title: info.event.title,
                        start: info.event.startStr,
                        end: info.event.endStr,
                        allDay: info.event.allDay
                    })
                }).catch(() => calendar.refetchEvents());
            }

        });

        calendar.render();
    }

    // GUARDAR 
    saveBtn.addEventListener("click", async () => {

        const title = inputTitle.value;
        const start = inputStart.value;
        const end = inputEnd.value;
        const description = inputDesc.value;

        if (!title) {
            alert("El título es obligatorio");
            return;
        }

        if (selectedEventId) {
            // EDITAR
            await fetch('/api/events/' + selectedEventId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    title,
                    start,
                    end,
                    description,
                    allDay: false
                })
            });

        } else {
            // CREAR
            await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    title,
                    start,
                    end,
                    description,
                    allDay: false
                })
            });
        }

        modal.classList.add("hidden");
        calendar.refetchEvents();
    });

    // ELIMINAR
    deleteBtn.addEventListener("click", async () => {

        if (!selectedEventId) return;

        if (confirm("¿Eliminar evento?")) {
            await fetch('/api/events/' + selectedEventId, {
                method: 'DELETE',
                credentials: 'include'
            });

            modal.classList.add("hidden");
            selectedEventId = null;
            calendar.refetchEvents();
        }
    });

    // CERRAR MODAL 
    closeBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
        selectedEventId = null;
    });

});
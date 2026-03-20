document.addEventListener("DOMContentLoaded", () => {

    // Elementos 
    const usernameEl = document.getElementById("username");
    const userNameDropdown = document.getElementById("user-name");
    const dropdown = document.getElementById("dropdown");
    const logoutBtn = document.getElementById("logout-btn");

    // Obtener Usuario
    fetch('/api/user', {
        credentials: 'include'
    })
    .then(res => {
        if (!res.ok) throw new Error("No autenticado");
        return res.json();
    })
    .then(data => {
        if (usernameEl) {
            usernameEl.textContent = `👤 ${data.username} ▾`;
        }
        if (userNameDropdown) {
            userNameDropdown.textContent = data.username;
        }
    })
    .catch(() => {
        window.location.href = "/";
    });

    // DROPDOWN 
    if (usernameEl && dropdown) {
        usernameEl.addEventListener("click", () => {
            dropdown.classList.toggle("active");
        });

        document.addEventListener("click", (e) => {
            if (!usernameEl.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove("active");
            }
        });
    }

   logoutBtn.addEventListener("click", async () => {
    if (confirm("¿Cerrar sesión?")) {

        await fetch("/api/logout", {
            credentials: "include"
        });

        window.location.href = "/";
    }
    });

    // Calendario
    const calendarEl = document.getElementById('calendar');

    if (calendarEl) {
        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            editable: true,
            events: '/api/events',

            dateClick: function(info) {
                const title = prompt('Nombre del evento:');
                if (title) {
                    fetch('/api/events', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                            title,
                            start: info.dateStr,
                            allDay: true
                        })
                    }).then(() => calendar.refetchEvents());
                }
            },

            eventClick: function(info) {
                if (confirm(`¿Eliminar evento "${info.event.title}"?`)) {
                    fetch('/api/events/' + info.event.id, {
                        method: 'DELETE',
                        credentials: 'include'
                    }).then(() => calendar.refetchEvents());
                }
            },

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

});
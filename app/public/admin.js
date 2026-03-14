document.getElementById("logout-btn").addEventListener("click",()=>{
    document.cookie = 'jwt=; path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.location.href = "/"
})

// Inicializar el calendario
document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        editable: true,
        events: '/api/events', // Cargar eventos desde la API
        // Añadir evento al hacer clic en un día
        dateClick: function(info) {
            var title = prompt('Nombre del evento:');
            if (title) {
                fetch('/api/events', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ title, start: info.dateStr, allDay: true })
                }).then(() => calendar.refetchEvents());
            }
        },
        // Quitar evento al hacer clic en él
        eventClick: function(info) {
            if (confirm('¿Quieres eliminar este evento: "' + info.event.title + '"?')) {
                fetch('/api/events/' + info.event.id, {
                    method: 'DELETE',
                    credentials: 'include'
                }).then(() => calendar.refetchEvents());
            }
        },
        // Guardar cambios al mover eventos
        eventDrop: function(info) {
            fetch('/api/events/' + info.event.id, {
                method: 'PUT', // Pero no tenemos PUT, así que por ahora solo refetch
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ title: info.event.title, start: info.event.startStr, end: info.event.endStr, allDay: info.event.allDay })
            }).catch(() => calendar.refetchEvents());
        }
    });
    calendar.render();
});
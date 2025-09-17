
let currentDate = new Date();
let events = JSON.parse(localStorage.getItem('events')) || {};
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let emotions = JSON.parse(localStorage.getItem('emotions')) || [];
let selectedDate = null;
let currentSection = 'inicio';

const SYMBOLS = {
    TASK: '•',
    EVENT: '○',
    NOTE: '-',
    MIGRATED: '>',
    COMPLETED: 'x'
};


const motivationalQuotes = [
    "La organización es el camino hacia la productividad.",
    "Cada día es una nueva oportunidad para ser mejor.",
    "Pequeños pasos llevan a grandes logros.",
    "La disciplina es la clave del éxito.",
    "El tiempo es el recurso más valioso, úsalo sabiamente."
];

document.addEventListener('DOMContentLoaded', () => {
    
    const today = new Date();
    selectedDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    
    // Inicializar la app
    initApp();
    setupEventListeners();
    
    // Solicitar permiso para notificaciones
    requestNotificationPermission();
    
    // Configurar recordatorio diario
    setupDailyReminder();
});

// FUNCIÓN DE INICIALIZACIÓN
function initApp() {
    // Mostrar sección de inicio por defecto
    showSection('inicio');
    
    // Actualizar datos del dashboard
    updateDashboard();
    
    // Renderizar componentes
    renderCalendar();
    renderTasks();
    renderEvents();
    renderEmotions();
    renderStatistics();
    
    // Mostrar frase del día
    showDailyQuote();
}

// FUNCIÓN PARA MOSTRAR SECCIONES
function showSection(sectionId) {
    // Ocultar todas las secciones
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostrar la sección seleccionada
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.classList.add('active');
        currentSection = sectionId;
    }
    
    // Actualizar datos específicos de la sección
    switch(sectionId) {
        case 'inicio':
            updateDashboard();
            break;
        case 'calendario':
            renderCalendar();
            break;
        case 'tareas':
            renderTasks();
            break;
        case 'eventos':
            renderEvents();
            break;
        case 'emociones':
            renderEmotions();
            break;
        case 'estadisticas':
            renderStatistics();
            break;
    }
}

// FUNCIÓN PARA CONFIGURAR EVENT LISTENERS
function setupEventListeners() {
    // Menú de navegación
    document.getElementById('menuicono').addEventListener('click', toggleMenu);
    
    // Enlaces de navegación
    document.querySelectorAll('#menuprincipal a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.currentTarget.getAttribute('data-section');
            showSection(section);
            toggleMenu(); // Cerrar menú después de seleccionar
        });
    });
    
    // Navegación del calendario
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    // Selección de día en el calendario
    document.getElementById('calendar').addEventListener('click', (e) => {
        if (e.target.classList.contains('calendar-day') && !e.target.classList.contains('empty')) {
            selectedDate = e.target.dataset.date;
            openDayModal(selectedDate);
        }
    });
    
    // Formulario de tareas
    document.querySelectorAll('.symbol-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.symbol-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    document.getElementById('addTaskBtn').addEventListener('click', () => {
        const activeSymbol = document.querySelector('.symbol-btn.active').dataset.symbol;
        const taskContent = document.getElementById('taskInput').value;
        
        if (addTask(activeSymbol, taskContent)) {
            document.getElementById('taskInput').value = '';
            showNotification('Tarea añadida', 'success');
            updateDashboard();
        } else {
            showNotification('La tarea no puede estar vacía', 'error');
        }
    });
    
    // Acciones de tareas
    document.getElementById('migrateBtn').addEventListener('click', migrateTasks);
    document.getElementById('clearCompletedBtn').addEventListener('click', clearCompletedTasks);
    
    // Formulario de eventos
    document.getElementById('addEventBtn').addEventListener('click', () => {
        const title = document.getElementById('eventTitle').value;
        const date = document.getElementById('eventDate').value;
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        
        if (addEvent(title, date, startTime, endTime)) {
            document.getElementById('eventTitle').value = '';
            document.getElementById('eventDate').value = '';
            document.getElementById('startTime').value = '';
            document.getElementById('endTime').value = '';
            showNotification('Evento añadido', 'success');
            updateDashboard();
        } else {
            showNotification('El evento debe tener un título y fecha', 'error');
        }
    });
    
    // Formulario de emociones
    document.querySelectorAll('.intensity-stars span').forEach(star => {
        star.addEventListener('click', () => {
            const value = parseInt(star.dataset.value);
            
            // Actualizar estrellas
            document.querySelectorAll('.intensity-stars span').forEach((s, i) => {
                if (i < value) {
                    s.textContent = '★';
                    s.classList.add('active');
                } else {
                    s.textContent = '☆';
                    s.classList.remove('active');
                }
            });
        });
    });
    
    document.getElementById('addEmotionBtn').addEventListener('click', () => {
        const emotion = document.getElementById('emotionSelect').value;
        const note = document.getElementById('emotionNote').value;
        const intensity = document.querySelectorAll('.intensity-stars .active').length;
        
        if (addEmotion(emotion, note, intensity)) {
            document.getElementById('emotionSelect').value = '';
            document.getElementById('emotionNote').value = '';
            document.querySelectorAll('.intensity-stars span').forEach(s => {
                s.textContent = '☆';
                s.classList.remove('active');
            });
            showNotification('Emoción registrada', 'success');
            updateDashboard();
        } else {
            showNotification('Selecciona una emoción', 'error');
        }
    });
    
    // Modal del día
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('dayModal').style.display = 'none';
    });
    
    // Pestañas del modal
    document.querySelectorAll('.modal-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.modalTab;
            
            // Actualizar pestañas activas
            document.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.modal-tab-content').forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`modal-${tabId}`).classList.add('active');
        });
    });
}

// FUNCIÓN PARA TOGGLE DEL MENÚ
function toggleMenu() {
    const menu = document.getElementById('menuprincipal');
    if (menu.style.display === 'block') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'block';
    }
}

// FUNCIÓN PARA ACTUALIZAR DASHBOARD
function updateDashboard() {
    // Contar tareas pendientes
    const pendingTasks = tasks.filter(task => !task.completed).length;
    document.getElementById('pendingTasksCount').textContent = pendingTasks;
    
    // Contar eventos próximos
    const today = new Date();
    const upcomingEvents = Object.values(events)
        .flat()
        .filter(event => new Date(event.date) >= today)
        .length;
    document.getElementById('upcomingEventsCount').textContent = upcomingEvents;
    
    // Mostrar última emoción registrada
    if (emotions.length > 0) {
        const lastEmotion = emotions[emotions.length - 1];
        document.getElementById('currentMoodEmoji').textContent = getEmoji(lastEmotion.emotion);
        document.getElementById('currentMoodPhrase').textContent = getMoodPhrase(lastEmotion.emotion);
    }
}

// FUNCIÓN PARA MOSTRAR FRASE DEL DÍA
function showDailyQuote() {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    document.getElementById('dailyQuote').textContent = `"${motivationalQuotes[randomIndex]}"`;
}

// FUNCIONES DEL CALENDARIO
function renderCalendar() {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    
    // Actualizar encabezado del mes
    document.getElementById('currentMonth').textContent = 
        new Date(year, month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    
    // Limpiar calendario
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    
    // Obtener primer día del mes y días totales
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Días vacíos al inicio
    for (let i = 0; i < firstDay; i++) {
        calendar.innerHTML += '<div class="calendar-day empty"></div>';
    }
    
    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${month + 1}-${day}`;
        const hasEvents = events[dateStr] && events[dateStr].length > 0;
        const hasTasks = tasks.some(task => task.date === dateStr && !task.completed);
        
        calendar.innerHTML += `
            <div class="calendar-day ${hasEvents ? 'has-events' : ''} ${hasTasks ? 'has-tasks' : ''}" 
                 data-date="${dateStr}">
                ${day}
            </div>
        `;
    }
}

// FUNCIONES DE TAREAS
function addTask(symbol, content, date = selectedDate) {
    if (!content.trim()) return false;
    
    const newTask = {
        id: Date.now(),
        symbol,
        content,
        date,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    tasks.push(newTask);
    saveTasks();
    renderTasks();
    renderCalendar();
    return true;
}

function toggleTaskCompletion(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateDashboard();
    }
}

function migrateTasks() {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${tomorrow.getMonth() + 1}-${tomorrow.getDate()}`;
    
    // Migrar tareas no completadas de hoy a mañana
    tasks.forEach(task => {
        if (task.date === todayStr && !task.completed) {
            task.symbol = SYMBOLS.MIGRATED;
            task.date = tomorrowStr;
        }
    });
    
    saveTasks();
    renderTasks();
    renderCalendar();
    showNotification('Tareas migradas al día siguiente', 'success');
}

function clearCompletedTasks() {
    const completedCount = tasks.filter(task => task.completed).length;
    
    if (completedCount === 0) {
        showNotification('No hay tareas completadas para eliminar', 'warning');
        return;
    }
    
    if (confirm(`¿Estás seguro de que quieres eliminar ${completedCount} tareas completadas?`)) {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
        showNotification(`${completedCount} tareas eliminadas`, 'success');
    }
}

function renderTasks() {
    const pendingTasksList = document.getElementById('pendingTasksList');
    const completedTasksList = document.getElementById('completedTasksList');
    
    pendingTasksList.innerHTML = '';
    completedTasksList.innerHTML = '';
    
    // Separar tareas pendientes y completadas
    const pendingTasks = tasks.filter(task => !task.completed);
    const completedTasks = tasks.filter(task => task.completed);
    
    // Renderizar tareas pendientes
    if (pendingTasks.length === 0) {
        pendingTasksList.innerHTML = '<p>No hay tareas pendientes</p>';
    } else {
        pendingTasks.forEach(task => {
            const taskEl = createTaskElement(task);
            pendingTasksList.appendChild(taskEl);
        });
    }
    
    // Renderizar tareas completadas
    if (completedTasks.length === 0) {
        completedTasksList.innerHTML = '<p>No hay tareas completadas</p>';
    } else {
        completedTasks.forEach(task => {
            const taskEl = createTaskElement(task);
            completedTasksList.appendChild(taskEl);
        });
    }
}

function createTaskElement(task) {
    const taskEl = document.createElement('div');
    taskEl.className = `task-item ${task.completed ? 'completed' : ''}`;
    
    const dateObj = new Date(task.date);
    const formattedDate = dateObj.toLocaleDateString('es-ES');
    
    taskEl.innerHTML = `
        <span class="task-symbol">${task.symbol}</span>
        <span class="task-content">${task.content}</span>
        <span class="task-date">${formattedDate}</span>
        <button class="task-toggle" data-id="${task.id}">
            ${task.completed ? '↩' : '✓'}
        </button>
    `;
    
    // Evento para el botón de toggle
    taskEl.querySelector('.task-toggle').addEventListener('click', () => {
        toggleTaskCompletion(task.id);
    });
    
    return taskEl;
}

// FUNCIONES DE EVENTOS
function addEvent(title, date, startTime = '', endTime = '') {
    if (!title.trim() || !date) return false;
    
    if (!events[date]) {
        events[date] = [];
    }
    
    events[date].push({
        id: Date.now(),
        title,
        startTime,
        endTime,
        createdAt: new Date().toISOString()
    });
    
    saveEvents();
    renderEvents();
    renderCalendar();
    return true;
}

function renderEvents() {
    const upcomingEventsList = document.getElementById('upcomingEventsList');
    const pastEventsList = document.getElementById('pastEventsList');
    
    upcomingEventsList.innerHTML = '';
    pastEventsList.innerHTML = '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Separar eventos próximos y pasados
    const upcomingEvents = [];
    const pastEvents = [];
    
    Object.entries(events).forEach(([date, dayEvents]) => {
        const eventDate = new Date(date);
        dayEvents.forEach(event => {
            if (eventDate >= today) {
                upcomingEvents.push({...event, date});
            } else {
                pastEvents.push({...event, date});
            }
        });
    });
    
    // Ordenar eventos por fecha
    upcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    pastEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Renderizar eventos próximos
    if (upcomingEvents.length === 0) {
        upcomingEventsList.innerHTML = '<p>No hay eventos próximos</p>';
    } else {
        upcomingEvents.forEach(event => {
            const eventEl = createEventElement(event);
            upcomingEventsList.appendChild(eventEl);
        });
    }
    
    // Renderizar eventos pasados
    if (pastEvents.length === 0) {
        pastEventsList.innerHTML = '<p>No hay eventos pasados</p>';
    } else {
        pastEvents.forEach(event => {
            const eventEl = createEventElement(event);
            pastEventsList.appendChild(eventEl);
        });
    }
}

function createEventElement(event) {
    const eventEl = document.createElement('div');
    eventEl.className = 'event-item';
    
    const dateObj = new Date(event.date);
    const formattedDate = dateObj.toLocaleDateString('es-ES');
    
    eventEl.innerHTML = `
        <div class="event-date">${formattedDate}</div>
        <div class="event-time">${event.startTime} - ${event.endTime}</div>
        <div class="event-title">${event.title}</div>
    `;
    
    return eventEl;
}

// FUNCIONES DE EMOCIONES
function addEmotion(emotion, note, intensity = 5) {
    if (!emotion) return false;
    
    emotions.push({
        id: Date.now(),
        emotion,
        note,
        intensity,
        date: new Date().toISOString()
    });
    
    saveEmotions();
    renderEmotions();
    return true;
}

function renderEmotions() {
    const emotionsList = document.getElementById('emotionsList');
    emotionsList.innerHTML = '';
    
    if (emotions.length === 0) {
        emotionsList.innerHTML = '<p>No hay emociones registradas</p>';
        return;
    }
    
    // Mostrar emociones en orden inverso (más reciente primero)
    emotions.slice().reverse().forEach(entry => {
        const emotionEl = createEmotionElement(entry);
        emotionsList.appendChild(emotionEl);
    });
}

function createEmotionElement(entry) {
    const emotionEl = document.createElement('div');
    emotionEl.className = 'emotion-entry';
    
    const date = new Date(entry.date);
    const formattedDate = date.toLocaleDateString('es-ES');
    
    emotionEl.innerHTML = `
        <div class="emotion-header">
            <span class="emotion-emoji">${getEmoji(entry.emotion)}</span>
            <span class="emotion-date">${formattedDate}</span>
        </div>
        <div class="emotion-intensity">
            Intensidad: ${'★'.repeat(entry.intensity)}${'☆'.repeat(5 - entry.intensity)}
        </div>
        <div class="emotion-note">${entry.note || 'Sin notas'}</div>
    `;
    
    return emotionEl;
}

// FUNCIONES DE ESTADÍSTICAS
function renderStatistics() {
    // Actualizar estadísticas generales
    document.getElementById('totalTasksStat').textContent = tasks.length;
    document.getElementById('completedTasksStat').textContent = tasks.filter(task => task.completed).length;
    
    const totalEvents = Object.values(events).flat().length;
    document.getElementById('totalEventsStat').textContent = totalEvents;
    document.getElementById('totalEmotionsStat').textContent = emotions.length;
    
    // Renderizar gráficos
    renderEmotionsChart();
    renderProductivityChart();
}

function renderEmotionsChart() {
    const canvas = document.getElementById('emotionsChart');
    const ctx = canvas.getContext('2d');
    
    // Contar emociones por tipo
    const counts = {};
    emotions.forEach(entry => {
        counts[entry.emotion] = (counts[entry.emotion] || 0) + 1;
    });
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Si no hay datos, mostrar mensaje
    if (Object.keys(counts).length === 0) {
        ctx.font = '16px Delius';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'center';
        ctx.fillText('Registra emociones para ver estadísticas', canvas.width/2, canvas.height/2);
        return;
    }
    
    // Preparar datos para el gráfico
    const labels = Object.keys(counts);
    const data = Object.values(counts);
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#8AC926'];
    
    // Dibujar gráfico de pastel
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    
    let startAngle = 0;
    const total = data.reduce((sum, value) => sum + value, 0);
    
    labels.forEach((label, i) => {
        const sliceAngle = (data[i] / total) * 2 * Math.PI;
        
        // Dibujar sector
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        
        // Dibujar etiqueta
        const labelAngle = startAngle + sliceAngle / 2;
        const labelRadius = radius * 0.7;
        const labelX = centerX + Math.cos(labelAngle) * labelRadius;
        const labelY = centerY + Math.sin(labelAngle) * labelRadius;
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Delius';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${label} (${data[i]})`, labelX, labelY);
        
        startAngle += sliceAngle;
    });
}

function renderProductivityChart() {
    const canvas = document.getElementById('productivityChart');
    const ctx = canvas.getContext('2d');
    
    // Obtener datos de los últimos 7 días
    const today = new Date();
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        last7Days.push(date);
    }
    
    // Contar tareas completadas por día
    const completedTasksByDay = last7Days.map(date => {
        const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        return tasks.filter(task => task.date === dateStr && task.completed).length;
    });
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Preparar datos para el gráfico
    const labels = last7Days.map(date => 
        date.toLocaleDateString('es-ES', { weekday: 'short' })
    );
    const data = completedTasksByDay;
    const maxValue = Math.max(...data, 1);
    
    // Configuración del gráfico
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const barWidth = chartWidth / labels.length * 0.6;
    const barSpacing = chartWidth / labels.length * 0.4;
    
    // Dibujar ejes
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.strokeStyle = '#333';
    ctx.stroke();
    
    // Dibujar barras
    labels.forEach((label, i) => {
        const barHeight = (data[i] / maxValue) * chartHeight;
        const x = padding + i * (barWidth + barSpacing) + barSpacing / 2;
        const y = canvas.height - padding - barHeight;
        
        // Dibujar barra
        ctx.fillStyle = '#819A91';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Dibujar etiqueta del día
        ctx.fillStyle = '#333';
        ctx.font = '12px Delius';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + barWidth / 2, canvas.height - padding + 20);
        
        // Dibujar valor
        if (data[i] > 0) {
            ctx.fillText(data[i], x + barWidth / 2, y - 5);
        }
    });
    
    // Título del gráfico
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Delius';
    ctx.textAlign = 'center';
    ctx.fillText('Tareas Completadas por Día', canvas.width / 2, 20);
}

// FUNCIONES DEL MODAL
function openDayModal(date) {
    selectedDate = date;
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    document.getElementById('modalDate').textContent = formattedDate;
    document.getElementById('dayModal').style.display = 'block';
    
    // Renderizar tareas y eventos del día
    renderDayTasks(date);
    renderDayEvents(date);
}

function renderDayTasks(date) {
    const modalTasks = document.getElementById('modal-tasks');
    modalTasks.innerHTML = '';
    
    const dayTasks = tasks.filter(task => task.date === date);
    
    if (dayTasks.length === 0) {
        modalTasks.innerHTML = '<p>No hay tareas para este día</p>';
        return;
    }
    
    dayTasks.forEach(task => {
        const taskEl = createTaskElement(task);
        modalTasks.appendChild(taskEl);
    });
}

function renderDayEvents(date) {
    const modalEvents = document.getElementById('modal-events');
    modalEvents.innerHTML = '';
    
    if (!events[date] || events[date].length === 0) {
        modalEvents.innerHTML = '<p>No hay eventos para este día</p>';
        return;
    }
    
    events[date].forEach(event => {
        const eventEl = createEventElement(event);
        modalEvents.appendChild(eventEl);
    });
}

// FUNCIONES DE PERSISTENCIA
function saveEvents() {
    localStorage.setItem('events', JSON.stringify(events));
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function saveEmotions() {
    localStorage.setItem('emotions', JSON.stringify(emotions));
}

// FUNCIONES DE NOTIFICACIONES
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function showNotification(message, type = 'info') {
    // Notificación en la app
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
    
    // Notificación del sistema si está permitido
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Bullet Journal', {
            body: message,
            icon: 'https://img.icons8.com/color/48/000000/journal.png'
        });
    }
}

function setupDailyReminder() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // 9 AM
    
    const timeUntilTomorrow = tomorrow - now;
    
    setTimeout(() => {
        showNotification('¿Has registrado tus tareas y emociones de hoy?', 'info');
        setupDailyReminder(); // Programar el siguiente recordatorio
    }, timeUntilTomorrow);
}

// FUNCIONES AUXILIARES
function getEmoji(emotion) {
    const emojis = {
        feliz: '😊',
        triste: '😢',
        ansioso: '😰',
        enfadado: '😠',
        cansado: '😴',
        emocionado: '🤗',
        agradecido: '🙏'
    };
    return emojis[emotion] || '';
}

function getMoodPhrase(emotion) {
    const phrases = {
        feliz: '¡Hoy es un gran día!',
        triste: 'Mañana será mejor',
        ansioso: 'Respira hondo, todo estará bien',
        enfadado: 'Un momento de calma puede ayudar',
        cansado: 'Descansar es importante',
        emocionado: '¡La emoción es contagiosa!',
        agradecido: 'La gratitud cambia todo'
    };
    return phrases[emotion] || '';
}
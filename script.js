// ===== DATA STORAGE =====
let habits = JSON.parse(localStorage.getItem('habits')) || [];
let journalEntries = JSON.parse(localStorage.getItem('journal')) || [];

// ===== STATE VARIABLES =====
let currentHabitId = null;
let currentJournalId = null;
let selectedColor = '#667eea';
let selectedMood = null;

// ===== INITIALIZE APP =====
document.addEventListener('DOMContentLoaded', function() {
    renderHabits();
    renderJournal();
    updateStatistics();
    
    // Set today's date in journal form
    document.getElementById('journalDate').valueAsDate = new Date();
});

// ===== TAB SWITCHING =====
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Add active to clicked button
    if (event && event.target) event.target.classList.add('active');
    
    // Update statistics if stats tab is opened
    if (tabName === 'stats') {
        updateStatistics();
        drawChart();
    }
}

// ===== HABIT MODAL FUNCTIONS =====
function openHabitModal() {
    currentHabitId = null;
    document.getElementById('habitModalTitle').textContent = 'Create New Habit';
    document.getElementById('habitForm').reset();
    document.getElementById('deleteHabitBtn').style.display = 'none';
    selectedColor = '#667eea';
    
    // Reset color selection
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.color === '#667eea');
    });
    
    document.getElementById('habitModal').classList.add('active');
}

function closeHabitModal() {
    document.getElementById('habitModal').classList.remove('active');
}

function editHabit(id) {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;
    
    currentHabitId = id;
    document.getElementById('habitModalTitle').textContent = 'Edit Habit';
    document.getElementById('habitName').value = habit.name;
    document.getElementById('habitDescription').value = habit.description || '';
    document.getElementById('habitIcon').value = habit.icon || '';
    
    selectedColor = habit.color;
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.color === habit.color);
    });
    
    document.getElementById('deleteHabitBtn').style.display = 'block';
    document.getElementById('habitModal').classList.add('active');
}

function deleteHabit() {
    if (!confirm('Are you sure you want to delete this habit? All progress will be lost.')) {
        return;
    }
    
    habits = habits.filter(h => h.id !== currentHabitId);
    localStorage.setItem('habits', JSON.stringify(habits));
    closeHabitModal();
    renderHabits();
    updateStatistics();
}

// ===== COLOR PICKER =====
document.getElementById('colorPicker').addEventListener('click', (e) => {
    if (e.target.classList.contains('color-option')) {
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        e.target.classList.add('selected');
        selectedColor = e.target.dataset.color;
    }
});

// ===== HABIT FORM SUBMISSION =====
document.getElementById('habitForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const habitData = {
        id: currentHabitId || Date.now(),
        name: document.getElementById('habitName').value,
        description: document.getElementById('habitDescription').value,
        icon: document.getElementById('habitIcon').value,
        color: selectedColor,
        completions: currentHabitId ? habits.find(h => h.id === currentHabitId).completions : {}
    };
    
    if (currentHabitId) {
        habits = habits.map(h => h.id === currentHabitId ? habitData : h);
    } else {
        habits.push(habitData);
    }
    
    localStorage.setItem('habits', JSON.stringify(habits));
    closeHabitModal();
    renderHabits();
    updateStatistics();
});

// ===== DATE FUNCTIONS =====
function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date);
    }
    return days;
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function getDayLabel(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
}

function formatDateDisplay(dateStr) {
    const date = new Date(dateStr);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// ===== TOGGLE COMPLETION =====
function toggleCompletion(habitId, dateStr) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    
    // Cycle: not completed -> completed -> failed -> not completed
    if (habit.completions[dateStr] === 'completed') {
        habit.completions[dateStr] = 'failed';
    } else if (habit.completions[dateStr] === 'failed') {
        delete habit.completions[dateStr];
    } else {
        habit.completions[dateStr] = 'completed';
    }
    
    localStorage.setItem('habits', JSON.stringify(habits));
    renderHabits();
    updateStatistics();
}

// ===== CALCULATE HABIT STATS =====
function calculateHabitStats(habit) {
    const completions = Object.values(habit.completions);
    const total = completions.length;
    const completed = completions.filter(c => c === 'completed').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { percentage, completed, total };
}

// ===== RENDER HABITS =====
function renderHabits() {
    const container = document.getElementById('habitsContainer');
    const emptyState = document.getElementById('habitsEmpty');
    
    if (habits.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    container.style.display = 'grid';
    emptyState.style.display = 'none';
    
    const last7Days = getLast7Days();
    
    container.innerHTML = habits.map(habit => {
        const stats = calculateHabitStats(habit);
        
        const daysHTML = last7Days.map(date => {
            const dateStr = formatDate(date);
            const completion = habit.completions[dateStr];
            let className = 'day-box';
            let checkMark = '';
            
            if (completion === 'completed') {
                className += ' completed';
                checkMark = '<div class="day-check">✓</div>';
            } else if (completion === 'failed') {
                className += ' failed';
                checkMark = '<div class="day-check">✗</div>';
            }
            
            return `
                <div class="${className}" onclick="toggleCompletion(${habit.id}, '${dateStr}')" title="${getDayLabel(date)}, ${date.getDate()}">
                    <div class="day-label">${getDayLabel(date)}</div>
                    <div class="day-date">${date.getDate()}</div>
                    ${checkMark}
                </div>
            `;
        }).join('');
        
        return `
            <div class="habit-card" style="border-left-color: ${habit.color}">
                <div class="habit-header">
                    <div class="habit-title-section">
                        <div class="habit-title">
                            ${habit.icon ? habit.icon + ' ' : ''}${habit.name}
                        </div>
                        ${habit.description ? `<div class="habit-description">${habit.description}</div>` : ''}
                    </div>
                    <div class="habit-actions">
                        <button class="icon-btn" onclick="editHabit(${habit.id})" title="Edit">✏️</button>
                    </div>
                </div>
                
                <div class="habit-days">
                    ${daysHTML}
                </div>
                
                <div class="habit-stats">
                    <div class="stat-item">
                        <div class="stat-value">${stats.percentage}%</div>
                        <div class="stat-label">Success Rate</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.completed}</div>
                        <div class="stat-label">Completed</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.total}</div>
                        <div class="stat-label">Total Days</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ===== JOURNAL MODAL FUNCTIONS =====
function openJournalModal() {
    currentJournalId = null;
    document.getElementById('journalModalTitle').textContent = 'New Journal Entry';
    document.getElementById('journalForm').reset();
    document.getElementById('journalDate').valueAsDate = new Date();
    document.getElementById('deleteJournalBtn').style.display = 'none';
    selectedMood = null;
    
    // Reset mood buttons
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    document.getElementById('journalModal').classList.add('active');
}

function closeJournalModal() {
    document.getElementById('journalModal').classList.remove('active');
}

function selectMood(mood) {
    selectedMood = mood;
    document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('selected'));
    const btn = document.querySelector(`.mood-btn[data-mood="${mood}"]`);
    if (btn) btn.classList.add('selected');
}

function editJournalEntry(id) {
    const entry = journalEntries.find(e => e.id === id);
    if (!entry) return;
    
    currentJournalId = id;
    document.getElementById('journalModalTitle').textContent = 'Edit Journal Entry';
    document.getElementById('journalDate').value = entry.date;
    document.getElementById('journalTitle').value = entry.title || '';
    document.getElementById('journalEntry').value = entry.entry;
    
    selectedMood = entry.mood;
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.mood === entry.mood);
    });
    
    document.getElementById('deleteJournalBtn').style.display = 'block';
    document.getElementById('journalModal').classList.add('active');
}

function deleteJournalEntry() {
    if (!confirm('Are you sure you want to delete this journal entry?')) {
        return;
    }
    
    journalEntries = journalEntries.filter(e => e.id !== currentJournalId);
    localStorage.setItem('journal', JSON.stringify(journalEntries));
    closeJournalModal();
    renderJournal();
    updateStatistics();
}

// ===== JOURNAL FORM SUBMISSION =====
document.getElementById('journalForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const entryData = {
        id: currentJournalId || Date.now(),
        date: document.getElementById('journalDate').value,
        title: document.getElementById('journalTitle').value,
        mood: selectedMood,
        entry: document.getElementById('journalEntry').value,
        createdAt: currentJournalId ? journalEntries.find(e => e.id === currentJournalId).createdAt : new Date().toISOString()
    };
    
    if (currentJournalId) {
        journalEntries = journalEntries.map(e => e.id === currentJournalId ? entryData : e);
    } else {
        journalEntries.push(entryData);
    }
    
    // Sort by date (newest first)
    journalEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    localStorage.setItem('journal', JSON.stringify(journalEntries));
    closeJournalModal();
    renderJournal();
    updateStatistics();
});

// ===== RENDER JOURNAL =====
function renderJournal() {
    const container = document.getElementById('journalContainer');
    const emptyState = document.getElementById('journalEmpty');
    
    if (journalEntries.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    container.style.display = 'grid';
    emptyState.style.display = 'none';
    
    const moodEmojis = {
        'great': '😊',
        'good': '🙂',
        'okay': '😐',
        'bad': '😔'
    };
    
    container.innerHTML = journalEntries.map(entry => {
        const preview = entry.entry.length > 150 ? entry.entry.substring(0, 150) + '...' : entry.entry;
        const moodIcon = entry.mood ? ( { 'great':'😊','good':'🙂','okay':'😐','bad':'😔' }[entry.mood] || '' ) : '';

        return `
            <div class="journal-card" onclick="editJournalEntry(${entry.id})">
                <div class="journal-header">
                    <div class="journal-date">${formatDateDisplay(entry.date)}</div>
                    <div class="habit-actions">
                        <button class="icon-btn" onclick="event.stopPropagation(); editJournalEntry(${entry.id})" title="Edit">✏️</button>
                    </div>
                </div>
                <div class="journal-body">
                    <div class="journal-title">${entry.title || ''} ${moodIcon ? '<span class="mood-emoji">' + moodIcon + '</span>' : ''}</div>
                    <div class="journal-preview">${preview}</div>
                </div>
            </div>
        `;
    }).join('');

    // After rendering journal entries, ensure the stats chart can be drawn if visible
    drawChart();
}

// ===== DRAW WEEKLY CHART =====
function drawChart() {
    const canvas = document.getElementById('progressChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    // set size
    canvas.width = canvas.offsetWidth;
    canvas.height = 300;

    const last7Days = getLast7Days();
    const data = last7Days.map(date => {
        const dateStr = formatDate(date);
        const dayHabits = habits.length;
        const completed = habits.filter(h => h.completions[dateStr] === 'completed').length;
        return dayHabits > 0 ? (completed / dayHabits) * 100 : 0;
    });

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const padding = 40;
    const chartWidth = canvas.width - (padding * 2);
    const chartHeight = canvas.height - (padding * 2);
    const barWidth = chartWidth / 7;
    const maxValue = 100;

    data.forEach((value, index) => {
        const barHeight = (value / maxValue) * chartHeight;
        const x = padding + (index * barWidth) + (barWidth * 0.1);
        const y = canvas.height - padding - barHeight;
        const width = barWidth * 0.8;

        ctx.fillStyle = '#667eea';
        ctx.fillRect(x, y, width, barHeight);

        ctx.fillStyle = '#333';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(Math.round(value) + '%', x + width / 2, y - 5);

        const dayLabel = getDayLabel(last7Days[index]);
        ctx.fillText(dayLabel, x + width / 2, canvas.height - padding + 20);
    });

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
}

// ===== CLOSE MODALS ON OUTSIDE CLICK =====
document.getElementById('habitModal').addEventListener('click', (e) => {
    if (e.target.id === 'habitModal') {
        closeHabitModal();
    }
});
document.getElementById('journalModal').addEventListener('click', (e) => {
    if (e.target.id === 'journalModal') {
        closeJournalModal();
    }
});
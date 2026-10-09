document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');
    const createModal = document.getElementById('create-modal');
    const cancelModal = document.getElementById('cancel-modal');
    const confirmTripBtn = document.getElementById('confirm-trip');
    const tripNameInput = document.getElementById('trip-name-input');
    
    const plannerSection = document.getElementById('planner-section');
    const heroSection = document.getElementById('hero');
    const tripTitle = document.getElementById('current-trip-title');
    
    const addPlaceBtn = document.getElementById('add-place-btn');
    const placeInput = document.getElementById('place-input');
    const timeInput = document.getElementById('time-input');
    const itineraryList = document.getElementById('itinerary-list');
    
    const addExpenseBtn = document.getElementById('add-expense-btn');
    const expenseName = document.getElementById('expense-name');
    const expenseAmount = document.getElementById('expense-amount');
    const expenseList = document.getElementById('expense-list');
    
    const totalBudgetInput = document.getElementById('total-budget');
    const remainingBalance = document.getElementById('remaining-balance');
    const peopleCountInput = document.getElementById('people-count');
    const perPersonAmount = document.getElementById('per-person-amount');
    
    const exportBtn = document.getElementById('export-btn');
    const tripsGrid = document.getElementById('trips-grid');

    let currentTrip = null;
    let trips = JSON.parse(localStorage.getItem('neon_trips')) || [];

    // --- Modal Logic ---
    startBtn.addEventListener('click', () => {
        createModal.classList.remove('hidden');
        tripNameInput.focus();
    });

    cancelModal.addEventListener('click', () => {
        createModal.classList.add('hidden');
        tripNameInput.value = '';
    });

    confirmTripBtn.addEventListener('click', () => {
        const name = tripNameInput.value.trim();
        if (name) {
            const newTrip = {
                id: Date.now(),
                name: name,
                itinerary: [],
                expenses: [],
                budget: 0,
                people: 1
            };
            trips.push(newTrip);
            saveTrips();
            loadTrip(newTrip);
            createModal.classList.add('hidden');
            tripNameInput.value = '';
            renderTripsGrid();
        }
    });

    // --- Core Logic ---
    function loadTrip(trip) {
        currentTrip = trip;
        tripTitle.textContent = trip.name;
        totalBudgetInput.value = trip.budget;
        peopleCountInput.value = trip.people;
        
        heroSection.classList.add('hidden');
        plannerSection.classList.remove('hidden');
        
        renderItinerary();
        renderExpenses();
        calculateSettlement();
        
        // Scroll to planner
        plannerSection.scrollIntoView({ behavior: 'smooth' });
    }

    function saveTrips() {
        localStorage.setItem('neon_trips', JSON.stringify(trips));
    }

    // --- Itinerary ---
    addPlaceBtn.addEventListener('click', () => {
        const place = placeInput.value.trim();
        const time = timeInput.value;
        if (place && currentTrip) {
            currentTrip.itinerary.push({ id: Date.now(), place, time });
            saveTrips();
            renderItinerary();
            placeInput.value = '';
            timeInput.value = '';
        }
    });

    function renderItinerary() {
        itineraryList.innerHTML = '';
        currentTrip.itinerary.forEach(item => {
            const div = document.createElement('div');
            div.className = 'item-row';
            div.innerHTML = `
                <span><strong>${item.time || '--:--'}</strong> ${item.place}</span>
                <button class="delete-btn" onclick="deleteItinerary(${item.id})"><i class="fas fa-trash"></i></button>
            `;
            itineraryList.appendChild(div);
        });
    }

    window.deleteItinerary = (id) => {
        currentTrip.itinerary = currentTrip.itinerary.filter(i => i.id !== id);
        saveTrips();
        renderItinerary();
    };

    // --- Expenses ---
    addExpenseBtn.addEventListener('click', () => {
        const name = expenseName.value.trim();
        const amount = parseInt(expenseAmount.value);
        if (name && !isNaN(amount) && currentTrip) {
            currentTrip.expenses.push({ id: Date.now(), name, amount });
            saveTrips();
            renderExpenses();
            calculateSettlement();
            expenseName.value = '';
            expenseAmount.value = '';
        }
    });

    function renderExpenses() {
        expenseList.innerHTML = '';
        currentTrip.expenses.forEach(item => {
            const div = document.createElement('div');
            div.className = 'item-row';
            div.innerHTML = `
                <span>${item.name}</span>
                <span>${item.amount.toLocaleString()}원 <button class="delete-btn" onclick="deleteExpense(${item.id})"><i class="fas fa-trash"></i></button></span>
            `;
            expenseList.appendChild(div);
        });
    }

    window.deleteExpense = (id) => {
        currentTrip.expenses = currentTrip.expenses.filter(i => i.id !== id);
        saveTrips();
        renderExpenses();
        calculateSettlement();
    };

    // --- Calculations ---
    function calculateSettlement() {
        if (!currentTrip) return;
        
        const totalSpent = currentTrip.expenses.reduce((sum, i) => sum + i.amount, 0);
        const budget = parseInt(totalBudgetInput.value) || 0;
        const people = parseInt(peopleCountInput.value) || 1;
        
        currentTrip.budget = budget;
        currentTrip.people = people;
        saveTrips();

        const balance = budget - totalSpent;
        remainingBalance.textContent = balance.toLocaleString();
        remainingBalance.style.color = balance < 0 ? '#ff0055' : 'var(--neon-cyan)';
        
        const perPerson = Math.floor(totalSpent / people);
        perPersonAmount.textContent = perPerson.toLocaleString();
    }

    totalBudgetInput.addEventListener('input', calculateSettlement);
    peopleCountInput.addEventListener('input', calculateSettlement);

    // --- Export ---
    exportBtn.addEventListener('click', () => {
        if (!currentTrip) return;

        let content = `[ NEON TRAVELER - ${currentTrip.name} ]\n\n`;
        
        content += `--- 일정 ---\n`;
        currentTrip.itinerary.forEach(i => {
            content += `${i.time || '--:--'} | ${i.place}\n`;
        });

        content += `\n--- 지출 내역 ---\n`;
        let total = 0;
        currentTrip.expenses.forEach(i => {
            content += `${i.name}: ${i.amount.toLocaleString()}원\n`;
            total += i.amount;
        });

        content += `\n--- 정산 요약 ---\n`;
        content += `총 지출: ${total.toLocaleString()}원\n`;
        content += `총 예산: ${currentTrip.budget.toLocaleString()}원\n`;
        content += `남은 잔액: ${(currentTrip.budget - total).toLocaleString()}원\n`;
        content += `인원수: ${currentTrip.people}명\n`;
        content += `인당 지출: ${Math.floor(total / currentTrip.people).toLocaleString()}원\n`;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentTrip.name}_여행요약.txt`;
        a.click();
        URL.revokeObjectURL(url);
    });

    // --- Recent Trips Grid ---
    function renderTripsGrid() {
        tripsGrid.innerHTML = '';
        trips.slice().reverse().forEach(trip => {
            const card = document.createElement('div');
            card.className = 'glass-card trip-card';
            card.innerHTML = `
                <h3 class="neon-text-cyan">${trip.name}</h3>
                <p>${trip.itinerary.length}개의 일정 | ${trip.expenses.length}개의 지출</p>
                <p style="font-size: 0.8rem; margin-top: 10px; color: var(--text-dim)">${new Date(trip.id).toLocaleDateString()}</p>
            `;
            card.addEventListener('click', () => loadTrip(trip));
            tripsGrid.appendChild(card);
        });
    }

    renderTripsGrid();
});

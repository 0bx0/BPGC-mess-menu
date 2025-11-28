document.addEventListener('DOMContentLoaded', () => {
    const csvUrl = 'mess.csv';
    let menuData = [];
    let currentDate = new Date();
    let viewDate = new Date();

    const dayDisplay = document.getElementById('day-display');
    const dateDisplay = document.getElementById('date-display');
    const menuContainer = document.getElementById('menu-container');
    const prevBtn = document.getElementById('prev-day');
    const nextBtn = document.getElementById('next-day');
    const viewLabel = document.querySelector('.current-view-label');

    // Meal Timings (24h format)
    const timings = {
        'Breakfast': { start: '07:30', end: '09:30' },
        'Lunch': { start: '12:30', end: '14:15' },
        'Snacks': { start: '17:00', end: '18:00' },
        'Dinner': { start: '19:30', end: '21:30' }
    };

    // Helper to format date
    const formatDate = (date) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    // Helper to get day name for CSV mapping
    const getDayName = (date) => {
        return date.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue, etc.
    };

    // Parse CSV
    const parseCSV = (csvText) => {
        const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
        const headers = lines[0].split(',');

        const data = [];
        for (let i = 1; i < lines.length; i++) {
            // Handle commas inside quotes if necessary, but simple split for now as per sample
            // The sample doesn't seem to have quoted fields with commas, but let's be safe-ish
            // Actually, the sample is simple.
            const currentLine = lines[i].split(',');
            const obj = {};
            headers.forEach((header, index) => {
                obj[header.trim()] = currentLine[index] ? currentLine[index].trim() : '';
            });
            data.push(obj);
        }
        return data;
    };

    // Fetch Data
    fetch(csvUrl)
        .then(response => response.text())
        .then(text => {
            menuData = parseCSV(text);
            renderMenu();
            scrollToActiveMeal();
        })
        .catch(err => {
            console.error('Error loading menu:', err);
            menuContainer.innerHTML = '<p style="text-align:center; color: var(--danger)">Failed to load menu. Please ensure you are running this on a local server.</p>';
        });

    // Render Menu
    const renderMenu = () => {
        const dayName = getDayName(viewDate); // Mon, Tue...
        // Map short day name to CSV header if needed. CSV headers are Mon, Tue, Wed, Thurs, Fri, Sat, Sun
        // "Thu" needs to be "Thurs"
        let csvDay = dayName;
        if (dayName === 'Thu') csvDay = 'Thurs';

        dayDisplay.textContent = viewDate.toLocaleDateString('en-US', { weekday: 'long' });
        dateDisplay.textContent = viewDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

        // Update View Label
        const today = new Date();
        if (viewDate.toDateString() === today.toDateString()) {
            viewLabel.textContent = "Today";
        } else {
            viewLabel.textContent = viewDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
        }

        menuContainer.innerHTML = '';

        // Group by Category (Breakfast, Lunch, etc.)
        const categories = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];

        categories.forEach(category => {
            const items = menuData.filter(item => item.Category === category);
            if (items.length === 0) return;

            const section = document.createElement('div');
            section.className = 'meal-section';
            section.id = `meal-${category.toLowerCase()}`;

            // Check if active
            if (isMealActive(category) && viewDate.toDateString() === new Date().toDateString()) {
                section.classList.add('active-meal');
            }

            const header = document.createElement('div');
            header.className = 'meal-header';

            const titleGroup = document.createElement('div');
            if (section.classList.contains('active-meal')) {
                titleGroup.innerHTML = `<span class="active-indicator"></span>${category}`;
            } else {
                titleGroup.textContent = category;
            }
            titleGroup.className = 'meal-title';

            const time = document.createElement('div');
            time.className = 'meal-time';
            const timing = timings[category];
            time.textContent = `${timing.start} - ${timing.end}`;

            header.appendChild(titleGroup);
            header.appendChild(time);

            const card = document.createElement('div');
            card.className = 'meal-card';

            items.forEach(item => {
                const row = document.createElement('div');
                row.className = 'menu-item';

                const type = document.createElement('span');
                type.className = 'item-type';
                type.textContent = item['Item Type'];

                const name = document.createElement('span');
                name.className = 'item-name';
                // Get the value for the specific day
                let foodItem = item[csvDay];
                if (!foodItem || foodItem === '-') foodItem = 'Not Available';
                name.textContent = foodItem;

                row.appendChild(type);
                row.appendChild(name);
                card.appendChild(row);
            });

            section.appendChild(header);
            section.appendChild(card);
            menuContainer.appendChild(section);
        });
    };

    // Check if meal is active or upcoming
    const isMealActive = (category) => {
        return category === getActiveMealCategory();
    };

    const getActiveMealCategory = () => {
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTime = currentHours * 60 + currentMinutes;

        const categories = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];

        for (const category of categories) {
            const timing = timings[category];
            const [endH, endM] = timing.end.split(':').map(Number);
            const endTime = endH * 60 + endM;

            if (currentTime < endTime) {
                return category;
            }
        }
        return null; // All meals done for the day
    };

    const scrollToActiveMeal = () => {
        // Only scroll if viewing today
        if (viewDate.toDateString() !== new Date().toDateString()) return;

        const activeCategory = getActiveMealCategory();

        if (activeCategory) {
            const section = document.getElementById(`meal-${activeCategory.toLowerCase()}`);
            if (section) {
                // Ensure class is added
                document.querySelectorAll('.meal-section').forEach(s => s.classList.remove('active-meal'));
                section.classList.add('active-meal');

                // Add indicator if missing
                const title = section.querySelector('.meal-title');
                if (title && !title.querySelector('.active-indicator')) {
                    title.innerHTML = `<span class="active-indicator"></span>${activeCategory}`;
                }

                setTimeout(() => {
                    section.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 500); // Increased timeout to ensure rendering is done
            }
        }
    };

    // Event Listeners
    prevBtn.addEventListener('click', () => {
        viewDate.setDate(viewDate.getDate() - 1);
        renderMenu();
    });

    nextBtn.addEventListener('click', () => {
        viewDate.setDate(viewDate.getDate() + 1);
        renderMenu();
    });

});

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

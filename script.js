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
        'Lunch': { start: '12:00', end: '14:15' },
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
            menuContainer.innerHTML = '<p style="text-align:center; color: var(--danger)">Failed to load menu. Please contact Debraj</p>';
        });

    // Render Menu
    const renderMenu = () => {
        const dayName = getDayName(viewDate); // Mon, Tue...
        // Determine which CSV header to use for the day. Different CSVs may use 'Thu' or 'Thurs'.
        let csvDay = dayName;
        if (menuData && menuData.length) {
            const headers = Object.keys(menuData[0]);
            if (!headers.includes(csvDay)) {
                if (dayName === 'Thu') {
                    // Prefer the header that actually exists in the CSV
                    if (headers.includes('Thu')) csvDay = 'Thu';
                    else if (headers.includes('Thurs')) csvDay = 'Thurs';
                } else {
                    // Fallback: try the long weekday name (e.g., 'Thursday')
                    const longDay = viewDate.toLocaleDateString('en-US', { weekday: 'long' });
                    if (headers.includes(longDay)) csvDay = longDay;
                }
            }
        }

        dayDisplay.textContent = viewDate.toLocaleDateString('en-US', { weekday: 'long' });
        dateDisplay.textContent = viewDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

        // Update View Label
        const today = new Date();
        if (viewDate.toDateString() === today.toDateString()) {
            viewLabel.textContent = "Today";
        } else {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            if (viewDate.toDateString() === tomorrow.toDateString()) {
                viewLabel.textContent = "Tomorrow";
            } else if (viewDate.toDateString() === yesterday.toDateString()) {
                viewLabel.textContent = "Yesterday";
            } else {
                viewLabel.textContent = viewDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
            }
        }

        menuContainer.innerHTML = '';

        // Group by Category (Breakfast, Lunch, etc.)

        const categories = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];
        categories.forEach(category => {
            // Use 'Meal' for new CSV format
            const items = menuData.filter(item => item['Meal'] === category);
            if (items.length === 0) return;

            const section = document.createElement('div');
            section.className = 'meal-section';
            section.id = `meal-${category.toLowerCase()}`;

            // Check if active
            if (isMealActive(category)) {
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
                const itemType = item['Item'] || '';
                // Get the value for the specific day
                let foodItem = item[csvDay];

                // Treat asterisk-only entries (e.g. "******") as empty
                if (foodItem && /^\*+$/.test(foodItem)) foodItem = '';

                // Show a single dash when no item is provided; preserve '-' if present in CSV
                const isEmpty = !foodItem;
                if (isEmpty) foodItem = '-';

                const row = document.createElement('div');
                row.className = 'menu-item';

                const name = document.createElement('span');
                name.className = 'item-name';
                if (isEmpty) name.classList.add('empty-item');
                name.textContent = foodItem;

                row.appendChild(name);
                card.appendChild(row);
            });

            section.appendChild(header);
            section.appendChild(card);
            menuContainer.appendChild(section);
        });

        // Setup Intersection Observer for Dynamic Background Glow
        setupBackgroundObserver();
    };

    // Observer to track which meal section is currently visible to change the BG blur
    const setupBackgroundObserver = () => {
        const sections = document.querySelectorAll('.meal-section');
        const observerOptions = {
            root: null,
            rootMargin: '-10% 0px -40% 0px',
            threshold: 0.1
        };

        const mealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const category = entry.target.id.replace('meal-', '');
                    const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);
                    document.body.setAttribute('data-scroll-meal', formattedCategory);
                }
            });
        }, observerOptions);

        sections.forEach(section => {
            mealObserver.observe(section);
        });
    };

    // Check if meal is active or upcoming
    const isMealActive = (category) => {
        const state = getActiveMealState();
        if (state.category !== category) return false;

        const today = new Date();
        const isViewToday = viewDate.toDateString() === today.toDateString();

        if (state.isNextDay) {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return viewDate.toDateString() === tomorrow.toDateString();
        } else {
            return isViewToday;
        }
    };

    const getActiveMealState = () => {
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
                return { category, isNextDay: false };
            }
        }
        return { category: 'Breakfast', isNextDay: true };
    };

    const scrollToActiveMeal = () => {
        const state = getActiveMealState();
        const today = new Date();

        let shouldScroll = false;
        if (state.isNextDay) {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            if (viewDate.toDateString() === tomorrow.toDateString()) shouldScroll = true;
        } else {
            if (viewDate.toDateString() === today.toDateString()) shouldScroll = true;
        }

        if (shouldScroll) {
            const section = document.getElementById(`meal-${state.category.toLowerCase()}`);
            if (section) {
                // Ensure class is added
                document.querySelectorAll('.meal-section').forEach(s => s.classList.remove('active-meal'));
                section.classList.add('active-meal');

                // Add indicator if missing
                const title = section.querySelector('.meal-title');
                if (title && !title.querySelector('.active-indicator')) {
                    title.innerHTML = `<span class="active-indicator"></span>${state.category}`;
                }

                setTimeout(() => {
                    section.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 500);
            }
        }
    };

    // Event Listeners
    // Helper to find visible meal
    const getVisibleMealCategory = () => {
        const sections = document.querySelectorAll('.meal-section');
        let visibleCategory = null;
        let minDistance = Infinity;

        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            // Distance from top of viewport (considering sticky header offset approx 150px)
            const distance = Math.abs(rect.top - 150);
            if (distance < minDistance) {
                minDistance = distance;
                const id = section.id.replace('meal-', '');
                visibleCategory = id.charAt(0).toUpperCase() + id.slice(1);
            }
        });
        return visibleCategory;
    };


    // --- Improved Interactive Day Slide Transition ---
    const menuContainerParent = document.querySelector('.app-container');
    let isSliding = false;

    function animateDaySlide(direction, callback) {
        if (isSliding) return;
        isSliding = true;
        const menu = document.getElementById('menu-container');

        // Phase 1: Slide out
        menu.style.transition = 'transform 0.28s cubic-bezier(0.4,0,0.6,1), opacity 0.2s ease';
        menu.style.willChange = 'transform, opacity';
        menu.style.transform = `translateX(${direction === 'left' ? '-40%' : '40%'})`;
        menu.style.opacity = '0';

        setTimeout(() => {
            // Execute the day change
            callback();

            // Phase 2: Instant reposition on opposite side
            menu.style.transition = 'none';
            menu.style.transform = `translateX(${direction === 'left' ? '30%' : '-30%'})`;
            menu.style.opacity = '0';

            // Force reflow
            menu.offsetHeight;

            // Phase 3: Spring in from opposite side
            requestAnimationFrame(() => {
                menu.style.transition = 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease-out';
                menu.style.transform = 'translateX(0)';
                menu.style.opacity = '1';

                setTimeout(() => {
                    menu.style.transition = '';
                    menu.style.willChange = '';
                    isSliding = false;
                }, 380);
            });
        }, 280);
    }

    const scrollToCategory = (category) => {
        if (!category) return;
        const section = document.getElementById(`meal-${category.toLowerCase()}`);
        if (section) {
            const headerOffset = 160;
            const elementPosition = section.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "instant"
            });
        }
    };

    // Event Listeners

    prevBtn.addEventListener('click', () => {
        if (isSliding) return;
        const currentCategory = getVisibleMealCategory();
        animateDaySlide('right', () => {
            viewDate.setDate(viewDate.getDate() - 1);
            renderMenu();
            if (currentCategory) scrollToCategory(currentCategory);
        });
    });

    nextBtn.addEventListener('click', () => {
        if (isSliding) return;
        const currentCategory = getVisibleMealCategory();
        animateDaySlide('left', () => {
            viewDate.setDate(viewDate.getDate() + 1);
            renderMenu();
            if (currentCategory) scrollToCategory(currentCategory);
        });
    });

    // --- NEW: PWA Prompt Logic ---
    const pwaPrompt = document.getElementById('pwa-prompt');
    const pwaInstallBtn = document.getElementById('pwa-install-btn');
    const pwaCloseBtn = document.getElementById('pwa-close-btn');
    const pwaModal = document.getElementById('pwa-modal');
    const pwaModalClose = document.getElementById('pwa-modal-close');

    // Detect if device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Detect standalone mode (PWA installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    // Show prompt if mobile and not installed
    if (isMobile && !isStandalone) {
        // Show after a short delay
        setTimeout(() => {
            if (pwaPrompt) pwaPrompt.setAttribute('aria-hidden', 'false');
        }, 1500);
    }

    if (pwaCloseBtn) {
        pwaCloseBtn.addEventListener('click', () => {
            pwaPrompt.setAttribute('aria-hidden', 'true');
        });
    }

    if (pwaInstallBtn) {
        pwaInstallBtn.addEventListener('click', () => {
            pwaPrompt.setAttribute('aria-hidden', 'true');
            if (pwaModal) pwaModal.setAttribute('aria-hidden', 'false');
        });
    }

    if (pwaModalClose) {
        pwaModalClose.addEventListener('click', () => {
            pwaModal.setAttribute('aria-hidden', 'true');
        });
    }

    // --- Interactive Swipe Gestures with Visual Drag Feedback ---
    let touchStartX = 0;
    let touchStartY = 0;
    let touchCurrentX = 0;
    let isDragging = false;
    let dragLocked = false; // true = horizontal swipe, false = not yet decided

    const menu = document.getElementById('menu-container');

    document.addEventListener('touchstart', e => {
        if (isSliding) return;
        touchStartX = e.changedTouches[0].clientX;
        touchStartY = e.changedTouches[0].clientY;
        touchCurrentX = touchStartX;
        isDragging = false;
        dragLocked = false;
    }, { passive: true });

    document.addEventListener('touchmove', e => {
        if (isSliding) return;
        const currentX = e.changedTouches[0].clientX;
        const currentY = e.changedTouches[0].clientY;
        const diffX = currentX - touchStartX;
        const diffY = currentY - touchStartY;

        // Decide drag direction after 10px of movement
        if (!dragLocked && (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)) {
            if (Math.abs(diffX) > Math.abs(diffY) * 1.2) {
                dragLocked = true;
                isDragging = true;
            } else {
                // Vertical scroll — bail out
                isDragging = false;
                return;
            }
        }

        if (isDragging) {
            touchCurrentX = currentX;
            // Apply drag transform with rubber-band effect
            const drag = diffX * 0.35; // Dampen the drag
            const opacity = Math.max(0.4, 1 - Math.abs(diffX) / 600);
            menu.style.transition = 'none';
            menu.style.transform = `translateX(${drag}px)`;
            menu.style.opacity = opacity;
        }
    }, { passive: true });

    document.addEventListener('touchend', e => {
        if (isSliding) return;
        
        const diffX = e.changedTouches[0].clientX - touchStartX;
        const diffY = e.changedTouches[0].clientY - touchStartY;
        const swipeThreshold = 60;

        if (isDragging && Math.abs(diffX) > swipeThreshold) {
            // Commit the swipe
            const currentCategory = getVisibleMealCategory();
            if (diffX > 0) {
                // Swiped right -> previous day
                animateDaySlide('right', () => {
                    viewDate.setDate(viewDate.getDate() - 1);
                    renderMenu();
                    if (currentCategory) scrollToCategory(currentCategory);
                });
            } else {
                // Swiped left -> next day
                animateDaySlide('left', () => {
                    viewDate.setDate(viewDate.getDate() + 1);
                    renderMenu();
                    if (currentCategory) scrollToCategory(currentCategory);
                });
            }
        } else if (isDragging) {
            // Snap back — swipe not strong enough
            menu.style.transition = 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease';
            menu.style.transform = 'translateX(0)';
            menu.style.opacity = '1';
            setTimeout(() => {
                menu.style.transition = '';
            }, 320);
        }

        isDragging = false;
        dragLocked = false;
    }, { passive: true });

});

// Register Service Worker
// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);

            // Check if there's already a waiting worker (update downloaded but not activated)
            if (registration.waiting) {
                showUpdateNotification();
            }

            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('ServiceWorker update found');

                newWorker.addEventListener('statechange', () => {
                    console.log('ServiceWorker state changed:', newWorker.state);
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New update available
                        showUpdateNotification();
                    }
                });
            });
        }).catch(err => {
            console.log('ServiceWorker registration failed: ', err);
        });

        // Handle controller change (reload when new worker takes over)
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                refreshing = true;
                window.location.reload();
            }
        });
    });
}

function showUpdateNotification() {
    const notification = document.getElementById('update-notification');
    const updateBtn = document.getElementById('update-btn');

    if (notification && updateBtn) {
        notification.classList.remove('hidden');

        updateBtn.addEventListener('click', () => {
            // Skip waiting on the waiting service worker
            if (navigator.serviceWorker.getRegistration) {
                navigator.serviceWorker.getRegistration().then(reg => {
                    if (reg && reg.waiting) {
                        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                    } else {
                        window.location.reload();
                    }
                });
            }
        });
    }
}

// Potatos are not green

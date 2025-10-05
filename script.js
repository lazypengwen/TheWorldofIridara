// --- DOM Element References ---
const sidebarItems = document.querySelectorAll('.sidebar-nav .nav-item');
const charBar = document.getElementById('character-selection-bar');
const mainImage = document.getElementById('main-character-img');
const charName = document.getElementById('character-name');
const vcName = document.getElementById('vc-name'); 
const charDescription = document.getElementById('character-description');
const charQuote = document.getElementById('character-quote'); 
const startScreen = document.getElementById('start-screen'); 
const startButton = document.getElementById('start-button');
const appContainer = document.getElementById('app-container');


// --- Global State ---
let bookIndex = {};
let characterCache = {};
let currentbook = "TMGD"; 

async function loadCharacterIndex() {
    try {
        const response = await fetch('book_index.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        bookIndex = await response.json();
        console.log("Book index loaded successfully.");
        // FIX: Setup the start button listener after data is loaded
        setupStartScreen(); 

    } catch (error) {
        console.error("Could not load book index:", error);
        charBar.innerHTML = `<p style="color:red; opacity:0.8; padding: 15px;">Error: Could not load book index data. (Check JSON contents or console for details)</p>`;
        // Allow the user to proceed even on error, but the app will be blank
        setupStartScreen();
    }
}

async function loadAndSwitchCharacter(charId, bookId) {
    const cacheKey = `${bookId}_${charId}`;
    let charData;

    if (characterCache[cacheKey]) {
        charData = characterCache[cacheKey];
    } else {
        const filePath = `data/${bookId}/${charId}.json`;
        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            charData = await response.json();
            characterCache[cacheKey] = charData; // Cache the result
        } catch (error) {
            console.error(`Failed to load data for ${charId}:`, error);
            return;
        }
    }

    switchCharacterUI(charId, charData);
}

// --- UI / LOGIC FUNCTIONS ---

function createCharacterIcon(charId, bookId) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('char-icon-wrapper');
    wrapper.setAttribute('data-char', charId);

    const iconPath = `data/${bookId}/${charId}.png`;

    const icon = document.createElement('img');
    icon.classList.add('char-icon');
    icon.src = iconPath; 
    icon.alt = charId.toUpperCase();

    const name = document.createElement('p');
    name.classList.add('char-name');
    name.textContent = charId.charAt(0).toUpperCase() + charId.slice(1); // Simple capitalization
    
    wrapper.appendChild(icon);
    wrapper.appendChild(name);
    wrapper.addEventListener('click', () => {
        loadAndSwitchCharacter(charId, currentbook); 
    });

    return wrapper;
}


function loadbook(bookId) {
    const charIdList = bookIndex[bookId];
    
    if (!charIdList || charIdList.length === 0) {
        charBar.innerHTML = `<p style="color:white; opacity:0.6;">Content for this book is not yet available or indexed.</p>`;
        sidebarItems.forEach(item => item.classList.remove('active'));
        document.querySelector(`.nav-item[data-book="${bookId}"]`).classList.add('active');
        charName.textContent = '';
        vcName.textContent = ''; 
        charDescription.textContent = '';
        charQuote.textContent = '';
        mainImage.src = '';
        return; 
    }

    charBar.innerHTML = '';
    
    charIdList.forEach(charId => {
        const iconElement = createCharacterIcon(charId, bookId);
        charBar.appendChild(iconElement);
    });
    
    sidebarItems.forEach(item => item.classList.remove('active'));
    document.querySelector(`.nav-item[data-book="${bookId}"]`).classList.add('active');

    let firstCharId = charIdList[0];
    loadAndSwitchCharacter(firstCharId, bookId); 
}


function switchCharacterUI(charId, data) {
    mainImage.style.opacity = 0; 
    
    setTimeout(() => {
        const fullImagePath = `data/${currentbook}/${data.image_large}`; 
        
        mainImage.src = fullImagePath;
        charName.textContent = data.name;
        vcName.textContent = data.vc;
        charDescription.textContent = data.description;
        charQuote.textContent = data.quote;
        mainImage.style.opacity = 1; 
    }, 300); 

    document.querySelectorAll('.char-icon-wrapper').forEach(wrapper => {
        wrapper.classList.remove('active');
    });
    document.querySelector(`.char-icon-wrapper[data-char="${charId}"]`).classList.add('active');
}

function initializeApp() {
    appContainer.classList.add('visible');
    loadbook(currentbook);
    
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            const bookId = item.getAttribute('data-book');
            if (bookId) {
                currentbook = bookId;
                loadbook(currentbook);
            }
        });
    });
}

function setupStartScreen() {
    if (startButton) {
        startButton.addEventListener('click', () => {
            startScreen.classList.add('fading-out');
            appContainer.classList.remove('hidden');
            initializeApp();
            setTimeout(() => {
                startScreen.classList.add('hidden');
                startScreen.classList.remove('fading-out');
            }, 1000); 
        });
    } else {
        console.error("Start button not found. Initialization failed.");
    }
}


window.onload = loadCharacterIndex; 
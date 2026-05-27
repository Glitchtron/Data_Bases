import { db, myRentals, myCart, userAccount, currentUser, loginUser, logoutUser } from './api.js';
import { Navbar } from './components/Navbar.js';
import { SearchBar } from './components/SearchBar.js';
import { MovieCard } from './components/MovieCard.js';

const app = document.getElementById('app');
let currentView = 'catalog';
let displayedMovies = [...db];
let currentMovieId = null;
let isSidebarCollapsed = false;

let simulatedDays = 0;
const getCurrentDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + simulatedDays);
    return d;
};
const formatDate = (date) => date.toLocaleDateString('pl-PL');

const checkExpirations = () => {
    const today = getCurrentDate();
    const expired = myRentals.filter(r => today > r.dueDateObj);
    
    if (expired.length > 0) {
        const titles = expired.map(e => e.title).join(', ');
        alert(`Czas minął! Następujące filmy wygasły i zniknęły z Twojej biblioteki: ${titles}. Aby obejrzeć je ponownie, musisz je znów wypożyczyć.`);
        
        expired.forEach(e => {
            const movie = db.find(m => m.id === e.id);
            if(movie) { movie.copies += 1; movie.available = true; }
        });
        
        const validRentals = myRentals.filter(r => today <= r.dueDateObj);
        myRentals.length = 0; 
        myRentals.push(...validRentals); 
    }
};

const render = () => {
    if (!currentUser) {
        app.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; width: 100%; background: var(--bg-dark);">
                <div style="background: var(--sidebar-bg); padding: 40px; border-radius: 12px; width: 350px; text-align: center; border: 1px solid #252a34; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                    <img src="assets/logo.png" alt="Logo" style="width: 80px; margin-bottom: 20px;">
                    <h2 style="margin-bottom: 30px; color: white;">Logowanie</h2>
                    <input type="text" id="loginUsername" placeholder="Nazwa użytkownika" class="search-bar" style="margin-bottom: 15px; text-align: center;">
                    <input type="password" id="loginPassword" placeholder="Hasło" class="search-bar" style="margin-bottom: 25px; text-align: center;">
                    <button class="btn btn-primary" style="width: 100%; font-size: 16px; padding: 12px;" onclick="window.handleLogin()">ZALOGUJ SIĘ</button>
                </div>
            </div>
        `;
        return;
    }

    let mainContent = '';

    if (currentView === 'catalog') {
        mainContent = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h1>Katalog Filmów</h1>
                <p style="color: var(--text-muted);">Dzisiaj: <strong>${formatDate(getCurrentDate())}</strong></p>
            </div>
            ${SearchBar()}
            <div class="grid">
                ${displayedMovies.map(m => MovieCard(m)).join('')}
            </div>
        `;
    } else if (currentView === 'details') {
        const movie = db.find(m => m.id === currentMovieId);
        mainContent = `
            <button class="btn btn-secondary" style="margin-bottom: 20px; width: 200px;" onclick="window.navigate('catalog')">← Wróć do katalogu</button>
            <div class="details-container">
                <img src="${movie.poster}" class="details-poster">
                <div class="details-info">
                    <h1>${movie.title}</h1>
                    <p><strong>Cena:</strong> <span style="color: var(--accent); font-weight: bold;">${movie.price} PLN / 7 dni</span></p>
                    <p><strong>Gatunek:</strong> ${movie.genre} | <strong>Reżyser:</strong> ${movie.director}</p>
                    <p>${movie.description}</p>
                    <button class="btn btn-primary" style="width: 250px; margin-top:20px;" ${!movie.available ? 'disabled' : ''} onclick="window.addToCart(${movie.id})">
                        ${movie.available ? 'DODAJ DO KOSZYKA' : 'NIEDOSTĘPNY'}
                    </button>
                </div>
            </div>
        `;
    } else if (currentView === 'cart') {
        const total = myCart.reduce((sum, item) => sum + item.price, 0);
        mainContent = `
            <h1 style="margin-bottom: 20px;">Twój Koszyk</h1>
            ${myCart.length === 0 ? '<p style="color: var(--text-muted)">Koszyk jest pusty.</p>' : `
                <table>
                    <tr><th>Tytuł filmu</th><th>Cena</th><th>Akcja</th></tr>
                    ${myCart.map((item, index) => `
                        <tr>
                            <td><strong>${item.title}</strong></td>
                            <td>${item.price} PLN</td>
                            <td><button class="btn btn-secondary" onclick="window.removeFromCart(${index})">Usuń</button></td>
                        </tr>
                    `).join('')}
                </table>
                <div style="margin-top: 30px; text-align: right; background: var(--sidebar-bg); padding: 20px; border-radius: 8px;">
                    <h2>Do zapłaty: <span style="color: var(--accent);">${total} PLN</span></h2>
                    <button class="btn btn-primary" style="width: 200px; margin-top: 15px; font-size: 16px;" onclick="window.checkout()">ZAPŁAĆ I WYPOŻYCZ</button>
                </div>
            `}
        `;
    } else if (currentView === 'rentals') {
        mainContent = `
            <h1 style="margin-bottom: 20px;">Moje Wypożyczenia</h1>
            ${myRentals.length === 0 ? '<p style="color: var(--text-muted)">Obecnie nie masz żadnych aktywnych wypożyczeń.</p>' : `
                <table>
                    <tr><th>Tytuł filmu</th><th>Wygasa</th><th>Akcja</th></tr>
                    ${myRentals.map(r => `
                        <tr>
                            <td><strong>${r.title}</strong></td>
                            <td style="color: white">${r.dueDate}</td>
                            <td>
                                <a href="${r.trailer}" target="_blank" class="btn btn-primary" style="text-decoration:none; display:inline-block; text-align:center; padding: 10px 20px;">
                                    ▶ Obejrzyj
                                </a>
                            </td>
                        </tr>
                    `).join('')}
                </table>
            `}
        `;
    }

    app.innerHTML = `
        ${Navbar(currentView, isSidebarCollapsed, userAccount, myCart.length, currentUser)}
        <main class="main-content">${mainContent}</main>
    `;
};

window.handleLogin = () => {
    const userValue = document.getElementById('loginUsername').value;
    const passValue = document.getElementById('loginPassword').value;
    
    if(userValue.trim() !== '' && passValue.trim() !== '') {
        loginUser(userValue);
        render();
    } else {
        alert("Wprowadź nazwę użytkownika i hasło!");
    }
};

window.handleLogout = () => {
    logoutUser();
    currentView = 'catalog';
    render();
};

window.toggleSidebar = () => { 
    isSidebarCollapsed = !isSidebarCollapsed; 
    render(); 
};

window.navigate = (view) => { 
    currentView = view; 
    displayedMovies = [...db]; 
    if(view === 'rentals') checkExpirations(); 
    render(); 
};

window.showDetails = (id) => { 
    currentMovieId = id; 
    currentView = 'details'; 
    render(); 
};

window.filterMovies = (query) => {
    const q = query.toLowerCase();
    displayedMovies = db.filter(m => m.title.toLowerCase().includes(q) || m.director.toLowerCase().includes(q));
    render();
};

window.addDay = () => { 
    simulatedDays += 1; 
    checkExpirations(); 
    render(); 
};

window.addToCart = (id) => {
    const movie = db.find(m => m.id === id);
    if(myCart.find(item => item.id === id) || myRentals.find(r => r.id === id)) {
        alert("Ten film jest już w Twoim koszyku lub bibliotece!");
        return;
    }
    if(movie.copies > 0) {
        myCart.push({ id: movie.id, title: movie.title, price: movie.price, trailer: movie.trailer });
        alert(`Dodano do koszyka: ${movie.title}`);
        render();
    }
};

window.removeFromCart = (index) => {
    myCart.splice(index, 1);
    render();
};

window.checkout = () => {
    const total = myCart.reduce((sum, item) => sum + item.price, 0);
    if (userAccount.balance < total) {
        alert(`Brak środków na koncie! Brakuje Ci ${total - userAccount.balance} PLN.`);
        return;
    }

    userAccount.balance -= total;

    myCart.forEach(item => {
        const movie = db.find(m => m.id === item.id);
        movie.copies -= 1;
        if(movie.copies === 0) movie.available = false;

        const dueDateObj = getCurrentDate();
        dueDateObj.setDate(dueDateObj.getDate() + 7); 
        
        myRentals.push({ 
            id: item.id, 
            title: item.title,
            trailer: item.trailer,
            dueDate: formatDate(dueDateObj),
            dueDateObj: dueDateObj
        });
    });

    myCart.length = 0;
    alert("Zakup udany! Filmy zostały dodane do Twojej biblioteki.");
    window.navigate('rentals'); 
};

render();
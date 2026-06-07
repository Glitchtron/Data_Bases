import { db, myRentals, myCart, currentUser, loginUser, logoutUser, fetchMovies,fetchMyRentals,setCurrentUser,returnMovie,depositMoney,popularMovies,fetchPopularMovies,prolongLoan } from './api.js';
import { Navbar } from './components/Navbar.js';
import { SearchBar } from './components/SearchBar.js';
import { MovieCard } from './components/MovieCard.js';


const app = document.getElementById('app');
let currentView = 'catalog';
let authView = 'login';
let displayedMovies = []; 
let currentMovieId = null;
let isSidebarCollapsed = false;

let simulatedDays = 0;
const getCurrentDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + simulatedDays);
    return d;
};
const formatDate = (date) => date.toLocaleDateString('pl-PL');

// Inicjalizuje aplikację - pobiera filmy z bazy przed pierwszym renderem
const initApp = async () => {
    await fetchMovies(); // Pobranie filmów z API Node.js
    displayedMovies = [...db]; // Przypisanie pobranych filmów do wyświetlenia
    render();
};

const checkExpirations = () => {
    const today = getCurrentDate();
    const todayMs = today.getTime(); // Aktualny czas w milisekundach
    
    // Filtrujemy na podstawie czystych liczb (ms)
    const expired = myRentals.filter(r => r.dueDateTimestamp && todayMs > r.dueDateTimestamp);
    
    if (expired.length > 0) {
        const titles = expired.map(e => e.title).join(', ');
        alert(`Czas minął! Następujące filmy wygasły i zniknęły z Twojej biblioteki: ${titles}.`);
        
        expired.forEach(e => {
            const movie = db.find(m => m.id === e.id);
            if(movie) { movie.copies += 1; movie.available = true; }
        });
        
        const validRentals = myRentals.filter(r => !r.dueDateTimestamp || todayMs <= r.dueDateTimestamp);
        myRentals.length = 0; 
        myRentals.push(...validRentals); 
    }
};
const render = () => {
    if (!currentUser) {
        if (authView === 'login'){
            app.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; height: 100vh; width: 100%; background: var(--bg-dark);">
                    <div style="background: var(--sidebar-bg); padding: 40px; border-radius: 12px; width: 350px; text-align: center; border: 1px solid #252a34; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                        <img src="assets/logo.png" alt="Logo" style="width: 80px; margin-bottom: 20px;">
                        <h2 style="margin-bottom: 30px; color: white;">Logowanie</h2>
                        <input type="email" id="loginEmail" placeholder="Adres E-mail (z bazy)" class="search-bar" style="margin-bottom: 15px; text-align: center;">
                        <input type="password" id="loginPassword" placeholder="Hasło" class="search-bar" style="margin-bottom: 25px; text-align: center;">
                        <button class="btn btn-primary" style="width: 100%; font-size: 16px; padding: 12px;" onclick="window.handleLogin()">ZALOGUJ SIĘ</button>

                        <a href="#" style="color: var(--accent); text-decoration: none; font-size: 14px;" onclick="window.switchAuthView('register')">Nie masz konta? Zarejestruj się!</a>
                    </div>
                </div>
            `;
        }
        else if (authView == 'register'){
            app.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; height: 100vh; width: 100%; background: var(--bg-dark);">
                    <div style="background: var(--sidebar-bg); padding: 40px; border-radius: 12px; width: 350px; text-align: center; border: 1px solid #252a34; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                        <img src="assets/logo.png" alt="Logo" style="width: 80px; margin-bottom: 20px;">
                        <h2 style="margin-bottom: 30px; color: white;">Rejestracja</h2>
                        <input type="text" id="regFirstname" placeholder="Imię" class="search-bar" style="margin-bottom: 15px; text-align: center;">
                        <input type="text" id="regLastname" placeholder="Nazwisko" class="search-bar" style="margin-bottom: 15px; text-align: center;">
                        <input type="email" id="regEmail" placeholder="Adres E-mail" class="search-bar" style="margin-bottom: 15px; text-align: center;">
                        <input type="password" id="regPassword" placeholder="Hasło" class="search-bar" style="margin-bottom: 25px; text-align: center;">
                        <button class="btn btn-primary" style="width: 100%; font-size: 16px; padding: 12px; margin-bottom: 20px;" onclick="window.handleRegister()">ZAREJESTRUJ SIĘ</button>
                        
                        <a href="#" style="color: var(--text-muted); text-decoration: none; font-size: 14px;" onclick="window.switchAuthView('login')">Masz już konto? Zaloguj się</a>
                    </div>
                </div>
            `;
        }
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
                    <p><strong>Cena:</strong> <span style="color: var(--accent); font-weight: bold;">${movie.price} PLN / 14 dni</span></p>
                    <p><strong>Gatunek:</strong> ${movie.genre} | <strong>Reżyser:</strong> ${movie.director || 'Nieznany'}</p>
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
                                <button class="btn btn-secondary" style="background: #00adb5; color: white; border: none; margin-right: 5px;" onclick="window.handleProlong(${r.loanNo})">
                                    ⏳ +1 Dzień (2 zł)
                                </button>
                                <button class="btn btn-secondary" style="background: #e50914; color: white; border: none;" onclick="window.handleReturn(${r.id})">
                                    ↩ Zwróć
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </table>
            `}
        `;
    } else if (currentView === 'popular') {
        mainContent = `
            <h1 style="margin-bottom: 10px;" Najpopularniejsze Filmy</h1>
            <p style="color: var(--text-muted); margin-bottom: 20px;">Ranking najchętniej wypożyczanych pozycji przez naszych użytkowników.</p>
            
            ${popularMovies.length === 0 ? '<p style="color: var(--text-muted)">Brak danych do wyświetlenia. Wypożycz coś pierwszy!</p>' : `
                <table style="width: 100%; border-collapse: collapse; background: var(--sidebar-bg); border-radius: 8px; overflow: hidden;">
                    <thead>
                        <tr style="background: #1f232b; text-align: left;">
                            <th style="padding: 15px;">Pozycja</th>
                            <th style="padding: 15px;">Tytuł filmu</th>
                            <th style="padding: 15px; text-align: center;">Łączna liczba wypożyczeń</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${popularMovies.map((m, index) => `
                            <tr style="border-bottom: 1px solid #252a34;">
                                <td style="padding: 15px; font-weight: bold; color: var(--accent);">#${index + 1}</td>
                                <td style="padding: 15px;"><strong>${m.title}</strong></td>
                                <td style="padding: 15px; text-align: center; color: #00adb5; font-weight: bold;">${m.total_loans}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `}
        `;
    }

    app.innerHTML = `
        ${Navbar(currentView, isSidebarCollapsed, myCart.length, currentUser)}
        <main class="main-content">${mainContent}</main>
    `;
};

//Logowanie wysyła zapytanie do bazy przez api.js
window.handleLogin = async () => {
    const emailValue = document.getElementById('loginEmail').value;
    const passValue = document.getElementById('loginPassword').value;
    
    if(emailValue.trim() !== '' && passValue.trim() !== '') {
        const result = await loginUser(emailValue, passValue); // Czekamy na odpowiedź z backendu
        if (result.success) {
            await fetchMovies(); // Odświeżamy filmy z bazy dla zalogowanego użytkownika
            displayedMovies = [...db];
            render();
        } else {
            alert(result.message); // Wyświetli komunikat np. "Błędny email lub hasło!"
        }
    } else {
        alert("Wprowadź adres e-mail i hasło!");
    }
};

// Funkcja do zmieniania widoku (logowanie <-> rejestracja)
window.switchAuthView = (view) => {
    authView = view;
    render(); // Przerysowujemy ekran
};

// Funkcja obsługująca kliknięcie "ZAREJESTRUJ SIĘ"
window.handleRegister = async () => {
    const firstname = document.getElementById('regFirstname').value.trim();
    const lastname = document.getElementById('regLastname').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;

    if (firstname && lastname && email && password) {
        // Wywołujemy funkcję z api.js, która uderza do server.js (/api/register)
        const result = await registerUser(firstname, lastname, email, password);
        
        if (result.success) {
            alert(result.message); // "Konto zostało utworzone!"
            authView = 'login';    // Przełączamy użytkownika na okno logowania
            render();
        } else {
            alert(result.message); // Np. "Ten email jest już zajęty!"
        }
    } else {
        alert("Wypełnij wszystkie pola formularza!");
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

window.navigate = async (view) => { 
    currentView = view; 
    displayedMovies = [...db]; 
    if(view === 'rentals' && currentUser){
        try {
            await fetchMyRentals(currentUser.member_no);
            checkExpirations(); 
        } catch (error) {
            console.error("Błąd podczas ładowania wypożyczeń z bazy:", error);
            alert("Nie udało się zaktualizować listy wypożyczeń, wyświetlam dane lokalne.");
        }
    }
    if(view === 'popular'){
        try {
            await fetchPopularMovies();
        } catch (error) {
            console.error("Błąd podczas ładowania raportu popularności:", error);
        }
    }
    render(); 
};

window.showDetails = (id) => { 
    currentMovieId = id; 
    currentView = 'details'; 
    render(); 
};

window.filterMovies = (query) => {
    const q = query.toLowerCase();
    // Szukamy tylko po tytule i gatunku, bo te pola na pewno istnieją w bazie SQL
    displayedMovies = db.filter(m => 
        m.title.toLowerCase().includes(q) || 
        m.genre.toLowerCase().includes(q)
    );
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

window.checkout = async () => {
    if (!currentUser) {
        alert("Musisz być zalogowany, aby wypożyczyć filmy!");
        window.navigate('catalog');
        return;
    }

    const total = myCart.reduce((sum, item) => sum + item.price, 0);
    if (currentUser.balance < total) {
        alert(`Brak środków na koncie! Brakuje Ci ${total - currentUser.balance} PLN.`);
        return;
    }

    const checkoutBtn = document.querySelector("button[onclick='window.checkout()']");
    if (checkoutBtn) {
        checkoutBtn.disabled = true;
        checkoutBtn.innerText = "PROCESOWANIE...";
    }

    const itemsToRent = [...myCart];

    for (const item of itemsToRent) {
        try {
            const response = await fetch('http://localhost:3000/api/rent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    member_no: currentUser.member_no,
                    movie_no: item.id
                })
            });

            const result = await response.json();

            if (!result.success) {
                alert(`Błąd podczas wypożyczania "${item.title}": ${result.message}`);
                if (checkoutBtn) {
                    checkoutBtn.disabled = false;
                    checkoutBtn.innerText = "ZAPŁAĆ I WYPOŻYCZ";
                }
                return;
            }
        } catch (err) {
            console.error("Błąd komunikacji z serwerem:", err);
            alert("Wystąpił błąd po stronie serwera. Spróbuj ponownie.");
            if (checkoutBtn) {
                checkoutBtn.disabled = false;
                checkoutBtn.innerText = "ZAPŁAĆ I WYPOŻYCZ";
            }
            return;
        }
    }

    // --- KLUCZOWE ZMIANY OD TEGO MIEJSCA ---
    
    // 1. Aktualizacja lokalnego salda
    currentUser.balance -= total; 
    
    // 2. Zapisanie zmian do localStorage i bazy pamięci podręcznej w api.js
    setCurrentUser(currentUser);
    
    // 3. Czyszczenie koszyka NATYCHMIAST (wtedy zniknie z ekranu)
    myCart.length = 0; 
    
    // 4. Wyświetlenie komunikatu
    alert("Zakup udany! Filmy zostały pomyślnie zarejestrowane w bazie danych.");
    
    // 5. Wymuszenie natychmiastowego przerysowania interfejsu (żeby Navbar pobrał nowe saldo i koszyk)
    render(); 
    
    // 6. Pobranie filmów i przejście do zakładki rentals
    await fetchMovies(); 
    await window.navigate('rentals'); 
};

window.handleReturn = async (movieId) => {
    if (!currentUser) return;

    if (confirm("Czy na pewno chcesz zwrócić ten film?")) {
        try {
            const result = await returnMovie(currentUser.member_no, movieId);
            
            if (result.success) {
                alert(result.message);
                
                // Odświeżamy dane: najpierw pobieramy listę filmów, potem nasze aktualne wypożyczenia
                await fetchMovies();
                await window.navigate('rentals');
            } else {
                alert("Błąd: " + result.message);
            }
        } catch (err) {
            console.error("Błąd podczas zwrotu:", err);
            alert("Wystąpił błąd serwera przy próbie zwrotu filmu.");
        }
    }
};

window.handleDeposit = async () => {
    if (!currentUser) return;

    const amountInput = prompt("Wpisz kwotę, jaką chcesz doładować konto (np. 50):", "50");
    
    // Walidacja: sprawdzamy czy użytkownik wpisał poprawną liczbę większą od zera
    if (amountInput === null) return; // Użytkownik kliknął "Anuluj"
    const amount = parseFloat(amountInput);
    
    if (isNaN(amount) || amount <= 0) {
        alert("Wpisz poprawną kwotę!");
        return;
    }

    try {
        const result = await depositMoney(currentUser.member_no, amount);
        
        if (result.success) {
            // Aktualizujemy saldo w naszym zalogowanym obiekcie na to, co zwróciła baza danych
            currentUser.balance = result.newBalance;
            setCurrentUser(currentUser);
            
            alert(`Konto zostało pomyślnie doładowane o ${amount} PLN!`);
            
            // Wymuszamy natychmiastowe przerysowanie Navbaru z nową kwotą
            render();
        } else {
            alert("Nie udało się doładować konta.");
        }
    } catch (err) {
        console.error("Błąd podczas doładowania konta:", err);
        alert("Wystąpił błąd serwera przy próbie doładowania konta.");
    }
};

window.handleProlong = async (loanNo) => {
    if (!currentUser) return;

    if (currentUser.balance < 2.00) {
        alert("Brak wystarczających środków na koncie! Przedłużenie kosztuje 2.00 PLN.");
        return;
    }

    try {
        const result = await prolongLoan(currentUser.member_no, loanNo);
        
        if (result.success) {
            // Aktualizujemy lokalny balans użytkownika
            currentUser.balance -= 2.00;
            setCurrentUser(currentUser);

            alert(result.message);

            // Odświeżamy listę wypożyczeń z bazy, aby pobrać nową datę ze zaktualizowanego "due_date"
            await fetchMyRentals(currentUser.member_no);
            render(); // Przerysowanie widoku
        } else {
            alert("Błąd: " + result.message);
        }
    } catch (err) {
        console.error("Błąd podczas przedłużania:", err);
        alert("Wystąpił błąd serwera przy próbie przedłużenia filmu.");
    }
};
initApp();
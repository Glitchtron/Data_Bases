const API_URL = 'http://localhost:3000/api';

export let db = []; 
export let myRentals = [];
export let myCart = [];
export let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
export let popularMovies = [];

// Funkcja pomocnicza, żeby app.js mógł bezpiecznie modyfikować i synchronizować zalogowanego użytkownika
export const setCurrentUser = (user) => {
    currentUser = user;
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
        localStorage.removeItem('currentUser');
    }
};

const moviePosters = {
    "Incepcja": "https://upload.wikimedia.org/wikipedia/en/2/2e/Inception_%282010%29_theatrical_poster.jpg",
    "Blade Runner 2049": "https://upload.wikimedia.org/wikipedia/en/9/9b/Blade_Runner_2049_poster.png",
    "Interstellar": "https://upload.wikimedia.org/wikipedia/en/b/bc/Interstellar_film_poster.jpg",
    "Gladiator": "https://upload.wikimedia.org/wikipedia/en/f/fb/Gladiator_%282000_film_poster%29.png",
    "Pulp Fiction": "https://upload.wikimedia.org/wikipedia/en/3/3b/Pulp_Fiction_%281994%29_poster.jpg"
};

const defaultPoster = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/600px-No-Image-Placeholder.svg.png";

// Ładowanie filmów z backendu
export const fetchMovies = async () => {
    try {
        const response = await fetch(`${API_URL}/movies`);
        const rawMovies = await response.json();
        db = rawMovies.map(movie => {
            const trimmedTitle = (movie.title || "").trim();
            return {
                ...movie,
                poster: moviePosters[trimmedTitle] || defaultPoster
            };
        });
        return db;
    } catch (err) {
        console.error("Nie udało się pobrać filmów:", err);
        return [];
    }
};

// Logowanie z bazą danych
export const loginUser = async (email, password) => {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    if (data.success) {
        // Używamy nowej funkcji, żeby poprawnie ustawić stan w pamięci modułu
        setCurrentUser(data.user); 
        return { success: true };
    } else {
        return { success: false, message: data.message };
    }
};

// Rejestracja nowego użytkownika w bazie
export const registerUser = async (firstname, lastname, email, password) => {
    const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstname, lastname, email, password })
    });
    return await response.json();
};

export const logoutUser = () => {
    setCurrentUser(null);
};

// Pobieranie aktywnych wypożyczeń z bazy
export const fetchMyRentals = async (memberNo) => {
    try {
        const response = await fetch(`${API_URL}/rentals/${memberNo}`);
        const data = await response.json();
        myRentals.length = 0;
        myRentals.push(...data);
        return myRentals;
    } catch (err) {
        console.error("Nie udało się pobrać wypożyczeń:", err);
        return [];
    }
};

export const returnMovie = async (memberNo, movieNo) => {
    const response = await fetch(`${API_URL}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_no: memberNo, movie_no: movieNo })
    });
    return await response.json();
};

export const depositMoney = async (memberNo, amount) => {
    const response = await fetch(`${API_URL}/user/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_no: memberNo, amount: parseFloat(amount) })
    });
    return await response.json();
};



// Pobieranie najpopularniejszych filmów do raportu
export const fetchPopularMovies = async () => {
    try {
        const response = await fetch(`${API_URL}/reports/popular`);
        const data = await response.json();
        popularMovies.length = 0;
        popularMovies.push(...data);
        return popularMovies;
    } catch (err) {
        console.error("Nie udało się pobrać raportu popularności:", err);
        return [];
    }
};
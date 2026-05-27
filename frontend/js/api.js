// tu wiadomo b edzie nasza baza ale dałam random rzeczy do testów 
export const db = [
    { id: 1, title: "Incepcja", genre: "Sci-Fi", director: "Christopher Nolan", available: true, copies: 3, price: 15, poster: "https://upload.wikimedia.org/wikipedia/en/2/2e/Inception_%282010%29_theatrical_poster.jpg", description: "Złodziej snów wykradający sekrety.", trailer: "https://www.youtube.com/watch?v=8hP9D6kZseM" },
    { id: 2, title: "Blade Runner 2049", genre: "Sci-Fi", director: "Denis Villeneuve", available: false, copies: 0, price: 18, poster: "https://upload.wikimedia.org/wikipedia/en/9/9b/Blade_Runner_2049_poster.png", description: "Oficer K odkrywa tajemnicę.", trailer: "https://www.youtube.com/watch?v=gCcx85zbxz4" },
    { id: 3, title: "Interstellar", genre: "Sci-Fi", director: "Christopher Nolan", available: true, copies: 2, price: 12, poster: "https://upload.wikimedia.org/wikipedia/en/b/bc/Interstellar_film_poster.jpg", description: "Podróż w celu ratowania ludzkości.", trailer: "https://www.youtube.com/watch?v=zSWdZVtXT7E" }
];

export let myRentals = [];
export let myCart = [];

export let userAccount = {
    balance: 100 
};

export let currentUser = null;

export const loginUser = (username) => {
    currentUser = { name: username };
};

export const logoutUser = () => {
    currentUser = null;
};
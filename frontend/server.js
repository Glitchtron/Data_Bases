import express from 'express';
import sql from 'mssql';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors()); 
app.use(express.json());

const dbConfig = {
    user: 'MainAdmin',
    password: 'Tygrys29',
    server: 'aghdatabase.database.windows.net',
    database: 'MiniProjectDB',
    port: 1433,
    options: {
        encrypt: true, 
        trustServerCertificate: false 
    }
};

//Połączenie z bazą danych
sql.connect(dbConfig).then(() => console.log("Połączono z bazą SQL Server")).catch(err => console.log("Błąd bazy:", err));

//LOGOWANIE
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await sql.query`SELECT member_no, firstname, lastname, email,balance FROM member WHERE email = ${email} AND password = ${password}`;
        if (result.recordset.length > 0) {
            res.json({ success: true, user: result.recordset[0] });
        } else {
            res.status(401).json({ success: false, message: "Błędny email lub hasło!" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//REJESTRACJA (Zapisywanie nowego użytkownika do bazy)
app.post('/api/register', async (req, res) => {
    const { firstname, lastname, email, password } = req.body;
    try {
        // Sprawdź czy email istnieje
        const checkUser = await sql.query`SELECT 1 FROM member WHERE email = ${email}`;
        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ success: false, message: "Ten email jest już zajęty!" });
        }

        // Dodaj do bazy
        await sql.query`INSERT INTO member (firstname, lastname, email, password) VALUES (${firstname}, ${lastname}, ${email}, ${password})`;
        res.json({ success: true, message: "Konto zostało utworzone!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//POBIERANIE FILMON Z WIDOKU (vw_available_movies)
app.get('/api/movies', async (req, res) => {
    try {
        const result = await sql.query`SELECT * FROM vw_available_movies`;
        // Mapowanie pól z bazy SQL na strukturę, którą już masz we frontendzie
        const movies = result.recordset.map(m => ({
            id: m.movie_no,
            title: m.title,
            genre: m.genre,
            description: m.synopsis || "Brak opisu",
            available: m.available_copies > 0,
            copies: m.available_copies,
            price: m.price,
            poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500" // placeholder plakatu
        }));
        res.json(movies);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//WYPOŻYCZENIE FILMU
app.post('/api/rent', async (req, res) => {
    const { member_no, movie_no } = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('member_no', sql.Int, member_no)
            .input('movie_no', sql.Int, movie_no)
            .execute('p_rent_movie');
        
        res.json({ success: true, message: "Wypożyczono pomyślnie!" });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

//POBIERANIE AKTYWNYCH WYPOŻYCZEŃ DLA DANEGO UŻYTKOWNIKA
app.get('/api/rentals/:member_no', async (req, res) => {
    const { member_no } = req.params;
    try {
        const result = await sql.query`
            SELECT l.loan_no, m.movie_no as id, m.title, l.rent_date, l.due_date 
            FROM loan l
            JOIN copy c ON l.copy_no = c.copy_no
            JOIN movie m ON c.movie_no = m.movie_no
            WHERE l.member_no = ${member_no}
        `;
        
        // Mapowanie na format czytelny dla frontendu
        const rentals = result.recordset.map(r => ({
            id: r.id,
            title: r.title,
            trailer: "https://www.youtube.com", // Zaślepka linku
            dueDate: new Date(r.due_date).toLocaleDateString('pl-PL'),
            dueDateObj: new Date(r.due_date)
        }));
        
        res.json(rentals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//ZWROT FILMU
app.post('/api/return', async (req, res) => {
    const { member_no, movie_no } = req.body;
    try {
        
        // 1. Znajdujemy kopię powiązaną z tym wypożyczeniem
        const loanCheck = await sql.query`
            SELECT TOP 1 copy_no FROM loan 
            WHERE member_no = ${member_no} AND copy_no IN (SELECT copy_no FROM copy WHERE movie_no = ${movie_no})
        `;

        if (loanCheck.recordset.length === 0) {
            return res.status(400).json({ success: false, message: "Nie znaleziono takiego aktywnego wypożyczenia." });
        }

        const copyNo = loanCheck.recordset[0].copy_no;

        // 2. Usuwamy wypożyczenie (lub archiwizujemy)
        await sql.query`DELETE FROM loan WHERE member_no = ${member_no} AND copy_no = ${copyNo}`;

        await sql.query`UPDATE copy SET isAvailable = 1 WHERE copy_no = ${copyNo}`;

        res.json({ success: true, message: "Film został pomyślnie zwrócony!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// OPERACJA RAPORTUJĄCA - Najpopularniejsze filmy w systemie
app.get('/api/reports/popular', async (req, res) => {
    try {
        const result = await sql.query`SELECT * FROM vw_popular_movies ORDER BY total_loans DESC`;
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//OPERACJA DOŁADOWANIA KONTA
app.post('/api/user/deposit', async (req, res) => {
    const { member_no, amount } = req.body;
    try {
        const safeAmount = parseFloat(amount);

        if (isNaN(safeAmount)) {
            return res.status(400).json({ success: false, message: "Nieprawidłowa kwota!" });
        }

        await sql.query`UPDATE member SET balance = balance + ${safeAmount} WHERE member_no = ${member_no}`;
        const result = await sql.query`SELECT balance FROM member WHERE member_no = ${member_no}`;
        res.json({ success: true, newBalance: result.recordset[0].balance });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Udostępnianie plików frontendowych
app.use(express.static(__dirname));

// Główna strona
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serwer działa na porcie ${PORT} pod linkiem http://localhost:${PORT}`));
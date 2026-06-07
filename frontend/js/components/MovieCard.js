export const MovieCard = (movie) => `
    <article class="card">
        <img src="${movie.poster}" alt="Plakat">
        <h3>${movie.title}</h3>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 5px;">
            <p style="color: var(--text-muted); font-size: 14px;">${movie.genre}</p>
            <span style="background: rgba(0, 229, 255, 0.1); color: var(--accent); padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 14px;">
                ${movie.price} PLN
            </span>
        </div>
        <div class="status ${movie.available ? 'available' : 'unavailable'}">
            STATUS: ${movie.available ? `DOSTĘPNY (${movie.copies} szt.)` : 'BRAK KOPII (REZERWACJA)'}
        </div>
        <div class="card-actions">
            <button class="btn btn-primary" onclick="window.addToCart(${movie.id})">
                ${movie.available ? 'DO KOSZYKA' : 'REZERWUJ (PRZEDPŁATA)'}
            </button>
            <button class="btn btn-secondary" onclick="window.showDetails(${movie.id})">OPIS</button>
        </div>
    </article>
`;
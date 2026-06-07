export const SearchBar = (currentValue = '') => `
    <input type="text" class="search-bar" id="searchInput" placeholder="Szukaj tytułu, reżysera..." value="${currentValue}" oninput="window.filterMovies(this.value)">
`;
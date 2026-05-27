export const SearchBar = () => `
    <input type="text" class="search-bar" id="searchInput" placeholder="Szukaj tytułu, reżysera..." onkeyup="window.filterMovies(this.value)">
`;
export const Navbar = (currentView, isCollapsed, account, cartCount, user) => `
    <aside class="sidebar ${isCollapsed ? 'collapsed' : ''}">
        <div class="sidebar-header">
            <button class="toggle-btn" onclick="window.toggleSidebar()">☰</button>
        </div>
        <div class="logo">
            <img src="assets/logo.png" alt="Logo">
        </div>
        <nav>
            <button class="nav-btn ${currentView === 'catalog' ? 'active' : ''}" onclick="window.navigate('catalog')">
                <span class="nav-text">Katalog</span>
            </button>
            <button class="nav-btn ${currentView === 'cart' ? 'active' : ''}" onclick="window.navigate('cart')">
                <span class="nav-text">Koszyk (${cartCount})</span>
            </button>
            <button class="nav-btn ${currentView === 'rentals' ? 'active' : ''}" onclick="window.navigate('rentals')">
                <span class="nav-text">Moje Wypożyczenia</span>
            </button>
        </nav>
        
        <div style="margin-top: auto; padding: 15px; border-top: 1px solid #252a34; display: ${isCollapsed ? 'none' : 'block'};">
            <div style="margin-bottom: 20px;">
                <p style="color: var(--text-muted); font-size: 12px; margin-bottom: 5px;">ZALOGOWANY JAKO</p>
                <h4 style="color: white; margin-bottom: 5px;">👤 ${user.name}</h4>
                <button class="btn btn-secondary" style="width: 100%; font-size: 12px; padding: 6px; margin-top: 5px;" onclick="window.handleLogout()">Wyloguj się</button>
            </div>
            
            <p style="color: var(--text-muted); font-size: 12px; margin-bottom: 5px;">SALDO KONTA</p>
            <h3 style="color: var(--accent); margin-bottom: 5px;">${account.balance} PLN</h3>
            
            <button class="btn btn-secondary" style="width: 100%; margin-top: 15px; font-size: 12px; padding: 8px; border: 1px dashed var(--accent);" onclick="window.addDay()">
                 +1 Dzień (Dev)
            </button>
        </div>
    </aside>
`;
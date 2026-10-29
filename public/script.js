const API_URL = 'http://localhost:3000';

// Elementos da interface
const authForms = document.getElementById('auth-forms');
const userInfo = document.getElementById('user-info');
const loggedUserName = document.getElementById('logged-user-name');
const btnLogout = document.getElementById('btn-logout');
const gamesContainer = document.getElementById('games-container');
const btnReload = document.getElementById('btn-reload');

// 1. Inicialização
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    fetchGames();
});

// 2. Gerenciamento de Sessão com JWT
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (token && user) {
        authForms.classList.add('hidden');
        userInfo.classList.remove('hidden');
        loggedUserName.textContent = user.name || 'Usuário';
    } else {
        authForms.classList.remove('hidden');
        userInfo.classList.add('hidden');
    }
}

btnLogout.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    checkAuth();
    alert('Você saiu da sua conta.');
});

// 3. Login
document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch(`${API_URL}/usuario/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            return alert(data.error || 'Erro no login.');
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({ id: data.userId, name: data.name || email }));
        checkAuth();
        alert('Logado com sucesso!');
    } catch (err) {
        alert('Erro de conexão com o servidor.');
    }
});

// 4. Cadastro de Usuário
document.getElementById('form-register').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    try {
        const res = await fetch(`${API_URL}/usuario/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            const msg = data.errors ? data.errors.map(e => e.mensagem).join('\n') : data.error;
            return alert(msg || 'Erro no cadastro.');
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({ id: data.userId, name }));
        checkAuth();
        alert('Conta criada com sucesso!');
    } catch (err) {
        alert('Erro de conexão com o servidor.');
    }
});

// 5. Listagem de Jogos (GET Público)
async function fetchGames() {
    gamesContainer.innerHTML = '<p class="placeholder-text">Atualizando lista...</p>';

    try {
        const res = await fetch(`${API_URL}/games`);
        const games = await res.json();

        if (!res.ok) {
            return gamesContainer.innerHTML = '<p class="placeholder-text">Erro ao buscar jogos.</p>';
        }

        if (games.length === 0) {
            return gamesContainer.innerHTML = '<p class="placeholder-text">Nenhum jogo cadastrado ainda.</p>';
        }

        const currentUserId = JSON.parse(localStorage.getItem('user'))?.id;

        gamesContainer.innerHTML = games.map(game => `
      <div class="game-card">
        <div>
          <h4>${game.title}</h4>
          <div class="game-info">
            <p><strong>Gênero:</strong> ${game.genre}</p>
            <p><strong>Plataforma:</strong> ${game.platform}</p>
            <p><strong>Status:</strong> ${game.status}</p>
            <p><strong>Nota:</strong> ${game.rating !== null ? game.rating : 'N/A'}</p>
            <p><strong>Adicionado por:</strong> ${game.user ? game.user.name : 'Desconhecido'}</p>
          </div>
        </div>
        ${game.userId === currentUserId ? `
          <button class="btn-danger" onclick="deleteGame(${game.id})">Remover</button>
        ` : ''}
      </div>
    `).join('');
    } catch (err) {
        gamesContainer.innerHTML = '<p class="placeholder-text">Falha ao carregar jogos da API.</p>';
    }
}

btnReload.addEventListener('click', fetchGames);

// 6. Criar Jogo (POST Protegido com Bearer Token)
document.getElementById('form-game').addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
        return alert('Faça login primeiro para cadastrar um jogo!');
    }

    const payload = {
        title: document.getElementById('game-title').value,
        genre: document.getElementById('game-genre').value,
        platform: document.getElementById('game-platform').value,
        rating: document.getElementById('game-rating').value ? parseFloat(document.getElementById('game-rating').value) : null,
        status: document.getElementById('game-status').value
    };

    try {
        const res = await fetch(`${API_URL}/games`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
            const msg = data.errors ? data.errors.map(e => e.mensagem).join('\n') : data.error;
            return alert(msg || 'Erro ao cadastrar jogo.');
        }

        document.getElementById('form-game').reset();
        fetchGames();
        alert('Jogo cadastrado com sucesso!');
    } catch (err) {
        alert('Erro de conexão ao criar jogo.');
    }
});

// 7. Deletar Jogo (DELETE Protegido)
async function deleteGame(id) {
    const token = localStorage.getItem('token');
    if (!token) {
        return alert('Acesso não autorizado.');
    }

    if (!confirm('Tem certeza que deseja remover este jogo?')) {
        return;
    }

    try {
        const res = await fetch(`${API_URL}/games/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await res.json();

        if (!res.ok) {
            return alert(data.error || 'Erro ao deletar jogo.');
        }

        fetchGames();
        alert('Jogo removido!');
    } catch (err) {
        alert('Erro de conexão ao deletar jogo.');
    }
}
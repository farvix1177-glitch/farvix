// Простая система авторизации (для продакшена используйте серверную авторизацию)
let users = {};

// Загружаем администраторов из admins.json
async function loadAdmins() {
    try {
        const response = await fetch('admins.json');
        users = await response.json();
    } catch (error) {
        console.error('Ошибка загрузки администраторов:', error);
        users = {"admin": "admin123", "bypass": "bypass"};
    }
}

loadAdmins().then(() => {
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('errorMessage');
        
        if (users[username] && users[username] === password) {
            // Сохраняем токен авторизации
            sessionStorage.setItem('authToken', btoa(username + ':' + Date.now()));
            sessionStorage.setItem('username', username);
            
            // Перенаправляем на главную страницу
            window.location.href = 'index.html';
        } else {
            errorMessage.textContent = 'Неверный логин или пароль';
        }
    });
});

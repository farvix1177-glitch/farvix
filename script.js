document.addEventListener('DOMContentLoaded', () => {
    // Проверка авторизации
    const authToken = sessionStorage.getItem('authToken');
    if (!authToken) {
        window.location.href = 'auth.html';
        return;
    }

    const username = sessionStorage.getItem('username');
    document.getElementById('currentUser').textContent = username;

    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section');
    const pageTitle = document.getElementById('pageTitle');
    
    let staffData = [];
    let rolesData = [];

    // Загрузка ролей
    async function loadRoles() {
        try {
            const response = await fetch('roles.json');
            rolesData = await response.json();
            window.rolesData = rolesData;
        } catch (error) {
            console.error('Ошибка загрузки ролей:', error);
        }
    }

    // Обработчик навигации
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            const section = item.dataset.section;
            
            // Скрываем все секции
            sections.forEach(s => s.classList.remove('active'));
            
            // Показываем нужную секцию
            switch(section) {
                case 'home':
                    document.getElementById('homeSection').classList.add('active');
                    pageTitle.textContent = 'Главная';
                    break;
                case 'staff':
                    document.getElementById('staffSection').classList.add('active');
                    pageTitle.textContent = 'Список';
                    renderStaffTable(staffData);
                    break;
                case 'warnings':
                    document.getElementById('warningsSection').classList.add('active');
                    pageTitle.textContent = 'Предупреждения';
                    renderWarningsTable(staffData);
                    break;
                case 'vacation':
                    document.getElementById('vacationSection').classList.add('active');
                    pageTitle.textContent = 'Отпуски';
                    renderVacationTable(staffData);
                    break;
                case 'admin':
                    document.getElementById('adminSection').classList.add('active');
                    pageTitle.textContent = 'Админ-панель';
                    renderAdminTable();
                    break;
            }
        });
    });

    // Загрузка данных из сервера
    async function loadStaff() {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/staff');
            staffData = await response.json();
            window.staffData = staffData;
        } catch (error) {
            console.error('Ошибка загрузки данных с сервера:', error);
            // Fallback на локальный файл если сервер не запущен
            try {
                const response = await fetch('data.json');
                staffData = await response.json();
                window.staffData = staffData;
            } catch (err) {
                console.error('Ошибка загрузки локального файла:', err);
            }
        }
    }

    // Отрисовка таблицы модеров
    function renderStaffTable(data) {
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = '';

        // Сортируем по приоритету ролей
        const sortedData = [...data].sort((a, b) => {
            return getRolePriority(a.role) - getRolePriority(b.role);
        });

        sortedData.forEach((member, index) => {
            const originalIndex = data.indexOf(member);
            const roleClass = getRoleClass(member.role);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${member.nickname}</td>
                <td contenteditable="true" class="editable ${roleClass}" data-index="${originalIndex}" data-field="role">${member.role}</td>
                <td contenteditable="true" class="editable" data-index="${originalIndex}" data-field="discord">${member.discord}</td>
                <td><button class="edit-btn" onclick="deleteMember(${originalIndex})">Удалить</button></td>
            `;
            tableBody.appendChild(row);
        });

        // Добавляем обработчики для редактирования
        document.querySelectorAll('.editable').forEach(cell => {
            cell.addEventListener('blur', function() {
                const index = this.dataset.index;
                const field = this.dataset.field;
                staffData[index][field] = this.textContent;
                saveData();
            });
        });
    }

    // Отрисовка таблицы предупреждений
    function renderWarningsTable(data) {
        const warningsBody = document.getElementById('warningsBody');
        warningsBody.innerHTML = '';

        // Сортируем по приоритету ролей
        const sortedData = [...data].sort((a, b) => {
            return getRolePriority(a.role) - getRolePriority(b.role);
        });

        sortedData.forEach((member, index) => {
            const originalIndex = data.indexOf(member);
            const warns = member.warns || 0;
            const verbal = member.verbalWarnings || 0;
            const roleClass = getRoleClass(member.role);
            
            const warnClass = warns === 0 ? 'status-green' : warns === 1 ? 'status-orange' : warns === 2 ? 'status-red' : 'status-red';
            const verbalClass = verbal === 0 ? 'status-green' : verbal === 1 ? 'status-orange' : 'status-red';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${member.nickname}</td>
                <td class="${roleClass}">${member.role}</td>
                <td class="${warnClass}">${warns}</td>
                <td class="${verbalClass}">${verbal}</td>
                <td>
                    <button class="edit-btn" onclick="editWarnings(${originalIndex}, 'warns', 1)">+В</button>
                    <button class="edit-btn" onclick="editWarnings(${originalIndex}, 'warns', -1)">-В</button>
                    <button class="edit-btn" onclick="editWarnings(${originalIndex}, 'verbalWarnings', 1)">+У</button>
                    <button class="edit-btn" onclick="editWarnings(${originalIndex}, 'verbalWarnings', -1)">-У</button>
                </td>
            `;
            warningsBody.appendChild(row);
        });
    }

    // Отрисовка таблицы отпусков
    function renderVacationTable(data) {
        const vacationBody = document.getElementById('vacationBody');
        vacationBody.innerHTML = '';

        // Сортируем по приоритету ролей
        const sortedData = [...data].sort((a, b) => {
            return getRolePriority(a.role) - getRolePriority(b.role);
        });

        sortedData.forEach((member, index) => {
            const originalIndex = data.indexOf(member);
            const roleClass = getRoleClass(member.role);
            const isOnVacation = member.vacation !== 'Нет';
            const vacationStatus = isOnVacation ? 'status-red' : 'status-green';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${member.nickname}</td>
                <td class="${roleClass}">${member.role}</td>
                <td class="${vacationStatus}">${member.vacation}</td>
                <td>
                    <select class="vacation-select" onchange="changeVacationStatus(${originalIndex}, this.value)">
                        <option value="Нет" ${!isOnVacation ? 'selected' : ''}>Работает</option>
                        <option value="custom" ${isOnVacation ? 'selected' : ''}>В отпуске</option>
                    </select>
                    ${isOnVacation ? `<button class="edit-btn" onclick="editVacationDate(${originalIndex})">Изменить дату</button>` : ''}
                </td>
            `;
            vacationBody.appendChild(row);
        });
    }

    // Функция для определения приоритета роли (чем меньше число, тем выше роль)
    function getRolePriority(role) {
        const roleData = window.rolesData?.find(r => r.name === role);
        return roleData ? roleData.priority : 999;
    }

    // Функция для определения класса роли
    function getRoleClass(role) {
        const roleData = window.rolesData?.find(r => r.name === role);
        return roleData ? roleData.class : '';
    }

    // Поиск в списке модеров
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = staffData.filter(member => 
            member.nickname.toLowerCase().includes(term) || 
            member.role.toLowerCase().includes(term)
        );
        renderStaffTable(filtered);
    });

    // Поиск в предупреждениях
    document.getElementById('searchWarnings').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = staffData.filter(member => 
            member.nickname.toLowerCase().includes(term)
        );
        renderWarningsTable(filtered);
    });

    // Поиск в отпусках
    document.getElementById('searchVacation').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = staffData.filter(member => 
            member.nickname.toLowerCase().includes(term) && member.vacation !== 'Нет'
        );
        renderVacationTable(filtered);
    });

    // Отрисовка таблицы администраторов
    async function renderAdminTable() {
        const adminTableBody = document.getElementById('adminTableBody');
        adminTableBody.innerHTML = '';

        try {
            // Пытаемся загрузить с сервера
            const response = await fetch('http://127.0.0.1:5000/api/admins');
            const admins = await response.json();
            const adminPermissions = JSON.parse(localStorage.getItem('adminPermissions') || '{}');

            Object.keys(admins).forEach(login => {
                const permissions = adminPermissions[login] || ['Полный доступ'];
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${login}</td>
                    <td>${Array.isArray(permissions) ? permissions.join(', ') : permissions}</td>
                    <td>
                        <button class="edit-btn" onclick="editAdminPermissions('${login}')">Изменить права</button>
                        <button class="edit-btn" onclick="deleteAdminFromServer('${login}')">Удалить</button>
                    </td>
                `;
                adminTableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Ошибка загрузки администраторов с сервера:', error);
            // Fallback на локальный файл
            try {
                const response = await fetch('admins.json');
                const admins = await response.json();
                const adminPermissions = JSON.parse(localStorage.getItem('adminPermissions') || '{}');

                Object.keys(admins).forEach(login => {
                    const permissions = adminPermissions[login] || ['Полный доступ'];
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${login}</td>
                        <td>${Array.isArray(permissions) ? permissions.join(', ') : permissions}</td>
                        <td>
                            <button class="edit-btn" onclick="editAdminPermissions('${login}')">Изменить права</button>
                            <button class="edit-btn" onclick="deleteAdmin('${login}')">Удалить</button>
                        </td>
                    `;
                    adminTableBody.appendChild(row);
                });
            } catch (err) {
                console.error('Ошибка загрузки локального файла администраторов:', err);
            }
        }
    }

    loadRoles().then(() => loadStaff());
});


// Функции для модального окна
function openModal(type) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modal.style.display = 'block';
    
    switch(type) {
        case 'addUser':
            modalTitle.textContent = 'Добавить модератора';
            
            // Генерируем опции из roles.json
            let roleOptions = '<option value="">Выберите должность</option>';
            if (window.rolesData) {
                window.rolesData.forEach(role => {
                    roleOptions += `<option value="${role.name}">${role.name}</option>`;
                });
            }
            
            modalBody.innerHTML = `
                <input type="text" id="newNickname" placeholder="Никнейм">
                <select id="newRole">
                    ${roleOptions}
                </select>
                <input type="text" id="newDiscord" placeholder="Discord">
                <button onclick="addUser()">Добавить</button>
            `;
            break;
        case 'addAdmin':
            modalTitle.textContent = 'Добавить администратора';
            modalBody.innerHTML = `
                <input type="text" id="adminLogin" placeholder="Логин">
                <input type="password" id="adminPassword" placeholder="Пароль">
                <button onclick="addAdmin()">Добавить</button>
            `;
            break;
        case 'giveWarn':
            modalTitle.textContent = 'Выдать варн';
            modalBody.innerHTML = `
                <input type="text" id="warnNickname" placeholder="Никнейм">
                <button onclick="giveWarn()">Выдать</button>
            `;
            break;
        case 'giveVerbal':
            modalTitle.textContent = 'Выдать устное предупреждение';
            modalBody.innerHTML = `
                <input type="text" id="verbalNickname" placeholder="Никнейм">
                <button onclick="giveVerbal()">Выдать</button>
            `;
            break;
        case 'giveVacation':
            modalTitle.textContent = 'Выдать отпуск';
            modalBody.innerHTML = `
                <input type="text" id="vacationNickname" placeholder="Никнейм">
                <input type="text" id="vacationDate" placeholder="До какой даты (например: до 15.05.2026)">
                <button onclick="giveVacation()">Выдать</button>
            `;
            break;
    }
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

async function addUser() {
    const nickname = document.getElementById('newNickname').value;
    const role = document.getElementById('newRole').value;
    const discord = document.getElementById('newDiscord').value;
    
    if (nickname && role && discord) {
        const newMember = {
            nickname: nickname,
            role: role,
            discord: discord,
            status: 'В работе',
            vacation: 'Нет',
            warns: 0,
            verbalWarnings: 0
        };
        
        try {
            const response = await fetch('http://127.0.0.1:5000/api/staff', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newMember)
            });
            
            const result = await response.json();
            if (result.success) {
                showCustomAlert('Модератор добавлен!');
                closeModal();
                setTimeout(() => location.reload(), 1000);
            } else {
                showCustomAlert('Ошибка при добавлении модератора');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showCustomAlert('Ошибка соединения с сервером. Убедитесь, что сервер запущен.');
        }
    } else {
        showCustomAlert('Заполните все поля!');
    }
}

async function saveData() {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/staff/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(window.staffData)
        });
        
        const result = await response.json();
        if (!result.success) {
            console.error('Ошибка сохранения данных');
        }
    } catch (error) {
        console.error('Ошибка соединения с сервером:', error);
    }
}

let confirmCallback = null;

function showConfirm(message, callback) {
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmModal').style.display = 'block';
    confirmCallback = callback;
}

function confirmAction(result) {
    document.getElementById('confirmModal').style.display = 'none';
    if (confirmCallback) {
        confirmCallback(result);
        confirmCallback = null;
    }
}

function showCustomAlert(message) {
    const modal = document.getElementById('confirmModal');
    document.getElementById('confirmTitle').textContent = 'Уведомление';
    document.getElementById('confirmMessage').textContent = message;
    modal.style.display = 'block';
    
    // Скрываем кнопки и добавляем одну кнопку OK
    const buttonsDiv = modal.querySelector('.confirm-buttons');
    buttonsDiv.innerHTML = '<button class="confirm-btn" onclick="document.getElementById(\'confirmModal\').style.display=\'none\'">OK</button>';
}

function deleteMember(index) {
    showConfirm('Удалить этого пользователя?', async (result) => {
        if (result) {
            try {
                const response = await fetch(`http://127.0.0.1:5000/api/staff/${index}`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                if (data.success) {
                    showCustomAlert('Пользователь удален!');
                    setTimeout(() => location.reload(), 1000);
                } else {
                    showCustomAlert('Ошибка при удалении пользователя');
                }
            } catch (error) {
                console.error('Ошибка:', error);
                showCustomAlert('Ошибка соединения с сервером. Убедитесь, что сервер запущен.');
            }
        }
    });
}

function editWarnings(index, field, change) {
    window.staffData[index][field] = Math.max(0, (window.staffData[index][field] || 0) + change);
    saveData();
    location.reload();
}

function toggleVacation(index) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modal.style.display = 'block';
    modalTitle.textContent = 'Изменить отпуск';
    modalBody.innerHTML = `
        <input type="text" id="vacationDate" placeholder='Введите дату (например: до 15.05.2026) или "Нет"' value="${window.staffData[index].vacation}">
        <button onclick="saveVacation(${index})">Сохранить</button>
    `;
}

function changeVacationStatus(index, value) {
    if (value === 'Нет') {
        window.staffData[index].vacation = 'Нет';
        saveData();
        location.reload();
    } else {
        // Открываем модальное окно для ввода даты
        editVacationDate(index);
    }
}

function editVacationDate(index) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modal.style.display = 'block';
    modalTitle.textContent = 'Изменить дату отпуска';
    modalBody.innerHTML = `
        <input type="text" id="vacationDate" placeholder='Введите дату (например: до 15.05.2026)' value="${window.staffData[index].vacation !== 'Нет' ? window.staffData[index].vacation : ''}">
        <button onclick="saveVacation(${index})">Сохранить</button>
    `;
}

function saveVacation(index) {
    const date = document.getElementById('vacationDate').value;
    if (date) {
        window.staffData[index].vacation = date;
        saveData();
        closeModal();
        location.reload();
    }
}

async function addAdmin() {
    const login = document.getElementById('adminLogin').value;
    const password = document.getElementById('adminPassword').value;
    
    if (login && password) {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/admins', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ login, password })
            });
            
            const result = await response.json();
            if (result.success) {
                showCustomAlert('Администратор добавлен!');
                closeModal();
                setTimeout(() => location.reload(), 1000);
            } else {
                showCustomAlert('Ошибка при добавлении администратора');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            // Fallback на инструкцию если сервер не запущен
            const modal = document.getElementById('modal');
            const modalTitle = document.getElementById('modalTitle');
            const modalBody = document.getElementById('modalBody');
            
            modal.style.display = 'block';
            modalTitle.textContent = 'Инструкция по добавлению';
            modalBody.innerHTML = `
                <p style="color: #aaa; margin-bottom: 15px;">Для добавления администратора:</p>
                <ol style="color: #aaa; text-align: left; line-height: 1.8;">
                    <li>Откройте файл <code style="background: #0a0a0a; padding: 2px 6px; border-radius: 4px; color: #0f0;">admins.json</code></li>
                    <li>Добавьте строку (не забудьте запятую):</li>
                </ol>
                <textarea readonly style="width: 100%; padding: 10px; background: #0a0a0a; color: #0f0; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; font-family: monospace; margin: 10px 0;">"${login}": "${password}",</textarea>
                <p style="color: #aaa; font-size: 14px;">Сохраните файл и обновите страницу</p>
                <button onclick="closeModal()">Понятно</button>
            `;
        }
    } else {
        showCustomAlert('Заполните все поля!');
    }
}

function giveWarn() {
    alert('Функция выдачи варна (требуется серверная часть)');
    closeModal();
}

function giveVerbal() {
    alert('Функция выдачи устного предупреждения (требуется серверная часть)');
    closeModal();
}

function giveVacation() {
    alert('Функция выдачи отпуска (требуется серверная часть)');
    closeModal();
}

// Закрытие модального окна при клике вне его
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target == modal) {
        closeModal();
    }
}


// Функции для управления администраторами
function editAdminPermissions(login) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    const adminPermissions = JSON.parse(localStorage.getItem('adminPermissions') || '{}');
    const currentPermissions = adminPermissions[login] || [];
    
    modal.style.display = 'block';
    modalTitle.textContent = 'Изменить права: ' + login;
    modalBody.innerHTML = `
        <div style="color: #aaa; margin-bottom: 15px;">
            <label><input type="checkbox" id="perm_users" ${currentPermissions.includes('Управление пользователями') ? 'checked' : ''}> Управление пользователями</label><br>
            <label><input type="checkbox" id="perm_warnings" ${currentPermissions.includes('Управление предупреждениями') ? 'checked' : ''}> Управление предупреждениями</label><br>
            <label><input type="checkbox" id="perm_vacation" ${currentPermissions.includes('Управление отпусками') ? 'checked' : ''}> Управление отпусками</label><br>
            <label><input type="checkbox" id="perm_admins" ${currentPermissions.includes('Управление администраторами') ? 'checked' : ''}> Управление администраторами</label><br>
            <label><input type="checkbox" id="perm_full" ${currentPermissions.includes('Полный доступ') ? 'checked' : ''}> Полный доступ</label>
        </div>
        <button onclick="saveAdminPermissions('${login}')">Сохранить</button>
    `;
}

function saveAdminPermissions(login) {
    const permissions = [];
    
    if (document.getElementById('perm_users').checked) permissions.push('Управление пользователями');
    if (document.getElementById('perm_warnings').checked) permissions.push('Управление предупреждениями');
    if (document.getElementById('perm_vacation').checked) permissions.push('Управление отпусками');
    if (document.getElementById('perm_admins').checked) permissions.push('Управление администраторами');
    if (document.getElementById('perm_full').checked) permissions.push('Полный доступ');
    
    const adminPermissions = JSON.parse(localStorage.getItem('adminPermissions') || '{}');
    adminPermissions[login] = permissions.length > 0 ? permissions : ['Нет прав'];
    
    localStorage.setItem('adminPermissions', JSON.stringify(adminPermissions));
    
    showCustomAlert('Права обновлены!');
    closeModal();
    setTimeout(() => location.reload(), 1000);
}

function deleteAdmin(login) {
    // Блокировка удаления пользователя bypass
    if (login === 'bypass') {
        showCustomAlert('Невозможно удалить защищенного администратора bypass!');
        return;
    }
    
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modal.style.display = 'block';
    modalTitle.textContent = 'Инструкция по удалению';
    modalBody.innerHTML = `
        <p style="color: #aaa; margin-bottom: 15px;">Для удаления администратора <span style="color: #fff; font-weight: bold;">${login}</span>:</p>
        <ol style="color: #aaa; text-align: left; line-height: 1.8;">
            <li>Откройте файл <code style="background: #0a0a0a; padding: 2px 6px; border-radius: 4px; color: #0f0;">admins.json</code></li>
            <li>Найдите и удалите строку: <code style="background: #0a0a0a; padding: 2px 6px; border-radius: 4px; color: #f00;">"${login}": "..."</code></li>
            <li>Не забудьте удалить запятую, если она осталась лишней</li>
            <li>Сохраните файл и обновите страницу</li>
        </ol>
        <button onclick="closeModal()">Понятно</button>
    `;
}

async function deleteAdminFromServer(login) {
    // Блокировка удаления пользователя bypass
    if (login === 'bypass') {
        showCustomAlert('Невозможно удалить защищенного администратора bypass!');
        return;
    }
    
    showConfirm(`Удалить администратора ${login}?`, async (result) => {
        if (result) {
            try {
                const response = await fetch(`http://127.0.0.1:5000/api/admins/${login}`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                if (data.success) {
                    showCustomAlert('Администратор удален!');
                    setTimeout(() => location.reload(), 1000);
                } else {
                    showCustomAlert(data.message || 'Ошибка при удалении администратора');
                }
            } catch (error) {
                console.error('Ошибка:', error);
                showCustomAlert('Ошибка соединения с сервером. Убедитесь, что сервер запущен.');
            }
        }
    });
}

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

# Пути к файлам
DATA_FILE = 'data.json'
ADMINS_FILE = 'admins.json'

# Загрузка данных из файла
def load_json(filename):
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return [] if filename == DATA_FILE else {}

# Сохранение данных в файл
def save_json(filename, data):
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

# Получить всех пользователей
@app.route('/api/staff', methods=['GET'])
def get_staff():
    data = load_json(DATA_FILE)
    return jsonify(data)

# Сохранить всех пользователей (полная перезапись)
@app.route('/api/staff/save', methods=['POST'])
def save_staff():
    data = request.json
    save_json(DATA_FILE, data)
    return jsonify({'success': True, 'message': 'Данные сохранены'})

# Добавить пользователя
@app.route('/api/staff', methods=['POST'])
def add_staff():
    data = load_json(DATA_FILE)
    new_member = request.json
    data.append(new_member)
    save_json(DATA_FILE, data)
    return jsonify({'success': True, 'message': 'Пользователь добавлен'})

# Удалить пользователя
@app.route('/api/staff/<int:index>', methods=['DELETE'])
def delete_staff(index):
    data = load_json(DATA_FILE)
    if 0 <= index < len(data):
        deleted = data.pop(index)
        save_json(DATA_FILE, data)
        return jsonify({'success': True, 'message': f'Пользователь {deleted["nickname"]} удален'})
    return jsonify({'success': False, 'message': 'Пользователь не найден'}), 404

# Получить администраторов
@app.route('/api/admins', methods=['GET'])
def get_admins():
    admins = load_json(ADMINS_FILE)
    return jsonify(admins)

# Добавить администратора
@app.route('/api/admins', methods=['POST'])
def add_admin():
    admins = load_json(ADMINS_FILE)
    new_admin = request.json
    admins[new_admin['login']] = new_admin['password']
    save_json(ADMINS_FILE, admins)
    return jsonify({'success': True, 'message': 'Администратор добавлен'})

# Удалить администратора
@app.route('/api/admins/<login>', methods=['DELETE'])
def delete_admin(login):
    if login == 'bypass':
        return jsonify({'success': False, 'message': 'Нельзя удалить защищенного администратора'}), 403
    
    admins = load_json(ADMINS_FILE)
    if login in admins:
        del admins[login]
        save_json(ADMINS_FILE, admins)
        return jsonify({'success': True, 'message': 'Администратор удален'})
    return jsonify({'success': False, 'message': 'Администратор не найден'}), 404

# Статические файлы
@app.route('/')
def index():
    return send_from_directory('.', 'auth.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

if __name__ == '__main__':
    print('=' * 50)
    print('Сервер запущен!')
    print('Откройте в браузере: http://127.0.0.1:5000')
    print('Для остановки нажмите Ctrl+C')
    print('=' * 50)
    app.run(debug=True, host='127.0.0.1', port=5000)

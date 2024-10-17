const http = require('http');

const {Command} = require('commander');
const prog = new Command();

const fs = require('fs');
const path = require('path');
const superagent = require('superagent');

// Налаштування параметрів командного рядка
prog
    .option('-h, --host <host>', 'server host')
    .option('-p, --port <port>', 'server port')
    .option('-c, --cache <cacheDir>', 'cache directory');

prog.parse(process.argv);
const opt = prog.opts();

// Перевірка наявності каталогу кешу
fs.promises.mkdir(opt.cache, { recursive: true })
    .then(() => console.log('Cache directory is ready'))
    .catch(error => console.error('Error creating cache directory:', error));

// Функція обробки GET-запиту
async function Get(code, fileN, res) {
    try {
        let data = await fs.promises.readFile(fileN); // Читаємо з кешу
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.end(data);
    } 
    catch {
        try {
            const response = await superagent.get(`https://http.cat/${code}`); // Завантажуємо з http.cat
            const data = response.body;
            await fs.promises.writeFile(fileN, data); // Зберігаємо в кеш
            res.writeHead(200, { 'Content-Type': 'image/jpeg' });
            res.end(data);
        } 
        catch {
            res.writeHead(404); // Не знайдено
            res.end();
        }
    }
}

// Функція обробки PUT-запиту
async function Put(fileN, req, res) {
    const data = [];
    req.on('data', chunk => data.push(chunk)); // Збираємо дані
    req.on('end', async () => {
        try {
        await fs.promises.writeFile(fileN, Buffer.concat(data)); // Записуємо в кеш
        res.writeHead(201); // Створено
        res.end();
        } 
        catch {
        res.writeHead(500); // Помилка сервера
        res.end();
        }
    });
}

// Функція обробки DELETE-запиту
async function Delete(fileN, res) {
    try {
        await fs.promises.unlink(fileN); // Видаляємо файл з кешу
        res.writeHead(200); // ОК
        res.end();
    } 
    catch {
        res.writeHead(404); // Не знайдено
        res.end();
    }
}

// Створення HTTP-сервера
const server = http.createServer((req, res) => {
    const code = req.url.slice(1); // Код з URL
    const fileN = path.join(opt.cache, `${code}.jpg`); // Ім'я файлу кешу

    switch (req.method) {
        case 'GET':
            Get(code, fileN, res);
            break;
        case 'PUT':
            Put(fileN, req, res);
            break;
        case 'DELETE':
            Delete(fileN, res);
            break;
        default:
            res.writeHead(405); // Метод не підтримується
            res.end();
    }
});

// Запуск сервера
server.listen(opt.port, opt.host, () => console.log(`Server running at http://${opt.host}:${opt.port}/`));

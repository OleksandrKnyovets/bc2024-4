const http = require('http');                           //імпорт модуля для роботи з HTTP
const superagent = require('superagent');               //для HTTP-запитів

const {Command} = require('commander');                 //для обробки командного рядка
const prog = new Command();                             //ініціалізація програми командного рядка

const fs = require('fs');                               //для роботи з файловою системою
const path = require('path');                           //для роботи з шляхами

//налаштування параметрів командного рядка
prog
    .option('-h, --host <host>', 'server host')         //параметр для хосту сервера
    .option('-p, --port <port>', 'server port')                      //порту сервера
    .option('-c, --cache <cacheDir>', 'cache directory');            //папки з кешом

prog.parse(process.argv); //парсинг аргументів командного рядка
const opt = prog.opts(); //отримання опцій

//перевірка наявності обов'язкових параметрів
if (!opt.host) { //якщо хост не вказано
    console.error('not a required parameter host');
    process.exit(); //капут 
}

if (!opt.port) { //якщо порт не вказано
    console.error('not a required parameter port');
    process.exit(); //капут
}

if (!opt.cache) { //якщо папки з кешом не вказана
    console.error('not a required parameter cache');
    process.exit(); //капут
}


//створення директорії кешу
fs.promises.mkdir(opt.cache, {recursive: true}) //створення директорії
    .then(() => console.log('Cache directory is ready'));

//функція обробки GET-запиту
function Get(code, fileX, res) { //code - код помилки, fileX - шлях до файлу, res - об'єкт відповіді
    fs.promises.readFile(fileX) //читання файлу
        .then(data => { //якщо файл знайдено
        res.writeHead(200, { 'Content-Type': 'image/jpeg' }); //відповідь (зображенням)
        loger(200);
        res.end(data); //відправка даних
        })
        .catch(() => { //якщо файл не знайдено
            superagent.get(`https://http.cat/${code}`) //запит до зовнішнього сервісу для отримання зображення
                .then(response => { //якщо запит успішний
                    const data = response.body; //отримання тіла відповіді
                    fs.promises.writeFile(fileX, data); //збереження зображення у кеш
                    res.writeHead(200, { 'Content-Type': 'image/jpeg' }); //відповідь (зображенням)
                    loger(200);
                    res.end(data); //відправка даних
                })
                .catch(err => { //обробка помилки запиту
                    res.writeHead(404); //помилка (не знайдено)
                    loger(404);
                    res.end(); 
                });
        });
}

//функція обробки PUT-запиту
function Put(fileX, req, res) { //fileX - шлях до файлу, req - запит, res - відповідь
    const data = []; //масив для збору частин запиту
    req.on('data', chunk => data.push(chunk)); //додавання частин до масиву
    req.on('end', () => { //коли запит закінчено
        fs.promises.writeFile(fileX, Buffer.concat(data)) //запис даних у файл
            .then(() => { //якщо запис успішний
                res.writeHead(201); //код (створено)
                loger(201);
                res.end(); //rsytwm
            })
            .catch(() => { //обробка помилки запису
                res.writeHead(500); //помилка (внутрішня помилка сервера)
                loger(500);
                res.end(); 
            });
    });
}

//функція обробки DELETE-запиту
function Delete(fileX, res) { //fileX - шлях до файлу, res - відповідь
    fs.promises.unlink(fileX) //видалення файлу
        .then(() => { //якщо видалення успішне
            res.writeHead(200); //код (успішно)
            loger(200);
            res.end(); 
        })
        .catch(() => { //обробка помилки видалення
            res.writeHead(404); //помилка (не знайдено)
            loger(404);
            res.end(); 
        });
}

const loger = (statusCode) => { //виводить в консоль статус код
    console.log(`status code: ${statusCode}`);
};

//створення HTTP-сервера
const server = http.createServer((req, res) => { //req - запит, res - відповідь
    const code = req.url.slice(1); //отримання коду з URL
    const fileX = path.join(opt.cache, `${code}.jpg`); //формування шляху до кешованого файлу

    switch (req.method) { //обробка методу запиту
        case 'GET':
            Get(code, fileX, res); 
            break;
        case 'PUT':
            Put(fileX, req, res); 
            break;
        case 'DELETE':
            Delete(fileX, res); 
            break;
        default:
            res.writeHead(405); //метод ніхт
            loger(405);
            res.end();
    }
});

//запуск сервера (відразу виводить кашак 200)
server.listen (opt.port, opt.host, () => console.log(`Server running http://${opt.host}:${opt.port}/${200}`)); 

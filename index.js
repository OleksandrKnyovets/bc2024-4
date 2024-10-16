const http = require('http');
const {Command} = require('commander');
const fs = require('fs');
const path = require('path');

// Налаштування параметрів командного рядка
const prog = new Command();
prog
    .Option('-h, --host <host>', 'server host', 'localhost')
    .Option('-p, --port <port>', 'server port', '5000' )
    .Option('-c, --cache <cacheDir>', 'cache directory','./cache');

prog.parse(process.argv);
const opt = prog.opts();

// Створення HTTP сервера
const server = http.createServer((req, res) => {
  // Це місце для наступної частини з роботою з файлами
});

// Запуск сервера
server.listen(opt.port, opt.host, () => {
    console.log(`Server running at http://${opt.host}:${opt.port}/`);
});

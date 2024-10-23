const http = require('http');

const {Command} = require('commander');
const prog = new Command();

const fs = require('fs');
const path = require('path');
const superagent = require('superagent');

//налаштування параметрів командного рядка
prog
    .option('-h, --host <host>', 'server host')
    .option('-p, --port <port>', 'server port')
    .option('-c, --cache <cacheDir>', 'cache directory');

prog.parse(process.argv);
const opt = prog.opts();

//перевірка наявності обов'язкових параметрів
if (!opt.host){
    console.error('not a required parameter host');
    process.exit(); 
}

if (!opt.port){
    console.error('not a required parameter port');
    process.exit(); 
}

if (!opt.cache){
    console.error('not a required parameter cache');
    process.exit(); //завершення програми 
}

fs.promises.mkdir(opt.cache, {recursive:true})
    .then(()=>console.log('Cache directory is ready'))
    .catch(error=>{
        console.error('Error creating cache', error);
        process.exit(); 
    });

//функція обробки GET-запиту
function Get(code, fileX, res){
    fs.promises.readFile(fileX) 
        .then(data=>{
            res.writeHead(200,{'Content-Type': 'image/jpeg'});
            res.end(data);
        })
        .catch(()=>{
            superagent.get(`https://http.cat/${code}`)
                .then(response=>{
                    const data = response.body;
                    return fs.promises.writeFile(fileX, data); 
                })
                .then(data=>{ 
                    res.writeHead(200, {'Content-Type': 'image/jpeg'});
                    res.end(data);
                })
                .catch(err=>{
                    console.error('Error fetching image:', err);
                    res.writeHead(404); 
                    res.end();
                });
        });
}

//функція обробки PUT-запиту
function Put(fileX, req, res){
    const data = [];
    req.on('data', chunk =>data.push(chunk)); 
    req.on('end', ()=>{
        fs.promises.writeFile(fileX, Buffer.concat(data)) 
            .then(()=>{
                res.writeHead(201); 
                res.end();
            })
            .catch(()=>{
                res.writeHead(500); 
                res.end();
            });
    });
}

//функція обробки DELETE-запиту
function Delete(fileX, res){
    fs.promises.unlink(fileX) 
        .then(()=>{
            res.writeHead(200); 
            res.end();
        })
        .catch(()=>{
            res.writeHead(404);
            res.end();
        });
}

//створення HTTP-сервера
const server = http.createServer((req, res)=>{
    const code = req.url.slice(1);
    const fileX = path.join(opt.cache, `${code}.jpg`);

    switch (req.method){
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
            res.writeHead(405);
            res.end();
    }
});

//запуск сервера
server.listen(opt.port, opt.host,()=>console.log(`Server running http://${opt.host}:${opt.port}/`));

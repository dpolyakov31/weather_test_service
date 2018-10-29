let express = require('express');
let http = require('http');
let path = require('path');
let Websocket = require('ws');
let fs = require('fs');
let request = require("request");
let citiesUrl = require('./config/cities_config.json')
let tempArrayKyiv = [];
let tempArrayLondon = [];
let timeArr = [];

let app = express();

const URL_KYIV = citiesUrl.Kyiv;
const URL_LONDON = citiesUrl.London;

http.createServer(app).listen(3000, () => console.log('listening...'));
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res) => { res.status(404).send('Page not found!'); });

let ws = new Websocket.Server({ port: 5250 });

let weatherKyivObject = {};
let weatherLondonObject = {};
ws.on('connection', (ws) => {
    getWeatherServiceLondon(ws);
    getWeatherServiceKyiv(ws);    
    sendDataToClient(ws);
});


function sendDataToClient(ws) {
    setInterval(() => {
        if(tempArrayLondon.length == 0 || tempArrayKyiv.length == 0)return;
        if (ws.readyState == 1) {
            timeArr.push(getTime());
            fillGaps(timeArr, tempArrayKyiv);
            fillGaps(timeArr, tempArrayLondon);            
            ws.send(JSON.stringify({ "dataKyiv": tempArrayKyiv, "time": timeArr }));
            ws.send(JSON.stringify(weatherKyivObject));
            ws.send(JSON.stringify({ "dataLondon": tempArrayLondon, "time": timeArr }));
            ws.send(JSON.stringify(weatherLondonObject));            
        }
    }, 1000);
}

function getWeatherServiceLondon(ws) {
    setInterval(() => {
        function getData(url) {
            return new Promise((res, rej) => {
                let dataLondon;
                request.get(url, (error, response, body) => {
                    if (error) console.log(error);
                    dataLondon = JSON.parse(body);
                    res(dataLondon);
                });
                setTimeout(() => { if (!dataLondon) rej() }, 3000);
            });
        }
        getData(URL_LONDON)
            .then((result) => {
                tempArrayLondon.push(result.main.temp);
                weatherLondonObject = { "humidityLondon": result.main.humidity, "condition": result.weather[0].main, "temp": result.main.temp };
            })
            .catch(() => {               
                if (ws.readyState == 1)
                    ws.send(JSON.stringify({ "LondonResponse": false }));
                writeLog('Api is not responding over 3 seconds(London)');
            });
    }, 2000);
}
function getWeatherServiceKyiv(ws) {
    setInterval(() => {
        function getData(url) {
            return new Promise((res, rej) => {
                let dataKyiv;
                request.get(url, (error, response, body) => {
                    if (error) console.log(error);
                    dataKyiv = JSON.parse(body);                    
                    res(dataKyiv);
                });
                setTimeout(() => { if (!dataKyiv) rej() }, 3000);
            });
        }
        getData(URL_KYIV)
            .then((result) => {
                tempArrayKyiv.push(result.main.temp);
                weatherKyivObject = { "humidityKyiv": result.main.humidity, "condition": result.weather[0].main, "temp": result.main.temp };
            })
            .catch(() => {                
                if (ws.readyState == 1)
                    ws.send(JSON.stringify({ "KyivResponse": false }));
                writeLog('Api is not responding over 3 seconds(Kyiv)');
            });
    }, 2000);
}
function getTime() {
    let date = new Date();
    let hours = date.getHours().toString();
    let min = date.getMinutes().toString().length == 1 ? "0" + date.getMinutes() : date.getMinutes();
    let sec = date.getSeconds().toString().length == 1 ? "0" + date.getSeconds() : date.getSeconds();
    return `${hours}:${min}:${sec}`;
}
function getDate() {
    let date = new Date();
    let year = date.getFullYear().toString();
    let month = date.getMonth().toString().length == 1 ? "0" + date.getMonth() : ++date.getMonth();
    let day = date.getDate().toString().length == 1 ? "0" + date.getDate() : date.getDate();
    return `${year}.${++month}.${day}`;
}
function writeLog(message) {
    let log = `${getTime()} -- ${message}\r\n`;
    fs.appendFile(path.join(__dirname, `/log/${getDate()}.txt`), log, (err) => {
        if (err) console.log(err);
    });
}
function fillGaps(timeArr, tempArr) {
    if (timeArr.length > tempArr.length) {
        for (let i = tempArr.length; i < timeArr.length; i++) {
            tempArr[i] = tempArr[i - 1];
        }
    }
}
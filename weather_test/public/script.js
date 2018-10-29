let ctxKyiv = document.getElementById('kyiv').getContext('2d');
let ctxLondon = document.getElementById('london').getContext('2d');
let labelsLondon = [], dataLondon = [], labelsKyiv = [], dataKyiv = [];
let maskDivLondon = document.getElementById('divMaskLondon');
let maskDivKyiv = document.getElementById('divMaskKyiv');
let londonContainer = document.getElementById('divLondon');
let kyivContainer = document.getElementById('divKyiv');
let hideLondon = true;
let hideKyiv = true;
let url = window.location.href.replace(/http:\/\//g, "");
let wsIp = url.substring(0, url.indexOf(':'));
let wsPort = 5250;

ws = new WebSocket(`ws://${wsIp}:${wsPort}`);

ws.onopen = function () {
    console.log("Socket opened");
}
ws.onmessage = socketMassage;

ws.onclose = function () {
    alert('Server connection has closed!');
}

function socketMassage(message) {
    //console.log(message.data);
    let mesData = JSON.parse(message.data);
    if ('dataKyiv' in mesData) {
        updateChart(chartKyiv, mesData.dataKyiv, mesData.time);
    }
    if ('dataLondon' in mesData) {
        updateChart(chartLondon, mesData.dataLondon, mesData.time);
    }
    if ('LondonResponse' in mesData) {
        if (hideLondon) {
            hideLondon = false;            
            londonContainer.classList.add('hideDiv');
            maskDivLondon.classList.remove('hideDiv');
            setTimeout(() => {
                maskDivLondon.classList.add('hideDiv');
                londonContainer.classList.remove('hideDiv');                
                hideLondon = true;
            }, 3000);
        }
    }
    if ('KyivResponse' in mesData) {
        if (hideKyiv) {
            hideKyiv = false;
            kyivContainer.classList.add('hideDiv');
            maskDivKyiv.classList.remove('hideDiv');
            setTimeout(() => {
                maskDivKyiv.classList.add('hideDiv');
                kyivContainer.classList.remove('hideDiv');
                hideKyiv = true;
            }, 3000);
        }
    }
    if ('humidityKyiv' in mesData) {
        setWeatherBlockKyiv(mesData);
    }
    if ('humidityLondon' in mesData) {
        setWeatherBlockLondon(mesData);
    }
}

function updateChart(ctx, data, labels) {
    ctx.options.scales.yAxes[0].ticks.min = data[data.length - 1] - 2;
    ctx.options.scales.yAxes[0].ticks.max = data[data.length - 1] + 2;
    ctx.data.datasets[0].data = data;
    ctx.data.labels = labels;
    ctx.update();
}
function setWeatherBlockKyiv(data) {
    document.getElementById('kyivTempSpan').textContent = data.temp + ' \u2103';
    document.getElementById('kyivHumiditySpan').textContent = 'Humidity: ' + data.humidityKyiv + '%';
    document.getElementById('kyivConditionSpan').textContent = data.condition;
}
function setWeatherBlockLondon(data) {
    document.getElementById('londonTempSpan').textContent = data.temp + " \u2103";
    document.getElementById('londonHumiditySpan').textContent = 'Humidity: ' + data.humidityLondon + '%';
    document.getElementById('londonConditionSpan').textContent = data.condition;
}

let chartLondon = new Chart(ctxLondon, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: "London temperature chart Temp./Time",
            backgroundColor: 'rgba(255, 0, 0, 0)',
            borderColor: 'rgb(150, 0, 0)',
            data: [],
            radius: 0
        }]
    },
    options: {
        scales: {
            yAxes: [{
                display: true,
                ticks: {
                    min: -25,
                    max: 40
                },
                scaleLabel: {
                    display: true,
                    labelString: 'T \u2103'
                }
            }]
        },
        elements: {
            point: {
                radius: 0
            }
        }
    }
});

let chartKyiv = new Chart(ctxKyiv, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: "Kyiv temperature chart Temp./Time",
            backgroundColor: 'rgba(0, 0, 255, 0)',
            borderColor: 'rgb(0, 0, 150)',
            data: [],
            radius: 0
        }]
    },
    options: {
        scales: {
            yAxes: [{
                display: true,
                ticks: {
                    min: -25,
                    max: 40
                },
                scaleLabel: {
                    display: true,
                    labelString: 'T \u2103'
                }
            }]
        }
    }
});
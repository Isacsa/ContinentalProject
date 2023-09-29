document.addEventListener("DOMContentLoaded", () => {
    
    const operatorName = document.getElementById("operatorName");
    const stationSelect = document.getElementById("stationSelect");
    const counterElement = document.getElementById("counter");
    const timerElement = document.getElementById("timer");
    const startButton = document.getElementById("startButton");
    const pauseButton = document.getElementById("pauseButton");
    const continueButton = document.getElementById("continueButton");
    const stopButton = document.getElementById("stopButton");
    const showStatsButton = document.getElementById("showStatsButton");
    const exportButton = document.getElementById("exportButton");
    const timeListContainer = document.getElementById("timeListContainer");
    const lapButton = document.getElementById("lapButton");
    const lapTimesContainer = document.getElementById("lapTimesContainer");

    let stationData = new Map();
    let timerId;
    let startTime;
    let pausedTime;

    const updateTimeElement = (element, time) => {
        const minutes = Math.floor(time / 60000);
        const seconds = Math.floor((time - minutes * 60000) / 1000);
        const milliseconds = time - minutes * 60000 - seconds * 1000;
        element.textContent = `${String(minutes).padStart(2, "0")}m:${String(seconds).padStart(2, "0")}s:${String(milliseconds).padStart(3, "0")}ms`;
    };

    startButton.addEventListener("click", () => {
        const stationId = stationSelect.value;
        if (!stationData.has(stationId)) {
            stationData.set(stationId, { times: [], lapTimes: [], counter: 0 });
        }
        const station = stationData.get(stationId);
        station.counter++;
        counterElement.textContent = `Contagens: ${station.counter}`;
        startTime = Date.now();
        timerId = setInterval(() => {
            updateTimeElement(timerElement, Date.now() - startTime);
        }, 1);
        startButton.disabled = true;
        pauseButton.disabled = false;
        stopButton.disabled = false;
        station.lapTimes.push([]); // Add a new lap times array for this count
    });

    pauseButton.addEventListener("click", () => {
        clearInterval(timerId);
        pausedTime = Date.now() - startTime;
        startButton.disabled = true;
        pauseButton.disabled = true;
        continueButton.disabled = false;
        stopButton.disabled = false;
    });

    continueButton.addEventListener("click", () => {
        startTime = Date.now() - pausedTime;
        timerId = setInterval(() => {
            updateTimeElement(timerElement, Date.now() - startTime);
        }, 1);
        startButton.disabled = true;
        pauseButton.disabled = false;
        stopButton.disabled = false;
        continueButton.disabled = true;
        startButton.textContent = "Pausar";
    });

    stopButton.addEventListener("click", () => {
        clearInterval(timerId);
        const stationId = stationSelect.value;
        const station = stationData.get(stationId);
        station.times.push(Date.now() - startTime);
        updateTimeElement(timerElement, Date.now() - startTime);
        timeListContainer.innerHTML = station.times.map(time => `<div>${(time / 1000).toFixed(3)}s</div>`).join("");
        startButton.disabled = false;
        pauseButton.disabled = true;
        stopButton.disabled = true;
        continueButton.disabled = true;
        startButton.textContent = "Iniciar";
    });

    lapButton.addEventListener("click", () => {
        if (timerId) {
            const stationId = stationSelect.value;
            const station =             stationData.get(stationId);
            const lapTime = Date.now() - startTime;
            station.lapTimes[station.lapTimes.length - 1].push(lapTime); // Add the lap time to the current count's lap times array
            updateTimeElement(lapTimesContainer, lapTime);
            lapTimesContainer.innerHTML = station.lapTimes.map((lapTimes, index) => 
                lapTimes.map(time => `<div>Contagem ${index + 1}: ${(time / 1000).toFixed(3)}s</div>`).join("")
            ).join("");
        }
    });
    
    listTimesButton.addEventListener("click", () => {
        const stationId = stationSelect.value;
        const station = stationData.get(stationId);
        timeListContainer.innerHTML = station.times.map(time => `<div>${(time / 1000).toFixed(3)}s</div>`).join("");
    });

    showStatsButton.addEventListener("click", () => {
        const stationId = stationSelect.value;
        const station = stationData.get(stationId);
        if (!station || station.times.length === 0) {
            alert("Não há tempos registrados para esta estação.");
            return;
        }
        const totalTime = station.times.reduce((a, b) => a + b, 0);
        const averageTime = totalTime / station.times.length || 0;
        const minTime = Math.min(...station.times) || 0;
        const maxTime = Math.max(...station.times) || 0;
        alert(`Média: ${(averageTime / 1000).toFixed(3)}s\nMínimo: ${(minTime / 1000).toFixed(3)}s\nMáximo: ${(maxTime / 1000).toFixed(3)}s`);
    });


    const exportToExcel = () => {
        if (stationData.size === 0) {
            alert("Não há dados para exportar.");
            return;
        }
        const workbook = XLSX.utils.book_new();
        for (const [stationId, station] of stationData.entries()) {
            const totalTime = station.times.reduce((a, b) => a + b, 0);
            const averageTime = totalTime / station.times.length || 0;
            const minTime = Math.min(...station.times) || 0;
            const maxTime = Math.max(...station.times) || 0;
    
            const worksheetData = [
                ["Operador", operatorName.value],
                ["Estação", stationId],
                ["Total de Contagens", station.counter],
                ["Tempos (s)", ...station.times.map(time => (time / 1000).toFixed(3))],
                ["Média (s)", (averageTime / 1000).toFixed(3)],
                ["Mínimo (s)", (minTime / 1000).toFixed(3)],
                ["Máximo (s)", (maxTime / 1000).toFixed(3)]
            ];
    
            for(let i = 0; i < station.lapTimes.length; i++){
                worksheetData.push([`Tempos de volta (s) da contagem ${i + 1}`, ...station.lapTimes[i].map(time => (time / 1000).toFixed(3))]);
            }
    
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
            XLSX.utils.book_append_sheet(workbook, worksheet, `Estação ${stationId}`);
        }
        XLSX.writeFile(workbook, "dados_de_producao.xlsx");
    };
    
    exportButton.addEventListener("click", exportToExcel);
});


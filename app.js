// --- CONFIGURAZIONE MAPPA ---
const map = L.map('map', { zoomControl: false }).setView([41.90, 12.49], 5);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

let flightLayer = L.layerGroup().addTo(map);
let spaceLayer = L.layerGroup().addTo(map);

// --- LA TUA CHIAVE GEMINI (Inserita!) ---
const GEMINI_KEY = "AIzaSyAaZXjK0BIIiLQUqOe0ds9wS8zg13wCfWM"; 

// --- FUNZIONE AI GEMINI ---
async function runAIEngine(dataSummary) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: `Sistema Intelligence: analizza ${dataSummary}. Report da spia, massimo 10 parole.` }] }] })
        });
        const data = await response.json();
        document.getElementById('ai-log').innerText = "🤖 REPORT: " + data.candidates[0].content.parts[0].text;
    } catch (e) { document.getElementById('ai-log').innerText = "🤖 AI OFFLINE - VERIFICA CONNESSIONE"; }
}

// --- FUNZIONE AGGIORNAMENTO DATI (Voli + ISS) ---
async function updateDashboard() {
    try {
        // 1. Recupero Voli (OpenSky - Dati Pubblici)
        const resF = await fetch('https://opensky-network.org/api/states/all?lamin=35.0&lomin=6.0&lamax=47.0&lomax=19.0');
        const dataF = await resF.json();
        flightLayer.clearLayers();
        const fCount = dataF.states ? dataF.states.slice(0, 15).length : 0;
        
        if(dataF.states) {
            dataF.states.slice(0, 15).forEach(f => {
                L.circleMarker([f[6], f[5]], { radius: 4, color: '#00ff41', fillOpacity: 0.8 }).addTo(flightLayer);
            });
        }
        document.getElementById('flight-count').innerText = fCount;

        // 2. Recupero ISS (Stazione Spaziale - Senza API Key)
        const resS = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
        const dataS = await resS.json();
        spaceLayer.clearLayers();
        L.circleMarker([dataS.latitude, dataS.longitude], { 
            radius: 8, color: '#00ccff', weight: 3, fillOpacity: 1 
        }).bindPopup("ISS - STAZIONE SPAZIALE").addTo(spaceLayer);
        document.getElementById('iss-status').innerText = "LOCALIZZATA";

        // 3. Analisi AI in tempo reale
        runAIEngine(`Voli rilevati: ${fCount}. Stazione ISS a coordinate ${dataS.latitude.toFixed(2)}, ${dataS.longitude.toFixed(2)}.`);

    } catch (err) {
        console.error("Errore durante l'aggiornamento dei dati");
    }
}

// Aggiorna ogni 30 secondi per non sovraccaricare il sistema
setInterval(updateDashboard, 30000);
updateDashboard();

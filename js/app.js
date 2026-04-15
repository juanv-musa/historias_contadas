import { supabase } from "./supabase-config.js";

const appContainer = document.getElementById("app-container");
const clientLogo = document.getElementById("client-logo");
const storyTitle = document.getElementById("story-title");
const clientName = document.getElementById("client-name");

const btnLangEs = document.getElementById("btn-lang-es");
const btnLangEn = document.getElementById("btn-lang-en");

const audioElement = document.getElementById("audio-element");
const btnPlayPause = document.getElementById("play-pause-btn");
const iconPlay = document.getElementById("icon-play");
const iconPause = document.getElementById("icon-pause");

const timeline = document.getElementById("timeline");
const progressBar = document.getElementById("progress-bar");
const currentTimeDisplay = document.getElementById("current-time");
const durationTimeDisplay = document.getElementById("duration-time");

let storyData = null;
let currentLang = 'ES';

async function init() {
    // 1. Obtener ID de la URL
    const params = new URLSearchParams(window.location.search);
    const storyId = params.get("id");

    if (!storyId) {
        showError("No se ha especificado ninguna historia válida.");
        return;
    }

    try {
        // 2. Fetch Story + Project Join 
        // En Supabase, si hemos configurado la Foreign Key en stories (project_id -> projects.id),
        // podemos hacer un Join así:
        const { data, error } = await supabase
            .from('stories')
            .select(`
                *,
                project:projects (
                    name,
                    primary_color,
                    logo_url
                )
            `)
            .eq('id', storyId)
            .single();

        if (error || !data) {
            console.error(error);
            showError("Historia no encontrada.");
            return;
        }

        storyData = data;

        // 3. Apply Brand
        if (storyData.project) {
            applyBrand(storyData.project);
        }

        // 4. Render initial info
        storyTitle.innerText = storyData.title;
        setAudioSource('ES'); // Inicia en Español por defecto

        // Setup Player Listeners
        setupPlayer();
        
    } catch (error) {
        console.error("Error loading app", error);
        showError("Ocurrió un error cargando el contenido.");
    }
}

function showError(msg) {
    storyTitle.innerText = "Error";
    clientName.innerText = msg;
    appContainer.style.background = "rgba(255, 0, 0, 0.1)";
}

function applyBrand(brand) {
    if (brand.name) {
        clientName.innerText = brand.name;
    }
    
    if (brand.logo_url) {
        clientLogo.src = brand.logo_url;
        clientLogo.classList.remove("hidden");
    }

    if (brand.primary_color) {
        const root = document.documentElement;
        root.style.setProperty('--brand-color', brand.primary_color);
        root.style.setProperty('--brand-color-dark', adjustColor(brand.primary_color, -20));
    }
}

function adjustColor(color, amount) {
    if(!color) return '#3b82f6';
    return '#' + color.replace(/^#/, '').replace(/../g, c => ('0'+Math.min(255, Math.max(0, parseInt(c, 16) + amount)).toString(16)).substring(-2));
}

function setAudioSource(lang) {
    currentLang = lang;
    const currentTime = audioElement.currentTime;
    const wasPlaying = !audioElement.paused;

    if (lang === 'ES') {
        audioElement.src = storyData.audio_es_url;
        btnLangEs.classList.add("active");
        btnLangEn.classList.remove("active");
    } else {
        audioElement.src = storyData.audio_en_url;
        btnLangEn.classList.add("active");
        btnLangEs.classList.remove("active");
    }

    audioElement.load();
    audioElement.currentTime = currentTime;
    
    if (wasPlaying) {
        audioElement.play();
    }
}

btnLangEs.addEventListener("click", () => setAudioSource('ES'));
btnLangEn.addEventListener("click", () => setAudioSource('EN'));

// Player Functions
function setupPlayer() {
    btnPlayPause.addEventListener("click", togglePlayPause);
    audioElement.addEventListener("timeupdate", updateProgress);
    audioElement.addEventListener("loadedmetadata", updateProgress);
    audioElement.addEventListener("ended", () => {
        iconPlay.classList.remove("hidden");
        iconPause.classList.add("hidden");
        progressBar.style.width = '0%';
    });
    timeline.addEventListener("click", seek);
}

function togglePlayPause() {
    if (audioElement.paused) {
        audioElement.play();
        iconPlay.classList.add("hidden");
        iconPause.classList.remove("hidden");
    } else {
        audioElement.pause();
        iconPlay.classList.remove("hidden");
        iconPause.classList.add("hidden");
    }
}

function updateProgress() {
    const { duration, currentTime } = audioElement;
    if (isNaN(duration)) return;

    const progressPercent = (currentTime / duration) * 100;
    progressBar.style.width = `${progressPercent}%`;

    currentTimeDisplay.innerText = formatTime(currentTime);
    durationTimeDisplay.innerText = formatTime(duration);
}

function seek(e) {
    const rect = timeline.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const duration = audioElement.duration;
    
    if (!isNaN(duration)) {
        audioElement.currentTime = (clickX / width) * duration;
    }
}

function formatTime(seconds) {
    if(isNaN(seconds)) return "0:00";
    let min = Math.floor(seconds / 60);
    let sec = Math.floor(seconds % 60);
    if (sec < 10) { sec = `0${sec}`; }
    return `${min}:${sec}`;
}

init();

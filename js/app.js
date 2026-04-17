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

const storyImageWrapper = document.getElementById("story-image-wrapper");
const storyImage = document.getElementById("story-image");
const transcriptionWrapper = document.getElementById("transcription-wrapper");
const btnToggleTranscription = document.getElementById("btn-toggle-transcription");
const transcriptionContent = document.getElementById("transcription-content");
const transcriptionText = document.getElementById("transcription-text");

const footerLogosContainer = document.getElementById("footer-logos-container");
const footerLogosImg = document.getElementById("footer-logos-img");
const currentYearSpan = document.getElementById("current-year");

// PDF Elements
const audioPlayerWrapper = document.getElementById("audio-player-wrapper");
const pdfPlayerWrapper = document.getElementById("pdf-player-wrapper");
const btnViewPdf = document.getElementById("btn-view-pdf");

let storyData = null;
let currentLang = 'ES';

const i18n = {
    'ES': {
        'pageTitle': 'Historias Contadas | Player',
        'loading': 'Cargando Historia...',
        'error': 'Error',
        'errorMsg': 'No se ha especificado ninguna historia válida.',
        'notFound': 'Historia no encontrada.',
        'transcriptionShow': '📄 Ver Transcripción',
        'transcriptionHide': '📄 Ocultar Transcripción'
    },
    'EN': {
        'pageTitle': 'Contadas Stories | Player',
        'loading': 'Loading Story...',
        'error': 'Error',
        'errorMsg': 'No valid story specified.',
        'notFound': 'Story not found.',
        'transcriptionShow': '📄 See Transcription',
        'transcriptionHide': '📄 Hide Transcription'
    }
};

async function init() {
    // 1. Obtener ID o Slug de la URL
    const params = new URLSearchParams(window.location.search);
    let storyIdOrSlug = params.get("id");

    // Si no hay id en la query, miramos en la ruta del archivo (para QRs antiguos)
    if (!storyIdOrSlug) {
        const pathParts = window.location.pathname.split('/');
        const lastPart = pathParts.pop() || pathParts.pop(); // Manejar posibles "/" al final
        if (lastPart && lastPart !== 'index.html' && lastPart !== 'index') {
            storyIdOrSlug = lastPart;
        }
    }

    if (!storyIdOrSlug) {
        showError(i18n[currentLang].errorMsg);
        return;
    }

    try {
        // 2. Fetch Story + Project Join 
        // Verificamos si es un UUID válido o un Slug personalizado
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storyIdOrSlug);

        let query = supabase
            .from('stories')
            .select(`
                *,
                project:projects (
                    name,
                    primary_color,
                    background_color,
                    logo_url,
                    footer_logos_url
                )
            `);

        // Si es UUID buscamos por columna ID, si no, por la columna Slug
        if (isUUID) {
            query = query.eq('id', storyIdOrSlug);
        } else {
            query = query.eq('slug', storyIdOrSlug);
        }

        const { data, error } = await query.single();

        if (error || !data) {
            console.error(error);
            showError(i18n[currentLang].notFound);
            return;
        }

        storyData = data;

        // 3. Apply Brand
        if (storyData.project) {
            applyBrand(storyData.project);
        }

        // 4. Set current year
        if (currentYearSpan) {
            currentYearSpan.innerText = new Date().getFullYear();
        }

        // 5. Show story image if exists
        if (storyData.image_url) {
            storyImage.src = storyData.image_url;
            storyImageWrapper.style.display = 'block';
        }

        // 5. Render initial info
        updateLanguageUI();
        
        if (storyData.content_type === 'pdf') {
            audioPlayerWrapper.classList.add("hidden");
            pdfPlayerWrapper.classList.remove("hidden");
            setContentSource('ES');
        } else {
            audioPlayerWrapper.classList.remove("hidden");
            pdfPlayerWrapper.classList.add("hidden");
            setContentSource('ES');
            setupPlayer();
        }

        // 6. Setup transcription
        setupTranscription();
        
    } catch (error) {
        console.error("Error loading app", error);
        showError(currentLang === 'ES' ? "Ocurrió un error cargando el contenido." : "An error occurred loading the content.");
    }
}

function showError(msg) {
    storyTitle.innerText = i18n[currentLang].error;
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
        root.style.setProperty('--brand-color-dark', adjustColor(brand.primary_color, -40));

        // Aplicamos Color de Fondo si existe
        const bgColor = brand.background_color || '#0f172a';
        root.style.setProperty('--bg-dark', bgColor);

        // Inteligencia de Contraste Principal (Fondo)
        const isBgLight = getContrastYIQ(bgColor) === 'black';
        if (isBgLight) {
            root.style.setProperty('--text-primary', '#0f172a');
            root.style.setProperty('--text-secondary', '#4b5563');
            root.style.setProperty('--card-bg', 'rgba(0, 0, 0, 0.04)');
            root.style.setProperty('--border-color', 'rgba(0, 0, 0, 0.08)');
            root.style.setProperty('--timeline-bg', 'rgba(0, 0, 0, 0.1)');
        } else {
            root.style.setProperty('--text-primary', '#f8fafc');
            root.style.setProperty('--text-secondary', '#94a3b8');
            root.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.05)');
            root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.11)');
            root.style.setProperty('--timeline-bg', 'rgba(255, 255, 255, 0.15)');
        }

        // Contraste sobre el Color de Marca (Botones)
        const brandContrast = getContrastYIQ(brand.primary_color);
        root.style.setProperty('--brand-contrast', brandContrast === 'black' ? '#000000' : '#ffffff');

        // Fondo dinámico Premium
        const bgDynamic = document.getElementById("bg-dynamic");
        if (bgDynamic) {
            bgDynamic.style.background = `radial-gradient(circle at 50% 50%, ${brand.primary_color}22 0%, ${bgColor} 100%)`;
        }
    }

    if (brand.footer_logos_url) {
        footerLogosImg.src = brand.footer_logos_url;
        footerLogosContainer.classList.remove("hidden");
    } else {
        footerLogosContainer.classList.add("hidden");
    }
}

function adjustColor(color, amount) {
    if(!color) return '#3b82f6';
    return '#' + color.replace(/^#/, '').replace(/../g, c => ('0'+Math.min(255, Math.max(0, parseInt(c, 16) + amount)).toString(16)).substring(-2));
}

function getContrastYIQ(hexcolor){
    hexcolor = hexcolor.replace("#", "");
    var r = parseInt(hexcolor.substr(0,2),16);
    var g = parseInt(hexcolor.substr(2,2),16);
    var b = parseInt(hexcolor.substr(4,2),16);
    var yiq = ((r*299)+(g*587)+(b*114))/1000;
    return (yiq >= 128) ? 'black' : 'white';
}

function setContentSource(lang) {
    currentLang = lang;
    
    if (storyData.content_type === 'pdf') {
        const url = (lang === 'ES') ? storyData.pdf_es_url : storyData.pdf_en_url;
        btnViewPdf.href = url;
        
        btnLangEs.classList.toggle("active", lang === 'ES');
        btnLangEn.classList.toggle("active", lang === 'EN');
    } else {
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

    updateTranscriptionText();
    updateLanguageUI();
}

function updateLanguageUI() {
    if (!storyData) return;

    const langSet = i18n[currentLang];
    
    // Page Title
    document.title = langSet.pageTitle;

    // Story Info
    storyTitle.innerText = (currentLang === 'EN' && storyData.title_en) 
        ? storyData.title_en 
        : storyData.title;

    // Transcription Button
    if (transcriptionWrapper.style.display !== 'none') {
        const isHidden = transcriptionContent.classList.contains("hidden");
        btnToggleTranscription.innerText = isHidden ? langSet.transcriptionShow : langSet.transcriptionHide;
    }

    if (storyData.content_type === 'pdf') {
        btnViewPdf.innerText = (currentLang === 'ES') ? "📄 Leer Documento" : "📄 Read Document";
    }
}

btnLangEs.addEventListener("click", () => setContentSource('ES'));
btnLangEn.addEventListener("click", () => setContentSource('EN'));

// Transcription
function setupTranscription() {
    const hasTranscription = storyData.transcription_es || storyData.transcription_en;
    if (!hasTranscription) return;

    transcriptionWrapper.style.display = 'block';
    updateTranscriptionText();

    btnToggleTranscription.addEventListener("click", () => {
        const isHidden = transcriptionContent.classList.contains("hidden");
        transcriptionContent.classList.toggle("hidden");
        
        const langSet = i18n[currentLang];
        btnToggleTranscription.innerText = !isHidden ? langSet.transcriptionShow : langSet.transcriptionHide;
    });
}

function updateTranscriptionText() {
    if (currentLang === 'ES') {
        transcriptionText.innerText = storyData.transcription_es || storyData.transcription_en || '';
    } else {
        transcriptionText.innerText = storyData.transcription_en || storyData.transcription_es || '';
    }
}

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

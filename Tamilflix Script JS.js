/* Tamilflix frontend — Supabase integration with Episode & 8-limit grid */
(function () {
"use strict";

const STORAGE_KEY = "tamilflix_titles";  
const MOVIES_TABLE = "movies";  
const LIST_KEY = "tamilflix_my_list";  

const demoTitles = [  
    {  
        id: "demo1",  
        title: "Spider-Man: No Way Home",  
        year: 2021,  
        category: "Marvel",  
        genre: "Action / Adventure",  
        rating: 8.2,  
        language: "English",  
        poster: "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",  
        backdrop: "https://image.tmdb.org/t/p/w1280/14QbnygCuTO0vl7CAFmPf1fgZfV.jpg",  
        description: "A young hero faces a world-changing challenge.",  
        video: ""  
    },  
    {  
        id: "demo2",  
        title: "Avengers: Endgame",  
        year: 2019,  
        category: "Marvel",  
        genre: "Action / Sci-Fi",  
        rating: 8.4,  
        language: "English",  
        poster: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",  
        backdrop: "https://image.tmdb.org/t/p/w1280/7RyHsO4ySX3R2w0II0L1lI1M4x8.jpg",  
        description: "The heroes unite for a final battle.",  
        video: ""  
    },  
    {  
        id: "demo3",  
        title: "Your Name",  
        year: 2016,  
        category: "Anime",  
        genre: "Animation / Romance",  
        rating: 8.4,  
        language: "Japanese",  
        poster: "https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgknONONX.jpg",  
        backdrop: "",  
        description: "Two teenagers discover a mysterious connection.",  
        video: ""  
    },  
    {  
        id: "demo4",  
        title: "Interstellar",  
        year: 2014,  
        category: "Movies",  
        genre: "Sci-Fi / Drama",  
        rating: 8.7,  
        language: "English",  
        poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",  
        backdrop: "",  
        description: "Explorers travel beyond the limits of known space.",  
        video: ""  
    },  
    {  
        id: "demo5",  
        title: "The Mandalorian",  
        year: 2019,  
        category: "Series",  
        genre: "Sci-Fi / Adventure",  
        rating: 8.6,  
        language: "English",  
        poster: "https://image.tmdb.org/t/p/w500/eU1i6eHXlzMOlEq0ku1Rzq7Y4wA.jpg",  
        backdrop: "",  
        description: "A lone bounty hunter navigates a dangerous galaxy.",  
        video: ""  
    },  
    {  
        id: "demo6",  
        title: "Demon Slayer",  
        year: 2019,  
        category: "Anime",  
        genre: "Anime / Action",  
        rating: 8.6,  
        language: "Japanese",  
        poster: "https://image.tmdb.org/t/p/w500/xUfRZu2mi8jH6SzQEJGP6gEMu3f.jpg",  
        backdrop: "",  
        description: "A young swordsman seeks a cure for his sister.",  
        video: ""  
    }  
];  

let titles = loadTitles();  
let heroIndex = 0;  
let heroTimer = null;  
let authMode = "login";  

const $ = id => document.getElementById(id);  

const LANGUAGES = ["Tamil", "Sinhala", "English", "Hindi", "Telugu"];  

function loadTitles() {  
    try {  
        const raw = localStorage.getItem(STORAGE_KEY);  
        return raw ? JSON.parse(raw) : demoTitles.slice();  
    } catch (error) {  
        return demoTitles.slice();  
    }  
}  

function saveTitles() {  
    localStorage.setItem(STORAGE_KEY, JSON.stringify(titles));  
}  

function mapDatabaseMovie(row) {  
    return {  
        id: row.id,  
        title: row.title || "",  
        year: row.year || "",  
        category: row.category || "Movies",  
        genre: row.genre || "",  
        rating: row.rating || "",  
        language: row.language || "Tamil",  
        poster: row.poster_url || row.poster || "",  
        backdrop: row.backdrop_url || row.backdrop || "",  
        description: row.description || "",  
        video: row.video_url || "",  
        languageVideos: row.language_videos || {},  
        episodes: row.episodes || [],  
        is_active: row.is_active  
    };  
}  

async function loadMoviesFromDatabase() {  
    const client = window.supabaseClient;  
    if (!client) return;  

    const { data, error } = await client  
        .from(MOVIES_TABLE)  
        .select("*")  
        .eq("is_active", true)  
        .order("created_at", { ascending: false });  

    if (error) return;  
    titles = (data || []).map(mapDatabaseMovie);  
    saveTitles();  
    render();  
}  

function escapeHtml(value) {  
    return String(value ?? "").replace(/[&<>"']/g, char => ({  
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"  
    })[char]);  
}  

function getList() {  
    try { return JSON.parse(localStorage.getItem(LIST_KEY) || "[]"); } catch (e) { return []; }  
}  
function setList(list) { localStorage.setItem(LIST_KEY, JSON.stringify(list)); }  

function toast(message) {  
    const element = $("toast");  
    if (!element) return;  
    element.textContent = message;  
    element.classList.remove("hidden");  
    clearTimeout(toast.timer);  
    toast.timer = setTimeout(() => element.classList.add("hidden"), 2600);  
}  

function posterFallback(title) {  
    return "https://placehold.co/500x750/151927/ffffff?text=" + encodeURIComponent(title || "Tamilflix");  
}  
function posterFor(item) { return item.poster || posterFallback(item.title); }  

function card(item) {  
    return `  
        <article class="movie-card" data-movie-id="${escapeHtml(item.id)}">  
            <div class="poster-wrap">  
                <img loading="lazy" src="${escapeHtml(posterFor(item))}" alt="${escapeHtml(item.title)} poster" onerror="this.onerror=null;this.src='${posterFallback(item.title)}'">  
                <div class="card-overlay">  
                    <button type="button" data-open-movie="${escapeHtml(item.id)}" aria-label="View ${escapeHtml(item.title)}">▶</button>  
                    <button type="button" data-list-movie="${escapeHtml(item.id)}" aria-label="Add to List">♡</button>  
                </div>  
            </div>  
            <h3>${escapeHtml(item.title)}</h3>  
            <div class="movie-meta">  
                <span>${escapeHtml(item.year || "—")} · ${escapeHtml(item.category || "Movies")}</span>  
                <span class="rating">★ ${escapeHtml(item.rating || "—")}</span>  
            </div>  
        </article>  
    `;  
}  

function renderGrid(id, items, showAll = false) {  
    const element = $(id);  
    if (!element) return;  
    const displayItems = showAll ? items : items.slice(0, 8);  
    element.innerHTML = displayItems.length  
        ? displayItems.map(card).join("")  
        : '<div class="empty-state">No titles here yet.</div>';  
}  

let viewAllStates = { trendingGrid: false, marvelGrid: false, animeGrid: false, seriesGrid: false, myListGrid: false };

function render() {  
    const search = ($("searchInput")?.value || "").trim().toLowerCase();  
    const visible = titles.filter(item => {  
        const searchable = [item.title, item.genre, item.category, item.language, item.year].join(" ").toLowerCase();  
        return !search || searchable.includes(search);  
    });  

    renderGrid("trendingGrid", visible.filter(item => !["Marvel", "Anime", "Series"].includes(item.category)), viewAllStates.trendingGrid);  
    renderGrid("marvelGrid", visible.filter(item => item.category === "Marvel"), viewAllStates.marvelGrid);  
    renderGrid("animeGrid", visible.filter(item => item.category === "Anime"), viewAllStates.animeGrid);  
    renderGrid("seriesGrid", visible.filter(item => item.category === "Series"), viewAllStates.seriesGrid);  

    const list = getList();  
    renderGrid("myListGrid", visible.filter(item => list.includes(String(item.id))), viewAllStates.myListGrid);  
    renderHero();  
}  

document.addEventListener("click", event => {  
    const viewAllBtn = event.target.closest("[data-show-all]");  
    if (viewAllBtn) {  
        const category = viewAllBtn.dataset.showAll;  
        if (category === "all") {  
            viewAllStates.trendingGrid = !viewAllStates.trendingGrid;  
            viewAllBtn.textContent = viewAllStates.trendingGrid ? "Show less ←" : "View all →";  
        } else if (category === "Marvel") {  
            viewAllStates.marvelGrid = !viewAllStates.marvelGrid;  
            viewAllBtn.textContent = viewAllStates.marvelGrid ? "Show less ←" : "View all →";  
        } else if (category === "Anime") {  
            viewAllStates.animeGrid = !viewAllStates.animeGrid;  
            viewAllBtn.textContent = viewAllStates.animeGrid ? "Show less ←" : "View all →";  
        } else if (category === "Series") {  
            viewAllStates.seriesGrid = !viewAllStates.seriesGrid;  
            viewAllBtn.textContent = viewAllStates.seriesGrid ? "Show less ←" : "View all →";  
        }  
        render();  
        return;  
    }  

    const open = event.target.closest("[data-open-movie]");  
    if (open) { openMovie(open.dataset.openMovie); return; }  

    const add = event.target.closest("[data-list-movie]");  
    if (add) { toggleList(add.dataset.listMovie); return; }  

    const play = event.target.closest("[data-play-movie]");  
    if (play) {  
        const item = titles.find(m => String(m.id) === play.dataset.playMovie);  
        if (!item) return;  
        
        let videoUrl = item.video;
        const episodeSelect = $("episodeSelect");
        if (episodeSelect && item.episodes && item.episodes.length > 0) {
            const selectedEp = item.episodes[episodeSelect.value];
            if (selectedEp && selectedEp.video) videoUrl = selectedEp.video;
        }

        if (videoUrl) {  
            window.TamilflixPlayer?.open({ ...item, video: videoUrl });  
        } else {  
            toast("Video URL unavailable for this selection.");  
        }  
        return;  
    }  
});  

function openMovie(id) {  
    const item = titles.find(movie => String(movie.id) === String(id));  
    if (!item) return;  

    const details = $("movieDetails");  
    if (!details) return;  

    let episodesHtml = "";
    if (item.episodes && item.episodes.length > 0) {
        episodesHtml = `
            <label class="language-heading" for="episodeSelect">Select Episode</label>
            <select id="episodeSelect" class="language-choice" style="width:100%; margin-bottom:12px;">
                ${item.episodes.map((ep, idx) => `<option value="${idx}">${escapeHtml(ep.title || 'Episode ' + (idx + 1))}</option>`).join("")}
            </select>
        `;
    }  

    details.innerHTML = `  
        <div class="movie-detail-layout">  
            <img src="${escapeHtml(posterFor(item))}" alt="${escapeHtml(item.title)} poster">  
            <div>  
                <span class="movie-badge">${escapeHtml(item.category || "Movie")}</span>  
                <h2>${escapeHtml(item.title)}</h2>  
                <p class="movie-meta">${escapeHtml(item.year || "")} &nbsp; ★ ${escapeHtml(item.rating || "—")}</p>  
                <p>${escapeHtml(item.description || "No description available.")}</p>  
                
                ${episodesHtml}  

                <div class="detail-actions detail-actions-stacked" style="margin-top:15px;">  
                    <button class="watch-download-btn" data-play-movie="${escapeHtml(item.id)}">▶ WATCH NOW</button>  
                    <button class="btn btn-ghost" data-list-movie="${escapeHtml(item.id)}">♡ Add to My List</button>  
                </div>  
            </div>  
        </div>  
    `;  
    $("movieModal")?.classList.remove("hidden");  
}  

function toggleList(id) {  
    id = String(id);  
    let list = getList();  
    if (list.includes(id)) {  
        list = list.filter(item => item !== id);  
        toast("Removed from My List");  
    } else {  
        list.push(id);  
        toast("Added to My List");  
    }  
    setList(list);  
    render();  
}  

function renderHero() {  
    const featured = titles.filter(item => item.poster);  
    if (!featured.length) return;  
    heroIndex = ((heroIndex % featured.length) + featured.length) % featured.length;  
    const item = featured[heroIndex];  
    if ($("heroTitle")) $("heroTitle").textContent = item.title;  
    if ($("heroDescription")) $("heroDescription").textContent = [item.year, item.genre, item.language].filter(Boolean).join(" • ") || "Movies • Series • Entertainment";  
    if ($("heroPoster")) $("heroPoster").src = posterFor(item);  
}  

render();  
loadMoviesFromDatabase();
})();
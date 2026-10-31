/* Tamilflix frontend — Supabase integration */
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

const LANGUAGES = [  
    "Tamil",  
    "Sinhala",  
    "English",  
    "Hindi",  
    "Telugu"  
];  

function loadTitles() {  
    try {  
        const raw = localStorage.getItem(STORAGE_KEY);  
        return raw ? JSON.parse(raw) : demoTitles.slice();  
    } catch (error) {  
        return demoTitles.slice();  
    }  
}  

function saveTitles() {  
    localStorage.setItem(  
        STORAGE_KEY,  
        JSON.stringify(titles)  
    );  
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
        is_active: row.is_active  
    };  
}  

async function loadMoviesFromDatabase() {  
    const client = window.supabaseClient;  

    if (!client) {  
        console.error(  
            "Tamilflix: Supabase client unavailable."  
        );  
        return;  
    }  

    const { data, error } = await client  
        .from(MOVIES_TABLE)  
        .select("*")  
        .eq("is_active", true)  
        .order("created_at", { ascending: false });  

    if (error) {  
        console.error(  
            "Could not load movies:",  
            error.message  
        );  

        toast(  
            "Movies could not be loaded. Please check Supabase."  
        );  
        return;  
    }  

    titles = (data || []).map(mapDatabaseMovie);  

    saveTitles();  
    render();  

    console.log(  
        "Tamilflix: Loaded movies from Supabase:",  
        titles.length  
    );  
}  

function escapeHtml(value) {  
    return String(value ?? "").replace(/[&<>"']/g, char => ({  
        "&": "&amp;",  
        "<": "&lt;",  
        ">": "&gt;",  
        '"': "&quot;",  
        "'": "&#39;"  
    })[char]);  
}  

function getList() {  
    try {  
        return JSON.parse(  
            localStorage.getItem(LIST_KEY) || "[]"  
        );  
    } catch (error) {  
        return [];  
    }  
}  

function setList(list) {  
    localStorage.setItem(  
        LIST_KEY,  
        JSON.stringify(list)  
    );  
}  

function toast(message) {  
    const element = $("toast");  

    if (!element) return;  

    element.textContent = message;  
    element.classList.remove("hidden");  

    clearTimeout(toast.timer);  

    toast.timer = setTimeout(() => {  
        element.classList.add("hidden");  
    }, 2600);  
}  

function posterFallback(title) {  
    return "https://placehold.co/500x750/151927/ffffff?text=" +  
        encodeURIComponent(title || "Tamilflix");  
}  

function posterFor(item) {  
    return item.poster || posterFallback(item.title);  
}  

function languageVideos(item) {  
    const saved = { ...(item.languageVideos || {}) };  

    if (  
        item.video &&  
        !Object.values(saved).some(Boolean)  
    ) {  
        saved[item.language || "English"] = item.video;  
    }  

    return saved;  
}  

function videoFor(item, language) {  
    return languageVideos(item)[language] || "";  
}  

function firstAvailableLanguage(item) {  
    const urls = languageVideos(item);  

    return LANGUAGES.find(language => urls[language]) ||  
        item.language ||  
        "Tamil";  
}  

function card(item) {  
    return `  
        <article  
            class="movie-card"  
            data-movie-id="${escapeHtml(item.id)}"  
        >  
            <div class="poster-wrap">  
                <img  
                    loading="lazy"  
                    src="${escapeHtml(posterFor(item))}"  
                    alt="${escapeHtml(item.title)} poster"  
                    onerror="this.onerror=null;this.src='${posterFallback(item.title)}'"  
                >  

                <div class="card-overlay">  
                    <button  
                        type="button"  
                        data-open-movie="${escapeHtml(item.id)}"  
                        aria-label="View ${escapeHtml(item.title)}"  
                    >▶</button>  

                    <button  
                        type="button"  
                        data-list-movie="${escapeHtml(item.id)}"  
                        aria-label="Add ${escapeHtml(item.title)} to My List"  
                    >♡</button>  
                </div>  
            </div>  

            <h3>${escapeHtml(item.title)}</h3>  

            <div class="movie-meta">  
                <span>  
                    ${escapeHtml(item.year || "—")}  
                    · ${escapeHtml(item.category || "Movies")}  
                </span>  

                <span class="rating">  
                    ★ ${escapeHtml(item.rating || "—")}  
                </span>  
            </div>  
        </article>  
    `;  
}  

function renderGrid(id, items) {  
    const element = $(id);  

    if (!element) return;  

    element.innerHTML = items.length  
        ? items.map(card).join("")  
        : '<div class="empty-state">No titles here yet.</div>';  
}  

function render() {  
    const search = (  
        $("searchInput")?.value || ""  
    ).trim().toLowerCase();  

    const visible = titles.filter(item => {  
        const searchable = [  
            item.title,  
            item.genre,  
            item.category,  
            item.language,  
            item.year  
        ].join(" ").toLowerCase();  

        return !search || searchable.includes(search);  
    });  

    renderGrid(  
        "trendingGrid",  
        visible.filter(item =>  
            item.category !== "Marvel" &&  
            item.category !== "Anime" &&  
            item.category !== "Series"  
        ).slice(0, 12)  
    );  

    renderGrid(  
        "marvelGrid",  
        visible.filter(item => item.category === "Marvel")  
    );  

    renderGrid(  
        "animeGrid",  
        visible.filter(item => item.category === "Anime")  
    );  

    renderGrid(  
        "seriesGrid",  
        visible.filter(item => item.category === "Series")  
    );  

    const list = getList();  

    renderGrid(  
        "myListGrid",  
        visible.filter(item =>  
            list.includes(String(item.id))  
        )  
    );  

    renderHero();  

    if (window.TamilflixAdmin?.renderAdminList) {  
        window.TamilflixAdmin.renderAdminList();  
    }  
}  

function renderHero() {  
    const featured = titles.filter(item => item.poster);  

    if (!featured.length) return;  

    heroIndex = (  
        (heroIndex % featured.length) + featured.length  
    ) % featured.length;  

    const item = featured[heroIndex];  

    if ($("heroTitle")) {  
        $("heroTitle").textContent = item.title;  
    }  

    if ($("heroDescription")) {  
        $("heroDescription").textContent = [  
            item.year,  
            item.genre,  
            item.language  
        ].filter(Boolean).join(" • ") ||  
            "Movies • Series • Entertainment";  
    }  

    if ($("heroPoster")) {  
        $("heroPoster").src = posterFor(item);  
    }  

    const hero = document.querySelector(".hero");  

    if (hero && item.backdrop) {  
        hero.style.backgroundImage =  
            `linear-gradient(90deg,rgba(17,20,33,.97),rgba(17,20,33,.78)),url("${item.backdrop}")`;  
    }  

    const dots = $("carouselDots");  

    if (dots) {  
        dots.innerHTML = featured.slice(0, 8).map((item, index) => `  
            <button  
                class="${index === heroIndex ? "active" : ""}"  
                data-hero-index="${index}"  
                aria-label="Show featured title ${index + 1}"  
            ></button>  
        `).join("");  
    }  
}  

function startCarousel() {  
    clearInterval(heroTimer);  

    heroTimer = setInterval(() => {  
        heroIndex++;  
        renderHero();  
    }, 5000);  
}  

function openMovie(id) {  
    const item = titles.find(  
        movie => String(movie.id) === String(id)  
    );  

    if (!item) return;  

    const active = firstAvailableLanguage(item);  

    const languageButtons = LANGUAGES.map(language => `  
        <button  
            type="button"  
            class="language-choice ${language === active ? "selected" : ""}"  
            data-select-language="${language}"  
            aria-pressed="${language === active}"  
            ${videoFor(item, language)  
                ? ""  
                : 'disabled title="Video not added yet"'}  
        >  
            ${language}${videoFor(item, language)  
                ? ""  
                : " · unavailable"}  
        </button>  
    `).join("");  

    const details = $("movieDetails");  

    if (!details) return;  

    details.dataset.movieId = String(item.id);  
    details.dataset.selectedLanguage = active;  

    details.innerHTML = `  
        <div class="movie-detail-layout">  
            <img  
                src="${escapeHtml(posterFor(item))}"  
                alt="${escapeHtml(item.title)} poster"  
                onerror="this.onerror=null;this.src='${posterFallback(item.title)}'"  
            >  

            <div>  
                <span class="movie-badge">  
                    ${escapeHtml(item.category || "Movie")}  
                </span>  

                <h2>${escapeHtml(item.title)}</h2>  

                <p class="movie-meta">  
                    ${escapeHtml(item.year || "")}  
                    &nbsp; ★ ${escapeHtml(item.rating || "—")}  
                </p>  

                <p>  
                    ${escapeHtml(item.description || "No description available.")}  
                </p>  

                <h3 class="language-heading">Choose language</h3>  

                <div class="language-choices">  
                    ${languageButtons}  
                </div>  

                <p  
                    class="selected-language-note"  
                    id="selectedLanguageNote"  
                >  
                    Selected: ${escapeHtml(active)}  
                    ${videoFor(item, active)  
                        ? ""  
                        : " — video URL not added yet"}  
                </p>  

                <div class="detail-actions detail-actions-stacked">  
                    <button  
                        class="watch-download-btn"  
                        data-play-movie="${escapeHtml(item.id)}"  
                    >▶ WATCH NOW</button>  

                    <button  
                        class="watch-download-btn"  
                        data-download-movie="${escapeHtml(item.id)}  
                    >⬇ DOWNLOAD</button>  

                    <button  
                        class="btn btn-ghost"  
                        data-list-movie="${escapeHtml(item.id)}"  
                    >♡ Add to My List</button>  
                </div>  

                <p class="muted">  
                    Use only authorised video URLs.  
                    Download availability depends on the video host.  
                </p>  
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

function showAuth(mode) {  
    authMode = mode;  

    if ($("authTitle")) {  
        $("authTitle").textContent =  
            mode === "login"  
                ? "Login to Tamilflix"  
                : "Create your Tamilflix account";  
    }  

    if ($("authSubmit")) {  
        $("authSubmit").textContent =  
            mode === "login" ? "Login" : "Register";  
    }  

    if ($("authSwitchText")) {  
        $("authSwitchText").textContent =  
            mode === "login"  
                ? "New to Tamilflix?"  
                : "Already have an account?";  
    }  

    if ($("authSwitch")) {  
        $("authSwitch").textContent =  
            mode === "login" ? "Create account" : "Login";  
    }  

    if ($("authMessage")) {  
        $("authMessage").textContent = "";  
    }  

    $("authModal")?.classList.remove("hidden");  
}  

async function submitAuth(event) {  
    event.preventDefault();  

    const email = $("authEmail")?.value;  
    const password = $("authPassword")?.value;  
    const client = window.supabaseClient;  

    try {  
        if (!client?.auth) {  
            throw new Error("Supabase Auth is unavailable.");  
        }  

        const result = authMode === "login"  
            ? await client.auth.signInWithPassword({  
                email,  
                password  
            })  
            : await client.auth.signUp({  
                email,  
                password  
            });  

        if (result.error) {  
            throw result.error;  
        }  

        if (authMode === "login" && result.data?.user) {  
            updateAuthUI(result.data.user);  

            $("authModal")?.classList.add("hidden");  

            toast("Login successful!");  

            await loadMoviesFromDatabase();  
        } else if ($("authMessage")) {  
            $("authMessage").textContent =  
                "Check your email if confirmation is enabled.";  
        }  
    } catch (error) {  
        if ($("authMessage")) {  
            $("authMessage").textContent =  
                error.message || "Authentication failed.";  
        }  
    }  
}  

function updateAuthUI(user) {  
    const authButtons = $("authButtons");  
    const userAccount = $("userAccount");  
    const userEmail = $("userEmail");  
    const adminButton = $("openAdminBtn");  

    // Keep your existing administrator email.  
    const ADMIN_EMAIL = "jayantatilan@gmail.com";  

    if (user) {  
        authButtons?.classList.add("hidden");  
        userAccount?.classList.remove("hidden");  

        if (userEmail) {  
            userEmail.textContent = user.email || "My Account";  
        }  
    } else {  
        authButtons?.classList.remove("hidden");  
        userAccount?.classList.add("hidden");  

        if (userEmail) {  
            userEmail.textContent = "";  
        }  
    }  

    const isAdmin =  
        Boolean(user?.email) &&  
        user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();  

    adminButton?.classList.toggle("hidden", !isAdmin);  
}  

async function initialiseAuth() {  
    const client = window.supabaseClient;  

    if (!client?.auth) {  
        console.error("Tamilflix: Supabase Auth is unavailable.");  
        return;  
    }  

    const { data, error } = await client.auth.getSession();  

    if (error) {  
        console.error("Unable to restore session:", error.message);  
        return;  
    }  

    updateAuthUI(data.session?.user || null);  

    client.auth.onAuthStateChange((_event, session) => {  
        updateAuthUI(session?.user || null);  
    });  
}  

$("logoutBtn")?.addEventListener("click", async () => {  
    const client = window.supabaseClient;  

    if (!client?.auth) {  
        toast("Supabase Auth is unavailable.");  
        return;  
    }  

    const { error } = await client.auth.signOut();  

    if (error) {  
        toast(error.message || "Logout failed.");  
        return;  
    }  

    updateAuthUI(null);  
    toast("Logged out successfully.");  
});  

$("openAdminBtn")?.addEventListener("click", () => {  
    const userEmail = $("userEmail")  
        ?.textContent  
        ?.trim()  
        .toLowerCase();  

    if (userEmail !== "jayantatilan@gmail.com") {  
        toast("Admin access denied.");  
        return;  
    }  

    if (window.TamilflixAdmin?.open) {  
        window.TamilflixAdmin.open();  
    } else {  
        toast("Admin panel is loading. Please refresh.");  
    }  
});  

document.addEventListener("click", event => {  
    const close = event.target.closest("[data-close]");  

    if (close) {  
        $(close.dataset.close)?.classList.add("hidden");  
        return;  
    }  

    const open = event.target.closest("[data-open-movie]");  

    if (open) {  
        openMovie(open.dataset.openMovie);  
        return;  
    }  

    const add = event.target.closest("[data-list-movie]");  

    if (add) {  
        toggleList(add.dataset.listMovie);  
        return;  
    }  

    const language = event.target.closest("[data-select-language]");  

    if (language) {  
        if (language.disabled) return;  

        const details = $("movieDetails");  

        const item = titles.find(  
            movie => String(movie.id) === details?.dataset.movieId  
        );  

        if (!item || !details) return;  

        details.dataset.selectedLanguage =  
            language.dataset.selectLanguage;  

        details.querySelectorAll("[data-select-language]")  
            .forEach(button => {  
                const selected = button === language;  

                button.classList.toggle("selected", selected);  

                button.setAttribute(  
                    "aria-pressed",  
                    selected ? "true" : "false"  
                );  
            });  

        const note = $("selectedLanguageNote");  

        if (note) {  
            const selectedLanguage =  
                details.dataset.selectedLanguage;  

            note.textContent =  
                "Selected: " + selectedLanguage +  
                (videoFor(item, selectedLanguage)  
                    ? ""  
                    : " — video URL not added yet");  
        }  

        return;  
    }  

    const play = event.target.closest("[data-play-movie]");  

    if (play) {  
        const item = titles.find(  
            movie => String(movie.id) === play.dataset.playMovie  
        );  

        if (!item) return;  

        const language =  
            $("movieDetails")?.dataset.selectedLanguage ||  
            firstAvailableLanguage(item);  

        const video = videoFor(item, language);  

        if (video) {  
            window.TamilflixPlayer?.open({  
                ...item,  
                video,  
                language  
            });  

            if (!window.TamilflixPlayer?.open) {  
                window.open(video, "_blank", "noopener,noreferrer");  
            }  
        } else {  
            toast("Add an authorised video URL for this language.");  
        }  

        return;  
    }  

    const download = event.target.closest("[data-download-movie]");  

    if (download) {  
        const item = titles.find(  
            movie => String(movie.id) === download.dataset.downloadMovie  
        );  

        if (!item) return;  

        const language =  
            $("movieDetails")?.dataset.selectedLanguage ||  
            firstAvailableLanguage(item);  

        const video = videoFor(item, language);  

        if (!video) {  
            toast("No video URL is available for this language.");  
            return;  
        }  

        window.open(video, "_blank", "noopener,noreferrer");  
        return;  
    }  

    const dot = event.target.closest("[data-hero-index]");  

    if (dot) {  
        heroIndex = Number(dot.dataset.heroIndex);  
        renderHero();  
        startCarousel();  
    }  
});  

$("searchForm")?.addEventListener("submit", event => {  
    event.preventDefault();  
    render();  

    document.querySelector("#movies")?.scrollIntoView({  
        behavior: "smooth"  
    });  
});  

$("searchInput")?.addEventListener("input", render);  

$("prevSlide")?.addEventListener("click", () => {  
    heroIndex--;  
    renderHero();  
    startCarousel();  
});  

$("nextSlide")?.addEventListener("click", () => {  
    heroIndex++;  
    renderHero();  
    startCarousel();  
});  

$("heroExplore")?.addEventListener("click", () => {  
    $("movies")?.scrollIntoView({ behavior: "smooth" });  
});  

$("heroInfo")?.addEventListener("click", () => {  
    if (titles.length) {  
        openMovie(titles[heroIndex % titles.length].id);  
    }  
});  

$("loginBtn")?.addEventListener("click", () => {  
    showAuth("login");  
});  

$("registerBtn")?.addEventListener("click", () => {  
    showAuth("register");  
});  

$("authSwitch")?.addEventListener("click", () => {  
    showAuth(authMode === "login" ? "register" : "login");  
});  

$("authForm")?.addEventListener("submit", submitAuth);  

$("menuToggle")?.addEventListener("click", () => {  
    $("mainNav")?.classList.toggle("open");  
});  

document.addEventListener("keydown", event => {  
    if (event.key === "Escape") {  
        document.querySelectorAll(".modal").forEach(modal => {  
            modal.classList.add("hidden");  
        });  
    }  
});  

window.TamilflixApp = {  
    get titles() {  
        return titles;  
    },  

    setTitles(next) {  
        if (!Array.isArray(next)) return;  

        titles = next;  
        saveTitles();  
        render();  
    },  

    saveTitles,  
    render,  
    toast,  
    openMovie,  
    loadMoviesFromDatabase  
};  

render();  
startCarousel();  
initialiseAuth();  
loadMoviesFromDatabase();

})();

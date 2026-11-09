
/* ==========================================
   TAMILFLIX - APP.JS
   PART 1 / 3
   CORE + MOVIES + SHOWS + PLAYER
========================================== */

(() => {
  "use strict";

  const $ = id => document.getElementById(id);

  const TABLES = {
    movies: "movies",
    shows: "tamilflix_shows",
    episodes: "tamilflix_episodes",
    admins: "tamilflix_admins",
    requests: "movie_requests"
  };

  const LIST_KEY = "tamilflix_my_list";

  let client = null;
  let movies = [];
  let shows = [];
  let currentUser = null;
  let heroIndex = 0;

  const expanded = {};

  /* HELPERS */

  function safeURL(value) {
    if (!value) return "";

    try {
      const url = new URL(value, location.href);

      return ["http:", "https:"].includes(url.protocol)
        ? url.href
        : "";
    } catch {
      return "";
    }
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function showModal(id) {
    $(id)?.classList.remove("hidden");
  }

  function hideModal(id) {
    $(id)?.classList.add("hidden");

    if (id === "playerModal") {
      const video = $("videoPlayer");

      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
    }
  }

  /* MY LIST */

  function getList() {
    try {
      const list = JSON.parse(
        localStorage.getItem(LIST_KEY) || "[]"
      );

      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function itemKey(item) {
    return `${item.kind || "movie"}:${item.id}`;
  }

  function findItem(key) {
    const [kind, ...parts] = String(key).split(":");
    const id = parts.join(":");

    return kind === "show"
      ? shows.find(item => String(item.id) === id)
      : movies.find(item => String(item.id) === id);
  }

  function isSaved(item) {
    return getList().includes(itemKey(item));
  }

  function toggleSaved(item) {
    const key = itemKey(item);
    const list = getList();

    const updated = list.includes(key)
      ? list.filter(value => value !== key)
      : [...list, key];

    localStorage.setItem(
      LIST_KEY,
      JSON.stringify(updated)
    );

    renderAll();
  }

  /* NORMALISE DATA */

  function normaliseMovie(row) {
    return {
      ...row,
      kind: "movie",
      category: "movies"
    };
  }

  function normaliseShow(row) {
    return {
      ...row,
      kind: "show",
      category: String(
        row.category || "series"
      ).toLowerCase()
    };
  }

  /* MOVIE CARD */

  function card(item) {
    const poster = safeURL(
      item.poster_url || item.thumbnail_url
    );

    const title = escapeHTML(
      item.title || "Untitled"
    );

    const year = item.year
      ? escapeHTML(item.year)
      : "";

    const language = escapeHTML(
      item.language || ""
    );

    const rating =
      item.rating !== null &&
      item.rating !== undefined &&
      item.rating !== ""
        ? `<span class="rating">★ ${escapeHTML(item.rating)}</span>`
        : "";

    const key = escapeHTML(itemKey(item));

    const image = poster
      ? `<img src="${escapeHTML(poster)}" alt="${title}" loading="lazy">`
      : `<div class="empty">Poster unavailable</div>`;

    return `
      <article class="movie-card"
        data-item-key="${key}">

        <div class="poster-wrap">
          ${image}

          <div class="card-actions">

            <button class="round-btn"
              type="button"
              data-open-item="${key}"
              aria-label="View ${title}">
              ▶
            </button>

            <button class="round-btn"
              type="button"
              data-save-item="${key}"
              aria-label="My List">
              ${isSaved(item) ? "♥" : "♡"}
            </button>

          </div>
        </div>

        <h3>${title}</h3>

        <div class="meta">
          <span>
            ${year}${year && language ? " · " : ""}${language}
          </span>
          ${rating}
        </div>

      </article>
    `;
  }

  /* CATEGORY GRID */

  function renderGrid(id, items, category) {
    const element = $(id);

    if (!element) return;

    const query = (
      $("searchInput")?.value || ""
    ).trim().toLowerCase();

    const filtered = items.filter(item => {
      const text = [
        item.title,
        item.description,
        item.genre,
        item.language
      ].join(" ").toLowerCase();

      return !query || text.includes(query);
    });

    const isExpanded = !!expanded[category];

    const visible = isExpanded
      ? filtered
      : filtered.slice(0, 8);

    element.innerHTML = visible.length
      ? visible.map(card).join("")
      : `<div class="empty">${
          query
            ? "No matching titles found."
            : "No content available yet."
        }</div>`;

    const button = document.querySelector(
      `[data-viewall="${category}"]`
    );

    if (button) {
      button.hidden = filtered.length <= 8;

      button.textContent = isExpanded
        ? "Show less ↑"
        : "View all →";
    }
  }

  /* MY LIST GRID */

  function renderMyList() {
    const element = $("myListGrid");

    if (!element) return;

    const items = getList()
      .map(findItem)
      .filter(Boolean);

    element.innerHTML = items.length
      ? items.map(card).join("")
      : '<div class="empty">Your saved titles will appear here.</div>';
  }

  /* HERO */

  function renderHero() {
    const candidates = [...movies, ...shows]
      .filter(item =>
        item.backdrop_url || item.poster_url
      );

    if (!candidates.length) return;

    const item = candidates[
      heroIndex % candidates.length
    ];

    if ($("heroTitle")) {
      $("heroTitle").textContent =
        item.title || "Tamilflix";
    }

    if ($("heroMeta")) {
      $("heroMeta").textContent = [
        item.year,
        item.language,
        item.genre || item.category
      ].filter(Boolean).join(" · ");
    }

    const backdrop = safeURL(
      item.backdrop_url || item.poster_url
    );

    if ($("hero") && backdrop) {
      $("hero").style.backgroundImage =
        `linear-gradient(90deg,#0a0c15 0%,rgba(10,12,21,.85) 48%,rgba(10,12,21,.3)),url("${backdrop}")`;
    }

    if ($("heroInfo")) {
      $("heroInfo").onclick = () =>
        openDetails(item);
    }
  }
/* HERO AUTO SLIDER */

let heroTimer = null;

function startHeroSlider() {
  if (heroTimer) {
    clearInterval(heroTimer);
  }

  heroTimer = setInterval(() => {
    const candidates = [...movies, ...shows]
      .filter(item => item.backdrop_url || item.poster_url);

    if (candidates.length <= 1) return;

    heroIndex = (heroIndex + 1) % candidates.length;

    renderHero();
  }, 5000);
       }
  /* MAIN RENDER */

  function renderAll() {
    renderGrid(
      "movieGrid",
      movies,
      "movies"
    );

    renderGrid(
      "marvelGrid",
      shows.filter(item =>
        item.category === "marvel"
      ),
      "marvel"
    );

    renderGrid(
      "animeGrid",
      shows.filter(item =>
        item.category === "anime"
      ),
      "anime"
    );

    renderGrid(
      "seriesGrid",
      shows.filter(item =>
        item.category === "series"
      ),
      "series"
    );

    renderGrid(
      "bigbossGrid",
      shows.filter(item =>
        item.category === "bigboss"
      ),
      "bigboss"
    );

    renderMyList();
    renderHero();
    populateShowSelect();
  }

  /* DETAILS */

  function openDetails(item) {
    if (!item || !$("detailsContent")) return;

    const poster = safeURL(item.poster_url);
    const title = escapeHTML(
      item.title || "Untitled"
    );

    const isShow = item.kind === "show";

    $("detailsContent").innerHTML = `
      <div class="detail-layout">

        ${poster
          ? `<img src="${escapeHTML(poster)}" alt="${title}">`
          : ""}

        <div>
          <h2>${title}</h2>

          <p>
            ${escapeHTML(item.year || "")}
            ${item.language
              ? " · " + escapeHTML(item.language)
              : ""}
            ${item.genre
              ? " · " + escapeHTML(item.genre)
              : ""}
          </p>

          <p>
            ${escapeHTML(
              item.description ||
              "No description available."
            )}
          </p>

          ${!isShow && item.video_url
            ? '<button class="btn btn-primary" id="detailsPlayBtn">▶ Play</button>'
            : ""}

          <button class="btn btn-ghost"
            id="detailsSaveBtn">
            ${isSaved(item)
              ? "♥ Remove from My List"
              : "♡ My List"}
          </button>

          ${isShow
            ? '<div id="episodeList"></div>'
            : ""}

        </div>
      </div>
    `;

    $("detailsPlayBtn")?.addEventListener(
      "click",
      () => playVideo(
        item.video_url,
        item.title
      )
    );

    $("detailsSaveBtn")?.addEventListener(
      "click",
      () => {
        toggleSaved(item);
        openDetails(item);
      }
    );

    showModal("detailsModal");

    if (isShow) {
      renderEpisodes(item);
    }
  }

  /* VIDEO PLAYER */

  function playVideo(url, title) {
    const videoURL = safeURL(url);

    if (!videoURL) {
      alert("Video URL is not available.");
      return;
    }

    const video = $("videoPlayer");

    if (!video) return;

    if ($("playerCaption")) {
      $("playerCaption").textContent =
        title || "Tamilflix";
    }

    video.src = videoURL;
    video.load();

    showModal("playerModal");

    video.play().catch(() => {});
  }

  /* EPISODES */

  async function renderEpisodes(show) {
    const container = $("episodeList");

    if (!container || !client) return;

    container.innerHTML =
      "<p>Loading episodes...</p>";

    try {
      const { data, error } = await client
        .from(TABLES.episodes)
        .select("*")
        .eq("show_id", show.id)
        .order("season_number")
        .order("episode_number");

      if (error) throw error;

      if (!data?.length) {
        container.innerHTML =
          "<p>No episodes available yet.</p>";
        return;
      }

      const groups = {};

      data.forEach(ep => {
        const season = ep.season_number || 1;

        if (!groups[season]) {
          groups[season] = [];
        }

        groups[season].push(ep);
      });

      container.innerHTML =
        Object.entries(groups).map(
          ([season, list]) => `
            <div class="season-block">

              <h3>
                Season ${escapeHTML(season)}
              </h3>

              ${list.map(ep => `
                <div class="episode-row">

                  ${ep.thumbnail_url
                    ? `<img src="${escapeHTML(
                        safeURL(ep.thumbnail_url)
                      )}" alt="">`
                    : ""}

                  <button class="btn btn-ghost"
                    data-episode-id="${escapeHTML(ep.id)}">

                    Episode ${escapeHTML(
                      ep.episode_number || ""
                    )}

                    -
                    ${escapeHTML(
                      ep.episode_title || "Untitled"
                    )}

                    ▶
                  </button>

                </div>
              `).join("")}

            </div>
          `
        ).join("");

      container
        .querySelectorAll("[data-episode-id]")
        .forEach(button => {

          button.addEventListener(
            "click",
            () => {

              const ep = data.find(item =>
                String(item.id) ===
                button.dataset.episodeId
              );

              if (ep) {
                playVideo(
                  ep.video_url,
                  ep.episode_title
                );
              }
            }
          );
        });

    } catch (error) {
      console.error("Episode error:", error);

      container.innerHTML =
        "<p>Episodes could not be loaded.</p>";
    }
  }

  /* LOAD MOVIES */

  async function loadMovies() {
    const { data, error } = await client
      .from(TABLES.movies)
      .select("*")
      .eq("is_active", true)
      .order("created_at", {
        ascending: false
      });

    if (error) throw error;

    movies = (data || []).map(normaliseMovie);
  }

  /* LOAD SHOWS */

  async function loadShows() {
    try {
      const { data, error } = await client
        .from(TABLES.shows)
        .select("*")
        .order("created_at", {
          ascending: false
        });

      if (error) throw error;

      shows = (data || []).map(normaliseShow);

    } catch (error) {
      console.warn(
        "Shows unavailable:",
        error.message
      );

      shows = [];
    }
  }

  /* LOAD CONTENT */

  async function loadContent() {
    if (!client) return;

    try {
      await loadMovies();
      await loadShows();

      renderAll();

    } catch (error) {
      console.error(
        "Content loading:",
        error
      );

      if ($("movieGrid")) {
        $("movieGrid").innerHTML =
          '<div class="empty">Movies could not be loaded. Check Supabase table columns and permissions.</div>';
      }
    }
      }
         
  /* ==========================================
     PART 2 / 3
     VIEW ALL + SEARCH + AUTH + ADMIN
     + PUBLIC MOVIE REQUEST
  ========================================== */

  /* VIEW ALL */

  function setupViewAll() {
    document.querySelectorAll("[data-viewall]")
      .forEach(button => {
        button.addEventListener("click", () => {
          const category = button.dataset.viewall;

          if (!category) return;

          expanded[category] = !expanded[category];

          renderAll();
        });
      });
  }

  /* SEARCH */

  function setupSearch() {
    $("searchInput")?.addEventListener(
      "input",
      renderAll
    );
  }

  /* SHOW SELECT */

  function populateShowSelect() {
    const select = $("showSelect");

    if (!select) return;

    select.innerHTML = `
      <option value="">Select a show</option>
      ${shows.map(show => `
        <option value="${escapeHTML(show.id)}">
          ${escapeHTML(show.title)}
        </option>
      `).join("")}
    `;
  }

  /* AUTHENTICATION */

  function openAuth(mode) {
    const form = $("authForm");

    if (!form) return;

    form.dataset.mode = mode;

    if ($("authTitle")) {
      $("authTitle").textContent = mode;
    }

    if ($("authMessage")) {
      $("authMessage").textContent = "";
    }

    showModal("authModal");
  }

  async function updateAuthUI() {
    if (!client) return;

    try {
      const { data, error } =
        await client.auth.getUser();

      currentUser = error
        ? null
        : data?.user || null;

      const loggedIn = !!currentUser;

      if ($("userEmail")) {
        $("userEmail").textContent =
          currentUser?.email || "";

        $("userEmail").classList.toggle(
          "hidden",
          !loggedIn
        );
      }

      $("loginBtn")?.classList.toggle(
        "hidden",
        loggedIn
      );

      $("registerBtn")?.classList.toggle(
        "hidden",
        loggedIn
      );

      $("logoutBtn")?.classList.toggle(
        "hidden",
        !loggedIn
      );

      await checkAdmin();

    } catch (error) {
      console.error(
        "Auth UI error:",
        error
      );

      currentUser = null;

      $("adminBtn")?.classList.add("hidden");
    }
  }

  async function authSubmit(event) {
    event.preventDefault();

    const form = $("authForm");
    const message = $("authMessage");

    if (!client || !form) return;

    const button = form.querySelector(
      '[type="submit"]'
    );

    const email =
      $("authEmail")?.value.trim();

    const password =
      $("authPassword")?.value;

    const mode = form.dataset.mode;

    if (!email || !password) {
      if (message) {
        message.textContent =
          "Enter your email and password.";
      }

      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = "Please wait...";
    }

    if (message) {
      message.textContent = "";
    }

    try {
      let result;

      if (mode === "Register") {
        result = await client.auth.signUp({
          email,
          password
        });
      } else {
        result = await client.auth.signInWithPassword({
          email,
          password
        });
      }

      if (result.error) {
        throw result.error;
      }

      if (mode === "Register") {
        if (message) {
          message.textContent =
            "Account created. Check your email if confirmation is required.";
        }
      } else {
        hideModal("authModal");

        await updateAuthUI();
      }

    } catch (error) {
      if (message) {
        message.textContent =
          error.message || "Authentication failed.";
      }

    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Continue";
      }
    }
  }

  async function logout() {
    if (!client) return;

    try {
      const { error } =
        await client.auth.signOut();

      if (error) throw error;

      currentUser = null;

      await updateAuthUI();

    } catch (error) {
      alert("Logout failed: " + error.message);
    }
  }

  /* ADMIN VERIFICATION */

  async function checkAdmin() {
    const button = $("adminBtn");

    if (!button) return;

    button.classList.add("hidden");

    if (!client || !currentUser) return;

    if (
      currentUser.email?.toLowerCase() !==
      "jayantatilan@gmail.com"
    ) {
      return;
    }

    try {
      const { data, error } = await client
        .from(TABLES.admins)
        .select("user_id")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (error) throw error;

      button.classList.toggle(
        "hidden",
        !data
      );

    } catch (error) {
      console.error(
        "Admin verification error:",
        error
      );

      button.classList.add("hidden");
    }
  }

  function openAdmin() {
    if (!currentUser) {
      alert("Please login first.");
      return;
    }

    if ($("adminBtn")?.classList.contains("hidden")) {
      alert("Admin access denied.");
      return;
    }

    showModal("adminModal");
  }

  /* ADMIN MOVIE FORM */

  async function addMovie(event) {
    event.preventDefault();

    if (!client || !currentUser) return;

    const form = $("movieForm");

    if (!form) return;

    const get = name =>
      form.querySelector(
        `[name="${name}"]`
      )?.value.trim() || "";

    const movie = {
      title: get("title"),
      year: Number(get("year")) || null,
      language: get("language"),
      genre: get("genre"),
      poster_url: get("poster_url"),
      backdrop_url: get("backdrop_url"),
      video_url: get("video_url"),
      rating: Number(get("rating")) || null,
      description: get("description"),
      is_active: true
    };

    if (!movie.title) {
      alert("Enter movie title.");
      return;
    }

    try {
      const { error } = await client
        .from(TABLES.movies)
        .insert(movie);

      if (error) throw error;

      alert("Movie added successfully!");

      form.reset();

      await loadContent();

    } catch (error) {
      alert(
        "Movie could not be added: " +
        error.message
      );
    }
  }

  /* ADMIN SHOW FORM */

  async function addShow(event) {
    event.preventDefault();

    if (!client || !currentUser) return;

    const form = $("showForm");

    if (!form) return;

    const get = name =>
      form.querySelector(
        `[name="${name}"]`
      )?.value.trim() || "";

    const show = {
      title: get("title"),
      category: get("category"),
      year: Number(get("year")) || null,
      language: get("language"),
      poster_url: get("poster_url"),
      backdrop_url: get("backdrop_url"),
      description: get("description")
    };

    if (!show.title) {
      alert("Enter show title.");
      return;
    }

    try {
      const { error } = await client
        .from(TABLES.shows)
        .insert(show);

      if (error) throw error;

      alert("Show added successfully!");

      form.reset();

      await loadContent();

    } catch (error) {
      alert(
        "Show could not be added: " +
        error.message
      );
    }
  }

  /* ADMIN EPISODE FORM */

  async function addEpisode(event) {
    event.preventDefault();

    if (!client || !currentUser) return;

    const form = $("episodeForm");

    if (!form) return;

    const get = name =>
      form.querySelector(
        `[name="${name}"]`
      )?.value.trim() || "";

    const episode = {
      show_id: get("show_id"),
      season_number:
        Number(get("season_number")) || 1,
      season_title: get("season_title"),
      episode_number:
        Number(get("episode_number")) || 1,
      episode_title: get("episode_title"),
      thumbnail_url: get("thumbnail_url"),
      video_url: get("video_url")
    };

    if (!episode.show_id || !episode.video_url) {
      alert("Select a show and enter video URL.");
      return;
    }

    try {
      const { error } = await client
        .from(TABLES.episodes)
        .insert(episode);

      if (error) throw error;

      alert("Episode added successfully!");

      form.reset();

    } catch (error) {
      alert(
        "Episode could not be added: " +
        error.message
      );
    }
  }

  /* PUBLIC MOVIE REQUEST */

  async function submitMovieRequest(event) {
    event.preventDefault();

    const form = $("movieRequestForm");
    const message = $("movieRequestMessage");

    if (!client || !form) return;

    const title = $(
      "requestMovieTitle"
    )?.value.trim();

    const language = $(
      "requestMovieLanguage"
    )?.value.trim() || "";

    const details = $(
      "requestMovieDetails"
    )?.value.trim() || "";

    if (!title) {
      if (message) {
        message.textContent =
          "Please enter a movie title.";
      }

      return;
    }

    const button = form.querySelector(
      '[type="submit"]'
    );

    if (button) {
      button.disabled = true;
      button.textContent = "Sending...";
    }

    if (message) {
      message.textContent = "";
    }

    try {
      const { error } = await client
        .from(TABLES.requests)
        .insert({
          movie_title: title,
          language: language || null,
          details: details || null
        });

      if (error) throw error;

      if (message) {
        message.textContent =
          "Your movie request was submitted successfully!";
      }

      form.reset();

    } catch (error) {
      console.error(
        "Movie request error:",
        error
      );

      if (message) {
        message.textContent =
          "Request could not be submitted. Please try again.";
      }

    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Submit Request";
      }
    }
                }
        
  /* ==========================================
     PART 3 / 3
     BUTTON EVENTS + NAVIGATION
     + INITIALIZATION
  ========================================== */

  /* BUTTON EVENTS */

  function setupButtons() {
    $("loginBtn")?.addEventListener(
      "click",
      () => openAuth("Login")
    );

    $("registerBtn")?.addEventListener(
      "click",
      () => openAuth("Register")
    );

    $("logoutBtn")?.addEventListener(
      "click",
      logout
    );

    $("adminBtn")?.addEventListener(
      "click",
      openAdmin
    );

    $("authForm")?.addEventListener(
      "submit",
      authSubmit
    );

    $("movieForm")?.addEventListener(
      "submit",
      addMovie
    );

    $("showForm")?.addEventListener(
      "submit",
      addShow
    );

    $("episodeForm")?.addEventListener(
      "submit",
      addEpisode
    );

    $("movieRequestForm")?.addEventListener(
      "submit",
      submitMovieRequest
    );

    document.querySelectorAll("[data-close]")
      .forEach(button => {
        button.addEventListener("click", () => {
          hideModal(button.dataset.close);
        });
      });

    document.addEventListener("click", event => {
      const target = event.target;

      if (!(target instanceof Element)) return;

      const openButton = target.closest(
        "[data-open-item]"
      );

      if (openButton) {
        const item = findItem(
          openButton.dataset.openItem
        );

        if (item) openDetails(item);

        return;
      }

      const saveButton = target.closest(
        "[data-save-item]"
      );

      if (saveButton) {
        const item = findItem(
          saveButton.dataset.saveItem
        );

        if (item) toggleSaved(item);
      }
    });
  }

  /* MOBILE NAVIGATION */

  function setupNavigation() {
    $("menuBtn")?.addEventListener("click", () => {
      $("nav")?.classList.toggle("open");
    });

    $("nav")?.querySelectorAll("a")
      .forEach(link => {
        link.addEventListener("click", () => {
          $("nav")?.classList.remove("open");
        });
      });
  }

  /* ADMIN TABS */

  function setupAdminTabs() {
    document.querySelectorAll("[data-tab]")
      .forEach(button => {
        button.addEventListener("click", () => {

          document.querySelectorAll("[data-tab]")
            .forEach(tab => {
              tab.classList.toggle(
                "active",
                tab === button
              );
            });

          [
            "movieForm",
            "showForm",
            "episodeForm"
          ].forEach(id => {
            $(id)?.classList.toggle(
              "hidden",
              id !== button.dataset.tab
            );
          });
        });
      });
  }

  /* SUPABASE INITIALIZATION */

  async function initialize() {
    try {
      if (!window.supabase) {
        throw new Error(
          "Supabase library not loaded."
        );
      }

      const url =
        window.TAMILFLIX_SUPABASE_URL;

      const key =
        window.TAMILFLIX_SUPABASE_ANON_KEY;

      if (!url || !key) {
        throw new Error(
          "Supabase configuration missing."
        );
      }

      client = window.supabase.createClient(
        url,
        key
      );

      setupButtons();
      setupSearch();
      setupViewAll();
      setupNavigation();
      setupAdminTabs();

      await updateAuthUI();

      await loadContent();

      client.auth.onAuthStateChange(
        (_event, session) => {
          setTimeout(async () => {
            currentUser = session?.user || null;

            await updateAuthUI();
          }, 0);
        }
      );

      console.log(
        "Tamilflix initialized successfully."
      );

    } catch (error) {
      console.error(
        "Tamilflix initialization error:",
        error
      );

      if ($("movieGrid")) {
        $("movieGrid").innerHTML =
          `<div class="empty">${escapeHTML(
            error.message
          )}</div>`;
      }
    }
  }

  /* START APPLICATION */

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      { once: true }
    );
  } else {
    initialize();
  }

})();
                              

/* Tamilflix app.js */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const TABLES = {
    movies: "movies",
    shows: "tamilflix_shows",
    seasons: "tamilflix_seasons",
    episodes: "tamilflix_episodes",
    admins: "tamilflix_admins"
  };

  const LIST_KEY = "tamilflix_my_list";

  let client = null;
  let movies = [];
  let shows = [];
  let seasons = [];
  let episodes = [];
  let currentUser = null;
  let heroIndex = 0;

  const expanded = {};

  function setMessage(target, message, isError = false) {
    if (!target) return;
    target.textContent = message || "";
    target.classList.toggle("error", !!isError);
  }

  function showModal(id) {
    const el = $(id);
    if (el) el.classList.remove("hidden");
  }

  function hideModal(id) {
    const el = $(id);
    if (el) el.classList.add("hidden");

    if (id === "playerModal") {
      const video = $("videoPlayer");

      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
    }
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function safeURL(value) {
    if (!value) return "";

    try {
      const url = new URL(value, window.location.href);

      return ["http:", "https:"].includes(url.protocol)
        ? url.href
        : "";
    } catch {
      return "";
    }
  }

  function getList() {
    try {
      const value = JSON.parse(
        localStorage.getItem(LIST_KEY) || "[]"
      );

      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function saveList(list) {
    localStorage.setItem(
      LIST_KEY,
      JSON.stringify(list)
    );

    renderMyList();
  }

  function itemKey(item) {
    return `${item.kind || "movie"}:${item.id}`;
  }

  function isSaved(item) {
    return getList().includes(itemKey(item));
  }

  function toggleSaved(item) {
    const list = getList();
    const key = itemKey(item);

    saveList(
      list.includes(key)
        ? list.filter((x) => x !== key)
        : [...list, key]
    );

    renderAll();
  }

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

  function card(item) {
    const poster = safeURL(
      item.poster_url || item.thumbnail_url
    );

    const title = escapeHTML(
      item.title || "Untitled"
    );

    const year = item.year
      ? ` · ${escapeHTML(item.year)}`
      : "";

    const language = item.language
      ? escapeHTML(item.language)
      : "";

    const rating =
      item.rating !== null &&
      item.rating !== undefined &&
      item.rating !== ""
        ? `<span class="card-rating">★ ${escapeHTML(item.rating)}</span>`
        : "";

    const key = escapeHTML(itemKey(item));
    const saved = isSaved(item);

    const image = poster
      ? `<img src="${escapeHTML(poster)}" alt="${title}" loading="lazy">`
      : `<div class="poster-placeholder">▶</div>`;

    return `
      <article class="movie-card" data-item-key="${key}">
        <button class="card-open" type="button"
          data-open-item="${key}"
          aria-label="Open ${title}">
          <div class="poster">${image}</div>

          <div class="card-info">
            <h3>${title}</h3>
            <p>${year}${language ? ` · ${language}` : ""}</p>
            ${rating}
          </div>
        </button>

        <button class="save-btn" type="button"
          data-save-item="${key}"
          aria-label="${saved ? "Remove from" : "Add to"} My List">
          ${saved ? "♥" : "♡"}
        </button>
      </article>
    `;
  }

  function findItem(key) {
    const [kind, ...idParts] = String(key).split(":");
    const id = idParts.join(":");

    return kind === "show"
      ? shows.find((x) => String(x.id) === id)
      : movies.find((x) => String(x.id) === id);
  }

  function renderGrid(id, items, category) {
    const element = $(id);

    if (!element) return;

    const query = (
      $("searchInput")?.value || ""
    ).trim().toLowerCase();

    const filtered = items.filter((item) => {
      const text = [
        item.title,
        item.description,
        item.genre,
        item.language
      ].join(" ").toLowerCase();

      return !query || text.includes(query);
    });

    const expandedNow = !!expanded[category];

    const visible = expandedNow
      ? filtered
      : filtered.slice(0, 8);

    element.innerHTML = visible.length
      ? visible.map(card).join("")
      : `<p class="empty-state">${
          query
            ? "No matching titles found."
            : "No content available yet."
        }</p>`;

    const button = document.querySelector(
      `[data-viewall="${category}"]`
    );

    if (button) {
      button.hidden = filtered.length <= 8;

      button.textContent = expandedNow
        ? "Show less ↑"
        : "View all →";
    }
  }

  function renderMyList() {
    const element = $("myListGrid");

    if (!element) return;

    const keys = getList();

    const items = keys
      .map(findItem)
      .filter(Boolean);

    element.innerHTML = items.length
      ? items.map(card).join("")
      : '<p class="empty-state">Your saved titles will appear here.</p>';
  }

  function renderHero() {
    const candidates = [
      ...movies,
      ...shows
    ].filter((x) => x.backdrop_url || x.poster_url);

    if (!candidates.length) return;

    const item = candidates[
      heroIndex % candidates.length
    ];

    const title = $("heroTitle");
    const meta = $("heroMeta");
    const hero = $("hero");

    if (title) {
      title.textContent = item.title || "Tamilflix";
    }

    if (meta) {
      meta.textContent = [
        item.year,
        item.language,
        item.genre || item.category
      ].filter(Boolean).join(" · ");
    }

    const backdrop = safeURL(
      item.backdrop_url || item.poster_url
    );

    if (hero && backdrop) {
      hero.style.backgroundImage =
        `linear-gradient(90deg, rgba(5,7,12,.96), rgba(5,7,12,.45)), url("${backdrop.replace(/"/g, "%22")}")`;
    }

    const info = $("heroInfo");

    if (info) {
      info.onclick = () => openDetails(item);
    }
  }

  function renderAll() {
    renderGrid("movieGrid", movies, "movies");

    renderGrid(
      "marvelGrid",
      shows.filter((x) => x.category === "marvel"),
      "marvel"
    );

    renderGrid(
      "animeGrid",
      shows.filter((x) => x.category === "anime"),
      "anime"
    );

    renderGrid(
      "seriesGrid",
      shows.filter((x) => x.category === "series"),
      "series"
    );

    renderGrid(
      "bigbossGrid",
      shows.filter((x) => x.category === "bigboss"),
      "bigboss"
    );

    renderMyList();
    renderHero();
    populateShowSelect();
        }
    /* -----------------------------
     DETAILS AND VIDEO PLAYER
  ----------------------------- */

  function openDetails(item) {
    if (!item) return;

    const content = $("detailsContent");
    if (!content) return;

    const poster = safeURL(item.poster_url);
    const title = escapeHTML(item.title || "Untitled");

    const description = escapeHTML(
      item.description || "No description available."
    );

    const isShow = item.kind === "show";

    content.innerHTML = `
      <div class="details-layout">
        ${poster
          ? `<img class="details-poster"
              src="${escapeHTML(poster)}"
              alt="${title}">`
          : ""
        }

        <div class="details-info">
          <h2>${title}</h2>

          <p>
            ${escapeHTML(item.year || "")}
            ${item.language ? " · " + escapeHTML(item.language) : ""}
            ${item.genre ? " · " + escapeHTML(item.genre) : ""}
          </p>

          <p>${description}</p>

          <div class="details-actions">
            ${!isShow && item.video_url
              ? `<button type="button" id="detailsPlayBtn">
                  ▶ Play
                </button>`
              : ""
            }

            <button type="button" id="detailsSaveBtn">
              ${isSaved(item) ? "♥ Remove from My List" : "♡ My List"}
            </button>
          </div>

          ${isShow
            ? `<div id="episodeList"></div>`
            : ""
          }
        </div>
      </div>
    `;

    const playButton = $("detailsPlayBtn");

    if (playButton) {
      playButton.onclick = () => playVideo(
        item.video_url,
        item.title
      );
    }

    const saveButton = $("detailsSaveBtn");

    if (saveButton) {
      saveButton.onclick = () => {
        toggleSaved(item);
        openDetails(item);
      };
    }

    showModal("detailsModal");

    if (isShow) {
      renderEpisodes(item);
    }
  }

  function playVideo(url, title) {
    const videoURL = safeURL(url);

    if (!videoURL) {
      alert("Video URL is not available.");
      return;
    }

    const video = $("videoPlayer");

    if (!video) return;

    const caption = $("playerCaption");

    if (caption) {
      caption.textContent = title || "Tamilflix";
    }

    video.src = videoURL;
    video.load();

    showModal("playerModal");

    video.play().catch(() => {
      // User can press play manually.
    });
  }

  async function renderEpisodes(show) {
    const container = $("episodeList");

    if (!container || !client) return;

    container.innerHTML = "<p>Loading episodes...</p>";

    try {
      const { data, error } = await client
        .from(TABLES.episodes)
        .select("*")
        .eq("show_id", show.id)
        .order("season_number", { ascending: true })
        .order("episode_number", { ascending: true });

      if (error) throw error;

      if (!data || !data.length) {
        container.innerHTML =
          "<p>No episodes available yet.</p>";
        return;
      }

      const grouped = {};

      data.forEach((episode) => {
        const season = episode.season_number || 1;

        if (!grouped[season]) grouped[season] = [];

        grouped[season].push(episode);
      });

      container.innerHTML = Object.keys(grouped)
        .map((season) => `
          <section class="season-block">
            <h3>Season ${escapeHTML(season)}</h3>

            ${grouped[season].map((episode) => `
              <button class="episode-item"
                type="button"
                data-episode-id="${escapeHTML(episode.id)}">

                <span>
                  Episode ${escapeHTML(episode.episode_number || "")}
                  - ${escapeHTML(episode.episode_title || "Untitled")}
                </span>

                <span>▶</span>
              </button>
            `).join("")}
          </section>
        `).join("");

      container.querySelectorAll("[data-episode-id]")
        .forEach((button) => {
          button.onclick = () => {
            const episode = data.find(
              (x) => String(x.id) === button.dataset.episodeId
            );

            if (episode) {
              playVideo(
                episode.video_url,
                episode.episode_title
              );
            }
          };
        });

    } catch (error) {
      console.error("Episode loading error:", error);

      container.innerHTML =
        "<p>Episodes could not be loaded.</p>";
    }
  }

  /* -----------------------------
     LOAD CONTENT
  ----------------------------- */

  async function loadMovies() {
    const { data, error } = await client
      .from(TABLES.movies)
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Movie loading error:", error);
      throw error;
    }

    movies = (data || []).map(normaliseMovie);
  }

  async function loadShows() {
    try {
      const { data, error } = await client
        .from(TABLES.shows)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      shows = (data || []).map(normaliseShow);

    } catch (error) {
      console.warn("Shows table unavailable:", error.message);
      shows = [];
    }
  }

  async function loadContent() {
    if (!client) return;

    try {
      await loadMovies();
      await loadShows();

      renderAll();

    } catch (error) {
      console.error(error);

      const grid = $("movieGrid");

      if (grid) {
        grid.innerHTML =
          '<p class="empty-state">Movies could not be loaded. Check Supabase settings and permissions.</p>';
      }
    }
  }

  /* -----------------------------
     SEARCH AND VIEW ALL
  ----------------------------- */

  function setupViewAll() {
    document.querySelectorAll("[data-viewall]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const category = button.dataset.viewall;

          expanded[category] = !expanded[category];

          renderAll();
        });
      });
  }

  function setupSearch() {
    const search = $("searchInput");

    if (!search) return;

    search.addEventListener("input", renderAll);
  }

  /* -----------------------------
     SHOW SELECT
  ----------------------------- */

  function populateShowSelect() {
    const select = $("showSelect");

    if (!select) return;

    select.innerHTML = `
      <option value="">Select a show</option>
      ${shows.map((show) => `
        <option value="${escapeHTML(show.id)}">
          ${escapeHTML(show.title)}
        </option>
      `).join("")}
    `;
  }

  /* -----------------------------
     AUTHENTICATION
  ----------------------------- */

  function openAuth(mode) {
    const form = $("authForm");

    if (!form) return;

    form.dataset.mode = mode;

    const title = $("authTitle");

    if (title) {
      title.textContent = mode;
    }

    const message = $("authMessage");

    if (message) message.textContent = "";

    showModal("authModal");
  }

  async function authSubmit(event) {
    event.preventDefault();

    const form = $("authForm");
    const message = $("authMessage");
    const button = form?.querySelector(
      'button[type="submit"]'
    );

    if (!client) {
      setMessage(message, "Supabase connection failed.", true);
      return;
    }

    const email = $("authEmail")?.value.trim();
    const password = $("authPassword")?.value;
    const mode = form.dataset.mode;

    if (!email || !password) {
      setMessage(message, "Enter your email and password.", true);
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = "Please wait...";
    }

    setMessage(message, "Connecting...");

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

      if (result.error) throw result.error;

      if (mode === "Register") {
        setMessage(
          message,
          "Account created. Check your email if confirmation is required."
        );
      } else {
        setMessage(message, "Login successful!");

        hideModal("authModal");

        await updateAuthUI();
      }

    } catch (error) {
      setMessage(
        message,
        error.message || "Something went wrong.",
        true
      );

    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Continue";
      }
    }
  }

  async function updateAuthUI() {
    if (!client) return;

    const { data } = await client.auth.getUser();

    currentUser = data?.user || null;

    const email = $("userEmail");

    if (email) {
      email.textContent = currentUser?.email || "";
    }

    const login = $("loginBtn");
    const register = $("registerBtn");
    const logout = $("logoutBtn");

    if (login) login.hidden = !!currentUser;
    if (register) register.hidden = !!currentUser;
    if (logout) logout.hidden = !currentUser;

    await checkAdmin();
  }

  async function logout() {
    if (!client) return;

    const { error } = await client.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    currentUser = null;

    await updateAuthUI();
      }
    /* -----------------------------
     ADMIN CHECK
  ----------------------------- */

  async function checkAdmin() {
    const adminButton = $("adminBtn");

    if (!adminButton || !currentUser || !client) {
      if (adminButton) adminButton.hidden = true;
      return;
    }

    try {
      const { data, error } = await client
        .from(TABLES.admins)
        .select("user_id")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      adminButton.hidden = !!error || !data;

    } catch (error) {
      console.warn("Admin check:", error);
      adminButton.hidden = true;
    }
  }

  /* -----------------------------
     ADMIN MODAL
  ----------------------------- */

  function openAdmin() {
    if (!currentUser) {
      alert("Please login first.");
      return;
    }

    showModal("adminModal");
  }

  async function addMovie(event) {
    event.preventDefault();

    if (!client || !currentUser) return;

    const form = $("movieForm");
    const button = form?.querySelector(
      'button[type="submit"]'
    );

    const get = (name) =>
      form.querySelector(`[name="${name}"]`)?.value?.trim() || "";

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

    if (!movie.title || !movie.video_url) {
      alert("Enter movie title and video URL.");
      return;
    }

    if (button) button.disabled = true;

    try {
      const { error } = await client
        .from(TABLES.movies)
        .insert(movie);

      if (error) throw error;

      alert("Movie added successfully!");

      form.reset();

      await loadContent();

    } catch (error) {
      console.error(error);
      alert("Movie could not be added: " + error.message);

    } finally {
      if (button) button.disabled = false;
    }
  }

  async function addShow(event) {
    event.preventDefault();

    if (!client || !currentUser) return;

    const form = $("showForm");
    const button = form?.querySelector(
      'button[type="submit"]'
    );

    const get = (name) =>
      form.querySelector(`[name="${name}"]`)?.value?.trim() || "";

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

    if (button) button.disabled = true;

    try {
      const { error } = await client
        .from(TABLES.shows)
        .insert(show);

      if (error) throw error;

      alert("Show added successfully!");

      form.reset();

      await loadShows();
      renderAll();

    } catch (error) {
      console.error(error);
      alert("Show could not be added: " + error.message);

    } finally {
      if (button) button.disabled = false;
    }
  }

  async function addEpisode(event) {
    event.preventDefault();

    if (!client || !currentUser) return;

    const form = $("episodeForm");
    const button = form?.querySelector(
      'button[type="submit"]'
    );

    const get = (name) =>
      form.querySelector(`[name="${name}"]`)?.value?.trim() || "";

    const episode = {
      show_id: get("show_id"),
      season_number: Number(get("season_number")) || 1,
      season_title: get("season_title"),
      episode_number: Number(get("episode_number")) || 1,
      episode_title: get("episode_title"),
      thumbnail_url: get("thumbnail_url"),
      video_url: get("video_url")
    };

    if (!episode.show_id || !episode.video_url) {
      alert("Select a show and enter episode video URL.");
      return;
    }

    if (button) button.disabled = true;

    try {
      const { error } = await client
        .from(TABLES.episodes)
        .insert(episode);

      if (error) throw error;

      alert("Episode added successfully!");

      form.reset();

    } catch (error) {
      console.error(error);
      alert("Episode could not be added: " + error.message);

    } finally {
      if (button) button.disabled = false;
    }
  }

  /* -----------------------------
     BUTTON EVENTS
  ----------------------------- */

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

    document.querySelectorAll("[data-close]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          hideModal(button.dataset.close);
        });
      });

    document.addEventListener("click", (event) => {
      const openButton = event.target.closest(
        "[data-open-item]"
      );

      if (openButton) {
        const item = findItem(
          openButton.dataset.openItem
        );

        if (item) openDetails(item);
        return;
      }

      const saveButton = event.target.closest(
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

  /* -----------------------------
     NAVIGATION
  ----------------------------- */

  function setupNavigation() {
    document.querySelectorAll("[data-section]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const section = $(button.dataset.section);

          if (section) {
            section.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });
          }
        });
      });
  }

  /* -----------------------------
     SUPABASE INITIALIZATION
  ----------------------------- */

  async function initialize() {
    try {
      if (!window.supabase) {
        throw new Error("Supabase library not loaded.");
      }

      const url = window.TAMILFLIX_SUPABASE_URL;
      const key = window.TAMILFLIX_SUPABASE_ANON_KEY;

      if (!url || !key) {
        throw new Error("Supabase configuration missing.");
      }

      client = window.supabase.createClient(url, key);

      setupButtons();
      setupSearch();
      setupViewAll();
      setupNavigation();

      await updateAuthUI();
      await loadContent();

      client.auth.onAuthStateChange(() => {
        setTimeout(updateAuthUI, 0);
      });

      console.log("Tamilflix initialized successfully.");

    } catch (error) {
      console.error("Tamilflix initialization error:", error);

      const grid = $("movieGrid");

      if (grid) {
        grid.innerHTML =
          `<p class="empty-state">${escapeHTML(error.message)}</p>`;
      }
    }
  }

  document.addEventListener(
    "DOMContentLoaded",
    initialize
  );

})();

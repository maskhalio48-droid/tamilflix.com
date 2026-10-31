/* Tamilflix Admin Panel logic */
(function() {
  "use strict";
  const $ = id => document.getElementById(id);

  function openAdmin() {
    $("adminModal")?.classList.remove("hidden");
    renderAdminList();
  }

  function renderAdminList() {
    const box = $("adminMovieList");
    if (!box || !window.TamilflixApp) return;

    const items = window.TamilflixApp.titles || [];
    if (!items.length) {
      box.innerHTML = '<p class="muted">No movies saved yet.</p>';
      return;
    }

    box.innerHTML = items.map(m => `
      <div class="admin-movie-item">
        <img src="${m.poster || 'https://placehold.co/80x120?text=No+Cover'}" alt="cover">
        <div class="admin-title">
          <strong>${m.title}</strong>
          <small>${m.year || '—'} · ${m.category || 'Movies'}</small>
        </div>
        <button type="button" onclick="TamilflixAdmin.editMovie('${m.id}')">Edit</button>
        <button type="button" onclick="TamilflixAdmin.deleteMovie('${m.id}')">Delete</button>
      </div>
    `).join("");
  }

  function editMovie(id) {
    const m = (window.TamilflixApp?.titles || []).find(item => String(item.id) === String(id));
    if (!m) return;
    $("editId").value = m.id;
    $("movieTitle").value = m.title || "";
    $("movieYear").value = m.year || "";
    $("movieCategory").value = m.category || "Movies";
    $("movieGenre").value = m.genre || "";
    $("movieRating").value = m.rating || "";
    $("movieLanguage").value = m.language || "";
    $("moviePoster").value = m.poster || "";
    $("movieBackdrop").value = m.backdrop || "";
    $("movieDescription").value = m.description || "";
    $("movieVideo").value = m.video || "";

    if (m.episodes && m.episodes.length) {
      if ($("ep1Title")) $("ep1Title").value = m.episodes[0]?.title || "";
      if ($("ep1Video")) $("ep1Video").value = m.episodes[0]?.video || "";
      if ($("ep2Title")) $("ep2Title").value = m.episodes[1]?.title || "";
      if ($("ep2Video")) $("ep2Video").value = m.episodes[1]?.video || "";
    }
  }

  function deleteMovie(id) {
    if (!confirm("Are you sure you want to delete this title?")) return;
    const current = window.TamilflixApp?.titles || [];
    const next = current.filter(item => String(item.id) !== String(id));
    window.TamilflixApp.setTitles(next);
    renderAdminList();
  }

  $("adminForm")?.addEventListener("submit", event => {
    event.preventDefault();
    const id = $("editId").value || "m_" + Date.now();
    const episodes = [];
    if ($("ep1Video")?.value) episodes.push({ title: $("ep1Title")?.value || "Episode 1", video: $("ep1Video").value });
    if ($("ep2Video")?.value) episodes.push({ title: $("ep2Title")?.value || "Episode 2", video: $("ep2Video").value });

    const movie = {
      id,
      title: $("movieTitle").value,
      year: $("movieYear").value,
      category: $("movieCategory").value,
      genre: $("movieGenre").value,
      rating: $("movieRating").value,
      language: $("movieLanguage").value,
      poster: $("moviePoster").value,
      backdrop: $("movieBackdrop").value,
      description: $("movieDescription").value,
      video: $("movieVideo").value,
      episodes
    };

    const current = window.TamilflixApp?.titles || [];
    const index = current.findIndex(item => String(item.id) === String(id));
    if (index > -1) {
      current[index] = movie;
    } else {
      current.unshift(movie);
    }

    window.TamilflixApp.setTitles(current);
    $("adminForm").reset();
    $("editId").value = "";
    renderAdminList();
    if (window.TamilflixApp.toast) window.TamilflixApp.toast("Movie saved successfully!");
  });

  window.TamilflixAdmin = {
    open: openAdmin,
    renderAdminList,
    editMovie,
    deleteMovie
  };
})();
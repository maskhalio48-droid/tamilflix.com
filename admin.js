/* Tamilflix Admin Panel — Supabase database */
(function () {
    "use strict";

    const $ = id => document.getElementById(id);
    const TABLE = "movies";

    const app = () => window.TamilflixApp;
    const sb = () => window.supabaseClient;

    function msg(text, isError = false) {
        const el = $("adminMessage");

        if (el) {
            el.textContent = text;
            el.style.color = isError ? "#ff8aa1" : "#8ce0ad";
        }
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

    function currentUser() {
        return sb()?.auth?.getUser();
    }

    async function checkAdmin() {
        const client = sb();

        if (!client) {
            throw new Error("Supabase connection is unavailable.");
        }

        const { data, error } = await client.auth.getUser();

        if (error) throw error;

        if (!data.user) {
            throw new Error("Please log in first.");
        }

        const { data: admin, error: adminError } = await client
            .from("admin_users")
            .select("user_id")
            .eq("user_id", data.user.id)
            .maybeSingle();

        if (adminError) throw adminError;

        if (!admin) {
            throw new Error("This account is not registered as an administrator.");
        }

        return data.user;
    }

    function openAdmin() {
        const modal = $("adminModal");

        if (!modal) {
            alert("Tamilflix Admin Panel was not found.");
            return;
        }

        modal.classList.remove("hidden");

        loadAdminMovies().catch(error => {
            msg(error.message || "Could not load movies.", true);
        });
    }

    function clearForm() {
        [
            "editId",
            "movieTitle",
            "movieYear",
            "movieGenre",
            "movieRating",
            "movieLanguage",
            "moviePoster",
            "movieBackdrop",
            "movieDescription",
            "movieVideo",
            "videoTamil",
            "videoSinhala",
            "videoEnglish",
            "videoHindi",
            "videoTelugu"
        ].forEach(id => {
            if ($(id)) $(id).value = "";
        });

        if ($("movieCategory")) {
            $("movieCategory").value = "Movies";
        }

        $("posterPreview")?.classList.add("hidden");
        msg("");
    }

    function mapMovie(row) {
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

    async function loadAdminMovies() {
        msg("Checking administrator access…");

        await checkAdmin();

        const { data, error } = await sb()
            .from(TABLE)
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        const movies = (data || []).map(mapMovie);

        app()?.setTitles(movies);

        renderAdminList(movies);

        msg("Loaded " + movies.length + " movie(s) from Supabase.");
    }

    function getTitles() {
        return app()?.titles || [];
    }

    function renderAdminList(movies = getTitles()) {
        const box = $("adminMovieList");

        if (!box) return;

        if (!movies.length) {
            box.innerHTML = '<p class="muted">No movies found in Supabase.</p>';
            return;
        }

        box.innerHTML = movies.map(movie => `
            <div class="admin-movie-item">
                <img
                    src="${escapeHtml(movie.poster || "https://placehold.co/100x150?text=Poster")}"
                    alt=""
                    onerror="this.onerror=null;this.src='https://placehold.co/100x150?text=Poster'"
                >

                <div class="admin-title">
                    <strong>${escapeHtml(movie.title || "Untitled")}</strong>
                    <small>
                        ${escapeHtml(movie.year || "")}
                        · ${escapeHtml(movie.category || "Movies")}
                    </small>
                </div>

                <button
                    type="button"
                    data-edit-title="${escapeHtml(movie.id)}"
                >Edit</button>

                <button
                    type="button"
                    data-delete-title="${escapeHtml(movie.id)}"
                >Delete</button>
            </div>
        `).join("");
    }

    function fillForm(id) {
        const movie = getTitles().find(
            item => String(item.id) === String(id)
        );

        if (!movie) return;

        $("editId").value = movie.id;
        $("movieTitle").value = movie.title || "";
        $("movieYear").value = movie.year || "";
        $("movieCategory").value = movie.category || "Movies";
        $("movieGenre").value = movie.genre || "";
        $("movieRating").value = movie.rating || "";
        $("movieLanguage").value = movie.language || "";
        $("moviePoster").value = movie.poster || "";
        $("movieBackdrop").value = movie.backdrop || "";
        $("movieDescription").value = movie.description || "";
        $("movieVideo").value = movie.video || "";

        const languages = movie.languageVideos || {};

        $("videoTamil").value = languages.Tamil || "";
        $("videoSinhala").value = languages.Sinhala || "";
        $("videoEnglish").value = languages.English || "";
        $("videoHindi").value = languages.Hindi || "";
        $("videoTelugu").value = languages.Telugu || "";

        if ($("moviePoster").value) {
            preview();
        }

        $("adminForm")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        msg("Editing: " + movie.title);
    }

    async function saveForm(event) {
        event.preventDefault();

        const title = $("movieTitle").value.trim();

        if (!title) {
            msg("Movie title is required.", true);
            return;
        }

        const client = sb();

        try {
            msg("Saving movie to Supabase…");

            const user = await checkAdmin();

            const languages = {
                Tamil: $("videoTamil").value.trim(),
                Sinhala: $("videoSinhala").value.trim(),
                English: $("videoEnglish").value.trim(),
                Hindi: $("videoHindi").value.trim(),
                Telugu: $("videoTelugu").value.trim()
            };

            const languageList = Object.keys(languages).filter(
                language => Boolean(languages[language])
            );

            const movie = {
                title,
                year: $("movieYear").value.trim() || null,
                category: $("movieCategory").value || "Movies",
                genre: $("movieGenre").value.trim() || null,
                rating: $("movieRating").value.trim() || null,
                language: $("movieLanguage").value.trim() || "Tamil",
                poster_url: $("moviePoster").value.trim() || null,
                poster: $("moviePoster").value.trim() || null,
                backdrop_url: $("movieBackdrop").value.trim() || null,
                backdrop: $("movieBackdrop").value.trim() || null,
                description: $("movieDescription").value.trim() || null,
                video_url: $("movieVideo").value.trim() || null,
                language_videos: languages,
                languages: languageList,
                is_active: true,
                admin_user_id: user.id
            };

            const editId = $("editId").value;

            let result;

            if (editId) {
                result = await client
                    .from(TABLE)
                    .update(movie)
                    .eq("id", editId)
                    .select()
                    .single();
            } else {
                result = await client
                    .from(TABLE)
                    .insert(movie)
                    .select()
                    .single();
            }

            if (result.error) throw result.error;

            await loadAdminMovies();

            clearForm();

            app()?.render();
            app()?.toast(editId ? "Movie updated!" : "Movie saved!");

            msg(editId ? "Movie updated successfully." : "Movie added successfully.");

        } catch (error) {
            console.error("Tamilflix save error:", error);

            msg(
                error.message || "Could not save movie to Supabase.",
                true
            );
        }
    }

    async function deleteMovie(id) {
        const movie = getTitles().find(
            item => String(item.id) === String(id)
        );

        if (!movie) return;

        if (!confirm("Delete " + movie.title + "?")) return;

        try {
            msg("Deleting movie…");

            await checkAdmin();

            const { error } = await sb()
                .from(TABLE)
                .delete()
                .eq("id", id);

            if (error) throw error;

            await loadAdminMovies();

            app()?.render();
            app()?.toast("Movie deleted.");

            msg("Movie deleted successfully.");

        } catch (error) {
            console.error("Tamilflix delete error:", error);
            msg(error.message || "Could not delete movie.", true);
        }
    }

    function preview() {
        const url = $("moviePoster").value.trim();

        if (!url) {
            msg("Enter a poster URL first.", true);
            return;
        }

        $("posterPreviewImage").src = url;
        $("posterPreviewCaption").textContent =
            $("movieTitle").value || "Poster preview";

        $("posterPreview").classList.remove("hidden");
    }

    async function autoPoster() {
        const title = $("movieTitle").value.trim();
        const key = $("omdbKey").value.trim();

        if (!title) {
            msg("Enter the movie title first.", true);
            return;
        }

        if (!key) {
            msg("Enter your OMDb API key first.", true);
            $("omdbKey").focus();
            return;
        }

        localStorage.setItem("tamilflix_omdb_key", key);

        msg("Searching OMDb…");

        try {
            const response = await fetch(
                "https://www.omdbapi.com/?apikey=" +
                encodeURIComponent(key) +
                "&t=" +
                encodeURIComponent(title) +
                "&plot=full"
            );

            const data = await response.json();

            if (data.Response === "False") {
                throw new Error(data.Error || "No match found.");
            }

            $("movieTitle").value = data.Title || title;

            $("movieYear").value =
                (data.Year || "").match(/\d{4}/)?.[0] || "";

            $("movieGenre").value = data.Genre || "";

            $("movieRating").value =
                data.imdbRating && data.imdbRating !== "N/A"
                    ? data.imdbRating
                    : "";

            $("movieDescription").value =
                data.Plot && data.Plot !== "N/A"
                    ? data.Plot
                    : "";

            if (data.Poster && data.Poster !== "N/A") {
                $("moviePoster").value = data.Poster;
                preview();
            }

            msg("Details found. Check them and press Save Movie.");

        } catch (error) {
            msg(
                "Auto Poster failed: " +
                (error.message || "Please check your API key."),
                true
            );
        }
    }

    document.addEventListener("click", event => {
        const edit = event.target.closest("[data-edit-title]");

        if (edit) {
            fillForm(edit.dataset.editTitle);
            return;
        }

        const del = event.target.closest("[data-delete-title]");

        if (del) {
            deleteMovie(del.dataset.deleteTitle);
        }
    });

    $("adminForm")?.addEventListener("submit", saveForm);
    $("autoPosterBtn")?.addEventListener("click", autoPoster);
    $("posterPreviewBtn")?.addEventListener("click", preview);

    if ($("omdbKey")) {
        $("omdbKey").value =
            localStorage.getItem("tamilflix_omdb_key") || "";
    }

    document.addEventListener("keydown", event => {
        if (
            event.ctrlKey &&
            event.shiftKey &&
            event.key.toLowerCase() === "a"
        ) {
            event.preventDefault();
            openAdmin();
        }
    });

    window.TamilflixAdmin = {
        open: openAdmin,
        renderAdminList,
        loadAdminMovies
    };

})();

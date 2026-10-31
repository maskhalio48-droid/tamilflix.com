/* Tamilflix Video Player Modal logic */
(function() {
  "use strict";
  const $ = id => document.getElementById(id);

  function openPlayer(movie) {
    const playerModal = $("playerModal");
    const playerStage = $("playerStage");
    const playerTitle = $("playerTitle");

    if (!playerModal || !playerStage) return;

    if (playerTitle) playerTitle.textContent = movie.title || "Now Playing";

    const videoUrl = movie.video || "";
    if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
      let embedUrl = videoUrl;
      if (videoUrl.includes("watch?v=")) embedUrl = videoUrl.replace("watch?v=", "embed/");
      playerStage.innerHTML = `<iframe src="${embedUrl}?autoplay=1" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
    } else {
      playerStage.innerHTML = `<video id="moviePlayer" src="${videoUrl}" controls autoplay playsinline></video>`;
    }

    playerModal.classList.remove("hidden");
  }

  function closePlayer() {
    const playerModal = $("playerModal");
    const playerStage = $("playerStage");
    if (playerStage) playerStage.innerHTML = "";
    if (playerModal) playerModal.classList.add("hidden");
  }

  $("playerClose")?.addEventListener("click", closePlayer);
  $("playerFullscreen")?.addEventListener("click", () => {
    const stage = $("playerStage");
    if (stage?.requestFullscreen) stage.requestFullscreen();
  });

  window.TamilflixPlayer = {
    open: openPlayer,
    close: closePlayer
  };
})();
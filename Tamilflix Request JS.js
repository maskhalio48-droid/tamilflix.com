/* Tamilflix movie requests logic */
(function(){
  "use strict";
  const $ = id => document.getElementById(id);
  const client = () => window.supabaseClient || null;
  
  function openRequest() {
    $('requestModal')?.classList.remove('hidden');
  }

  $('openRequestBtn')?.addEventListener('click', openRequest);

  $('movieRequestForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const sb = client();
    const title = $('requestMovieTitle').value.trim();
    if (!title) return;

    if (!sb) {
      if (window.TamilflixApp?.toast) window.TamilflixApp.toast("Request submitted locally!");
      $('requestModal')?.classList.add('hidden');
      $('movieRequestForm').reset();
      return;
    }

    try {
      await sb.from('movie_requests').insert([{
        title,
        language: $('requestLanguage').value,
        category: $('requestCategory').value,
        notes: $('requestNotes').value.trim(),
        status: 'Pending'
      }]);
      if (window.TamilflixApp?.toast) window.TamilflixApp.toast("Request sent successfully!");
      $('requestModal')?.classList.add('hidden');
      $('movieRequestForm').reset();
    } catch(err) {
      alert("Could not submit request: " + err.message);
    }
  });

  window.TamilflixRequests = { open: openRequest };
})();
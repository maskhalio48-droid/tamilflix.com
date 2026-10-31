/* Tamilflix Supabase Configuration */

window.SUPABASE_URL = "https://ciixfxvzlqcbmfdhbqbx.supabase.co";
window.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_EEibbzI3PHIVGv8inmFsIg_QiIPmnjB";

(function () {
  "use strict";

  const url = window.SUPABASE_URL;
  const key = window.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
  console.error("Tamilflix: Supabase URL or publishable key is missing.");
  return;
}

  if (
    !window.supabase ||
    typeof window.supabase.createClient !== "function"
  ) {
    console.error("Tamilflix: Supabase library did not load.");
    return;
  }

  window.supabaseClient = window.supabase.createClient(url, key);

  console.log("Tamilflix: Supabase connected successfully.");
})();

/* Tamilflix Supabase Configuration */
window.SUPABASE_URL = "https://ciixfxvzlqcbmfdhbqbx.supabase.co";
window.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_EEibbzI3PHIVGv8inmFsIg_QiIPmnjB";

(function () {
  "use strict";
  const url = window.SUPABASE_URL;
  const key = window.SUPABASE_PUBLISHABLE_KEY;

  if (url && key && window.supabase && typeof window.supabase.createClient === "function") {
    window.supabaseClient = window.supabase.createClient(url, key);
    console.log("Tamilflix: Supabase connected successfully.");
  }
})();
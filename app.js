(() => {
"use strict";
const $ = id => document.getElementById(id);
const client = window.supabase?.createClient(
  window.TAMILFLIX_SUPABASE_URL || "",
  window.TAMILFLIX_SUPABASE_ANON_KEY || ""
);
const MY_LIST_KEY = "tamilflix_my_list";
let currentUser = null, isAdmin = false, movies = [], shows = [], seasons = [], episodes = [];
let heroIndex = 0, expanded = {};
const listGet = () => { try { return JSON.parse(localStorage.getItem(MY_LIST_KEY) || "[]"); } catch { return []; } };
const listSet = value => localStorage.setItem(MY_LIST_KEY, JSON.stringify(value));
const safe = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const notify = (form, msg, ok=false) => { const p=form.querySelector(".message"); if(p){p.textContent=msg;p.style.color=ok?"#73d69a":"#ff7598";} };
const showModal = id => $(id).classList.remove("hidden");
const hideModal = id => $(id).classList.add("hidden");
const imgFallback = "https://placehold.co/500x750/171b26/ffffff?text=Tamilflix";
function poster(item){return item.poster_url || item.thumbnail_url || imgFallback;}
function card(item, kind="movie"){
  const id = kind==="movie" ? `movie:${item.id}` : `show:${item.id}`;
  const saved = listGet().includes(id);
  return `<article class="movie-card">
    <div class="poster-wrap"><img loading="lazy" src="${safe(poster(item))}" onerror="this.src='${imgFallback}'" alt="${safe(item.title)}">
      <div class="card-actions"><button class="round-btn" data-play="${kind}:${safe(item.id)}" aria-label="Play">▶</button>
      <button class="round-btn" data-save="${safe(id)}" aria-label="Save">${saved?"♥":"♡"}</button></div>
    </div>
    <h3>${safe(item.title)}</h3><div class="meta"><span>${safe(item.year || "")} · ${kind==="movie"?"Movies":safe(item.category || "Series")}</span><span class="rating">${item.rating?`★ ${safe(item.rating)}`:""}</span></div>
  </article>`;
}
function drawGrid(id, items, kind="movie", key=id){
  const el=$(id); if(!el)return;
  const isExpanded=!!expanded[key], visible=isExpanded?items:items.slice(0,8);
  el.innerHTML=visible.length?visible.map(x=>card(x,kind)).join(""):'<div class="empty">No content available yet.</div>';
  const btn=document.querySelector(`[data-viewall="${key}"]`);
  if(btn){btn.classList.toggle("hidden",items.length<=8);btn.textContent=isExpanded?"Show less ↑":"View all →";}
}
function render(){
  const q=($("searchInput").value||"").trim().toLowerCase();
  const filter=arr=>arr.filter(x=>!q||`${x.title||""} ${x.genre||""} ${x.language||""} ${x.description||""}`.toLowerCase().includes(q));
  drawGrid("movieGrid",filter(movies),"movie","movies");
  for(const cat of ["marvel","anime","series","bigboss"]){
    const items=filter(shows.filter(s=>String(s.category).toLowerCase()===cat));
    drawGrid(cat+"Grid",items,"show",cat);
  }
  const saved=listGet(), savedMovies=movies.filter(x=>saved.includes(`movie:${x.id}`)), savedShows=shows.filter(x=>saved.includes(`show:${x.id}`));
  drawGrid("myListGrid",[...savedMovies,...savedShows],"movie","my-list");
}
function setHero(){
  const featured=movies.filter(m=>m.backdrop_url||m.poster_url);
  if(!featured.length)return;
  const item=featured[heroIndex%featured.length];
  $("heroTitle").textContent=item.title||"Tamilflix";
  $("heroMeta").textContent=[item.year,item.genre,item.language].filter(Boolean).join(" · ")||"Movies · Entertainment";
  $("hero").style.backgroundImage=`linear-gradient(90deg,#0a0c15 0%,rgba(10,12,21,.92) 42%,rgba(10,12,21,.35) 100%),linear-gradient(0deg,#090b12,transparent 40%),url("${item.backdrop_url||item.poster_url}")`;
  $("heroDots").innerHTML=featured.slice(0,8).map((_,i)=>`<span class="${i===heroIndex%featured.length?"active":""}"></span>`).join("");
  $("heroInfo").onclick=()=>openDetails("movie",item.id);
}
async function loadContent(){
  if(!client){console.error("Supabase client not configured");return;}
  const [m,s,se,e]=await Promise.all([
    client.from("movies").select("*").eq("is_active",true).order("created_at",{ascending:false}),
    client.from("tamilflix_shows").select("*").eq("is_active",true).order("created_at",{ascending:false}),
    client.from("tamilflix_seasons").select("*").order("season_number"),
    client.from("tamilflix_episodes").select("*").order("episode_number")
  ]);
  if(m.error) console.warn("Movies query:",m.error.message);
  if(s.error) console.warn("Shows query:",s.error.message);
  movies=m.data||[];shows=s.data||[];seasons=se.data||[];episodes=e.data||[];
  render();setHero();fillShowSelect();
}
async function checkUser(){
  if(!client)return;
  const {data}=await client.auth.getSession();
  currentUser=data.session?.user||null;
  await refreshAdmin();
  updateAuthUI();
  client.auth.onAuthStateChange((_event,session)=>{currentUser=session?.user||null;setTimeout(async()=>{await refreshAdmin();updateAuthUI();},0);});
}
async function refreshAdmin(){
  isAdmin=false;if(!currentUser||!client)return;
  const {data,error}=await client.from("tamilflix_admins").select("email").eq("email",currentUser.email).maybeSingle();
  isAdmin=!error&&!!data;
}
function updateAuthUI(){
  $("loginBtn").classList.toggle("hidden",!!currentUser);$("registerBtn").classList.toggle("hidden",!!currentUser);
  $("logoutBtn").classList.toggle("hidden",!currentUser);$("userEmail").classList.toggle("hidden",!currentUser);
  $("userEmail").textContent=currentUser?.email||"";$("adminBtn").classList.toggle("hidden",!isAdmin);
}
function openAuth(mode){$("authTitle").textContent=mode;$("authForm").dataset.mode=mode;$("authMessage").textContent="";showModal("authModal");}
async function authSubmit(ev){
  ev.preventDefault();if(!client){$("authMessage").textContent="Add Supabase URL and anon key in supabase-config.js.";return;}
  const email=$("authEmail").value.trim(),password=$("authPassword").value,mode=$("authForm").dataset.mode;
  const result=mode==="Register"?await client.auth.signUp({email,password}):await client.auth.signInWithPassword({email,password});
  $("authMessage").textContent=result.error?.message||(mode==="Register"?"Account created. Check your email if confirmation is enabled.":"Login successful.");
  if(!result.error&&mode!=="Register"){hideModal("authModal");}
}
async function logout(){if(client)await client.auth.signOut();}
function openPlayer(url,title){
  if(!url){alert("Video URL is not available.");return;}
  const video=$("videoPlayer");video.pause();video.src=url;$("playerCaption").textContent=title||"";
  showModal("playerModal");video.load();
}
function openDetails(kind,id){
  if(kind==="movie"){
    const m=movies.find(x=>String(x.id)===String(id));if(!m)return;
    $("detailsContent").innerHTML=`<div class="detail-layout"><img src="${safe(poster(m))}" alt=""><div><p class="eyebrow">MOVIE</p><h2>${safe(m.title)}</h2><p>${safe([m.year,m.genre,m.language].filter(Boolean).join(" · "))}</p><p>${safe(m.description||"")}</p><button class="btn btn-primary" data-play="movie:${safe(m.id)}">▶ Play</button></div></div>`;
  }else{
    const s=shows.find(x=>String(x.id)===String(id));if(!s)return;
    const ss=seasons.filter(x=>String(x.show_id)===String(id));
    let html=`<div class="detail-layout"><img src="${safe(poster(s))}" alt=""><div><p class="eyebrow">${safe(s.category||"SERIES").toUpperCase()}</p><h2>${safe(s.title)}</h2><p>${safe([s.year,s.language].filter(Boolean).join(" · "))}</p><p>${safe(s.description||"")}</p></div></div>`;
    for(const season of ss){html+=`<div class="season-block"><h3>${safe(season.season_title||`Season ${season.season_number}`)}</h3>`;
      for(const ep of episodes.filter(x=>String(x.season_id)===String(season.id))){
        html+=`<div class="episode-row"><img src="${safe(ep.thumbnail_url||poster(s))}" alt=""><div><b>Episode ${safe(ep.episode_number)} — ${safe(ep.episode_title)}</b><br><small class="muted">Watch episode</small></div><button class="btn btn-primary" data-play="episode:${safe(ep.id)}">▶</button></div>`;
      }html+="</div>";
    }
    if(!ss.length)html+='<p class="muted">Episodes will appear here when the admin adds them.</p>';
    $("detailsContent").innerHTML=html;
  }
  showModal("detailsModal");
}
function fillShowSelect(){
  const sel=$("showSelect");if(!sel)return;
  sel.innerHTML='<option value="">Select a show</option>'+shows.map(s=>`<option value="${safe(s.id)}">${safe(s.title)} (${safe(s.category)})</option>`).join("");
}
async function saveMovie(ev){
  ev.preventDefault();const f=ev.currentTarget;if(!isAdmin)return notify(f,"Admin access required.");
  const d=Object.fromEntries(new FormData(f));d.year=d.year?Number(d.year):null;d.rating=d.rating?Number(d.rating):null;d.is_active=true;
  const {error}=await client.from("movies").insert(d);
  notify(f,error?.message||"Movie saved.",!error);if(!error){f.reset();await loadContent();}
}
async function saveShow(ev){
  ev.preventDefault();const f=ev.currentTarget;if(!isAdmin)return notify(f,"Admin access required.");
  const d=Object.fromEntries(new FormData(f));d.year=d.year?Number(d.year):null;d.is_active=true;
  const {error}=await client.from("tamilflix_shows").insert(d);
  notify(f,error?.message||"Show saved.",!error);if(!error){f.reset();await loadContent();}
}
async function saveEpisode(ev){
  ev.preventDefault();const f=ev.currentTarget;if(!isAdmin)return notify(f,"Admin access required.");
  const d=Object.fromEntries(new FormData(f)),show_id=d.show_id,season_number=Number(d.season_number),episode_number=Number(d.episode_number);
  let season=seasons.find(x=>String(x.show_id)===String(show_id)&&Number(x.season_number)===season_number);
  if(!season){
    const {data,error}=await client.from("tamilflix_seasons").insert({show_id,season_number,season_title:d.season_title||null}).select().single();
    if(error)return notify(f,error.message);season=data;
  }
  const {error}=await client.from("tamilflix_episodes").insert({season_id:season.id,episode_number,episode_title:d.episode_title,thumbnail_url:d.thumbnail_url||null,video_url:d.video_url});
  notify(f,error?.message||"Episode saved.",!error);if(!error){f.reset();await loadContent();}
}
document.addEventListener("click",async ev=>{
  const close=ev.target.closest("[data-close]");if(close)hideModal(close.dataset.close);
  const view=ev.target.closest("[data-viewall]");if(view){expanded[view.dataset.viewall]=!expanded[view.dataset.viewall];render();}
  const save=ev.target.closest("[data-save]");if(save){const id=save.dataset.save,arr=listGet();listSet(arr.includes(id)?arr.filter(x=>x!==id):[...arr,id]);render();}
  const play=ev.target.closest("[data-play]");if(play){
    const [kind,id]=play.dataset.play.split(":");
    if(kind==="movie"){const m=movies.find(x=>String(x.id)===id);if(m)openPlayer(m.video_url,m.title);}
    if(kind==="show")openDetails("show",id);
    if(kind==="episode"){const ep=episodes.find(x=>String(x.id)===id);if(ep)openPlayer(ep.video_url,ep.episode_title);}
  }
  const tab=ev.target.closest("[data-tab]");if(tab){document.querySelectorAll(".admin-form").forEach(x=>x.classList.add("hidden"));$(tab.dataset.tab).classList.remove("hidden");document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===tab));}
});
$("loginBtn").onclick=()=>openAuth("Login");$("registerBtn").onclick=()=>openAuth("Register");
$("logoutBtn").onclick=logout;$("adminBtn").onclick=()=>showModal("adminModal");
$("authForm").addEventListener("submit",authSubmit);$("movieForm").addEventListener("submit",saveMovie);
$("showForm").addEventListener("submit",saveShow);$("episodeForm").addEventListener("submit",saveEpisode);
$("searchInput").addEventListener("input",render);$("menuBtn").onclick=()=>$("nav").classList.toggle("open");
$("yearNow").textContent=new Date().getFullYear();
document.querySelectorAll(".modal").forEach(modal=>modal.addEventListener("click",e=>{if(e.target===modal)modal.classList.add("hidden");}));
(async()=>{if(!client){console.warn("Configure Supabase first.");return;}await checkUser();await loadContent();})();
})();
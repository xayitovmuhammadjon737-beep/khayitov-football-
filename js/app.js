const tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand();
    tg.setHeaderColor("#090909");
    tg.setBackgroundColor("#090909");
}

const app = document.getElementById("app");
const LIVE_API = "https://khayitov-live-api.onrender.com/api/live";
let liveRefreshTimer = null;

async function refreshLiveMatches(targetId, limit = 0) {
    const target = document.getElementById(targetId);
    if (!target) return;

    try {
        const response = await fetch(LIVE_API, { cache: "no-store" });
        if (!response.ok) throw new Error("Server xatosi");

        const data = await response.json();
        const matches = (data.matches || []).slice(0, limit || undefined);

        if (!matches.length) {
            target.innerHTML = "⚽ Hozircha jonli uchrashuvlar yo‘q.";
            return;
        }

        target.innerHTML = matches.map(m => `
          <div style="background:#151515;border:1px solid #333;border-radius:13px;padding:14px;margin:10px 0;">
            <div style="font-size:11px;color:#d6b15e;text-align:center;margin-bottom:12px;">
              ${escapeHTML(m.country || "")} · ${escapeHTML(m.league || "")}
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <div style="flex:1;text-align:center;">
                <img src="${escapeHTML(m.home_logo || "")}" style="width:38px;height:38px;object-fit:contain;" onerror="this.style.display='none'">
                <div style="font-size:12px;margin-top:6px;">${escapeHTML(m.home || "")}</div>
              </div>
              <div style="min-width:75px;text-align:center;">
                <div style="font-size:24px;font-weight:bold;color:#fff;">
                  ${m.home_score ?? 0} - ${m.away_score ?? 0}
                </div>
                <div style="font-size:11px;color:#d6b15e;margin-top:4px;">
                  🔴 ${escapeHTML(m.minute == null ? m.status : m.minute + "′")}
                </div>
              </div>
              <div style="flex:1;text-align:center;">
                <img src="${escapeHTML(m.away_logo || "")}" style="width:38px;height:38px;object-fit:contain;" onerror="this.style.display='none'">
                <div style="font-size:12px;margin-top:6px;">${escapeHTML(m.away || "")}</div>
              </div>
            </div>
            <div style="text-align:center;color:#999;font-size:11px;margin-top:10px;">
              ${escapeHTML(m.status || "Jonli")}
            </div>
            <button class="gold-btn" style="width:100%;margin-top:12px;"
              onclick="searchMatchStreams(this)"
              data-home="${escapeHTML(m.home || "")}"
              data-away="${escapeHTML(m.away || "")}">
              🔴 Efir qidirish
            </button>
            <div class="stream-results" style="margin-top:12px;"></div>
          </div>
        `).join("");
    } catch (error) {
        target.innerHTML = "⚠️ O‘yinlarni yuklab bo‘lmadi. Qayta urinib ko‘ring.";
    }
}


async function searchMatchStreams(button) {
    const box = button.nextElementSibling;
    if (!box) return;

    button.disabled = true;
    button.textContent = "🔎 Qidirilmoqda...";
    box.textContent = "YouTube LIVE efirlari qidirilmoqda...";

    try {
        const params = new URLSearchParams({
            home: button.dataset.home || "",
            away: button.dataset.away || ""
        });

        const response = await fetch(
            "https://khayitov-live-api.onrender.com/api/streams?" + params
        );
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Server xatosi");
        }

        box.replaceChildren();

        if (!data.streams || !data.streams.length) {
            box.textContent = "😕 Hozircha mos jonli efir topilmadi.";
            return;
        }

        const heading = document.createElement("div");
        heading.textContent = "🔴 Topilgan YouTube LIVE efirlari:";
        heading.style.cssText = "color:#d6b15e;margin-bottom:10px;";
        box.appendChild(heading);

        data.streams.forEach(stream => {
            const item = document.createElement("div");
            item.style.cssText =
                "background:#202020;padding:10px;border-radius:10px;margin:8px 0;";

            const title = document.createElement("div");
            title.textContent = stream.title || "Jonli efir";
            title.style.cssText = "font-size:13px;margin-bottom:5px;";

            const channel = document.createElement("div");
            channel.textContent = "📺 " + (stream.channel || "YouTube");
            channel.style.cssText =
                "font-size:11px;color:#aaa;margin-bottom:8px;";

            const play = document.createElement("button");
            play.className = "gold-btn";
            play.textContent = "▶ Mini ilovada ko‘rish";
            play.style.width = "100%";
            play.dataset.videoId = stream.video_id || "";

            play.addEventListener("click", () => {
                const id = play.dataset.videoId;

                if (!/^[A-Za-z0-9_-]{6,20}$/.test(id)) {
                    channel.textContent = "⚠️ Video ID noto‘g‘ri.";
                    return;
                }

                const oldPlayer = box.querySelector(".stream-player");
                if (oldPlayer) oldPlayer.remove();

                const player = document.createElement("iframe");
                player.className = "stream-player";
                player.src =
                    "https://www.youtube-nocookie.com/embed/" +
                    encodeURIComponent(id);
                player.title = "YouTube LIVE";
                player.allow =
                    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
                player.allowFullscreen = true;
                player.style.cssText =
                    "width:100%;aspect-ratio:16/9;border:0;border-radius:10px;margin-top:12px;";

                item.appendChild(player);
            });

            item.append(title, channel, play);
            box.appendChild(item);
        });

    } catch (error) {
        box.textContent = "⚠️ Efirlarni qidirishda xato: " + error.message;
    } finally {
        button.disabled = false;
        button.textContent = "🔴 Efir qidirish";
    }
}

function startLiveRefresh(targetId, limit = 0) {
    if (liveRefreshTimer) clearInterval(liveRefreshTimer);
    refreshLiveMatches(targetId, limit);
    liveRefreshTimer = setInterval(
        () => refreshLiveMatches(targetId, limit), 30000
    );
}

const questions = [
    {q:"2022-yil Jahon chempioni qaysi terma jamoa?",a:["Fransiya","Argentina","Braziliya","Germaniya"],c:1},
    {q:"Cristiano Ronaldo qaysi davlat futbolchisi?",a:["Ispaniya","Portugaliya","Braziliya","Italiya"],c:1},
    {q:"Real Madrid stadioni nomi nima?",a:["Camp Nou","Anfield","Santiago Bernabéu","Old Trafford"],c:2},
    {q:"UEFA Champions League eng ko‘p kim yutgan?",a:["Barcelona","AC Milan","Real Madrid","Liverpool"],c:2},
    {q:"O‘zbekiston qaysi qit'ada joylashgan?",a:["Afrika","Osiyo","Yevropa","Amerika"],c:1}
];

let quizIndex = 0;
let quizScore = 0;
let answered = false;

function home() {
    app.innerHTML = `
    <section class="welcome">
      <span class="gold">WELCOME TO PREMIUM</span>
      <h1>FUTBOL OLAMI<br><span>SENING QO‘LINGDA</span></h1>
      <p>Eng so‘nggi futbol yangiliklari va natijalar.</p>
    </section>

    <section class="live">
      <div class="section-title">
        <h3>🔴 LIVE MATCHES</h3><span>JONLI</span>
      </div>
      <div id="matches" class="match-card">
        ⚽ Jonli uchrashuvlar yuklanmoqda...
      </div>
    </section>

    <section class="grid">
      <div class="feature" onclick="openPage('news')">
        <span>📰</span><h3>Yangiliklar</h3><p>So‘nggi xabarlar</p>
      </div>
      <div class="feature" onclick="openPage('scores')">
        <span>⚽</span><h3>Natijalar</h3><p>O‘yin hisoblari</p>
      </div>
      <div class="feature" onclick="openPage('table')">
        <span>🏆</span><h3>Turnirlar</h3><p>Ligalar jadvali</p>
      </div>
      <div class="feature" onclick="openPage('quiz')">
        <span>🧠</span><h3>Viktorina</h3><p>Bilimingni sinab ko‘r</p>
      </div>
    </section>

    <section class="bottom-banner">
      <span>✦ KHAYITOV PREMIUM ✦</span>
      <h2>FOOTBALL IS MORE<br>THAN A GAME.</h2>
    </section>`;
    startLiveRefresh("matches", 3);
}



async function loadResults() {
    const target = document.getElementById("resultsList");
    const dateInput = document.getElementById("resultsDate");
    if (!target || !dateInput) return;

    const date = dateInput.value;
    if (!date) {
        target.textContent = "Sanani tanlang.";
        return;
    }

    target.textContent = "⏳ Natijalar yuklanmoqda...";

    try {
        const response = await fetch(
            `https://khayitov-live-api.onrender.com/api/results?date=${encodeURIComponent(date)}`,
            { cache: "no-store" }
        );
        if (!response.ok) throw new Error("Server xatosi");

        const data = await response.json();
        const matches = data.matches || [];

        if (!matches.length) {
            target.textContent = "Bu sanada tugagan uchrashuvlar topilmadi.";
            return;
        }

        target.innerHTML = matches.map(m => `
          <div style="background:#151515;border:1px solid #333;border-radius:13px;padding:13px;margin:10px 0;">
            <div style="color:#d6b15e;font-size:11px;text-align:center;">
              ${escapeHTML(m.country || "")} · ${escapeHTML(m.league || "")}
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:7px;margin-top:12px;">
              <div style="flex:1;text-align:center;">
                <img src="${escapeHTML(m.home_logo || "")}" style="width:35px;height:35px;object-fit:contain;" onerror="this.style.display='none'">
                <div style="font-size:12px;">${escapeHTML(m.home || "")}</div>
              </div>
              <strong style="font-size:23px;white-space:nowrap;">
                ${m.home_score ?? "-"} : ${m.away_score ?? "-"}
              </strong>
              <div style="flex:1;text-align:center;">
                <img src="${escapeHTML(m.away_logo || "")}" style="width:35px;height:35px;object-fit:contain;" onerror="this.style.display='none'">
                <div style="font-size:12px;">${escapeHTML(m.away || "")}</div>
              </div>
            </div>
            <div style="display:flex;gap:7px;margin-top:12px;">
              <button class="gold-btn" style="flex:1;"
                onclick="loadMatchStats(this, '${encodeURIComponent(String(m.id))}')">📊 Statistika</button>
              <button class="gold-btn" style="flex:1;"
                onclick="loadMatchHighlights(this, '${encodeURIComponent(m.home || "")}', '${encodeURIComponent(m.away || "")}')">🎬 Sharh</button>
            </div>
            <div class="match-extra" style="margin-top:10px;"></div>
          </div>
        `).join("");

        target.insertAdjacentHTML("afterbegin",
            `<p style="color:#aaa;font-size:12px;">${matches.length} ta tugagan uchrashuv topildi.</p>`);
    } catch (error) {
        target.textContent = "⚠️ Natijalarni yuklab bo‘lmadi. Birozdan keyin qayta urinib ko‘ring.";
    }
}

async function loadMatchStats(button, fixtureId) {
    const box = button.parentElement.nextElementSibling;
    if (!box) return;

    box.innerHTML = `<div style="padding:18px;text-align:center;color:#d6b15e;">⏳ Statistika tahlil qilinmoqda...</div>`;

    try {
        const response = await fetch(
            `https://khayitov-live-api.onrender.com/api/statistics?fixture=${decodeURIComponent(fixtureId)}`
        );
        if (!response.ok) throw new Error("API xatosi");

        const data = await response.json();
        const teams = data.statistics || [];

        if (!teams.length) {
            box.innerHTML = `<div style="padding:18px;background:#202020;border-radius:12px;text-align:center;color:#aaa;">📊 Bu uchrashuv statistikasi mavjud emas.</div>`;
            return;
        }

        const names = ["Uy jamoasi", "Mehmon jamoa"];
        const stats = teams.map(item => ({
            [item.label]: item.home
        }));

        const awayStats = teams.map(item => ({
            [item.label]: item.away
        }));

        const definitions = [
            ["Ball Possession", "To‘p nazorati", "%", "📊"],
            ["Shots on Target", "Darvozaga aniq zarbalar", "", "🎯"],
            ["Shots off Target", "Noaniq zarbalar", "", "🥅"],
            ["Attacks", "Hujumlar", "", "⚽"],
            ["Dangerous Attacks", "Xavfli hujumlar", "", "🔥"]
        ];

        const rows = definitions.map(([key, label, unit, emoji]) => {
            const a = stats.find(item => item[key] !== undefined)?.[key];
            const b = awayStats.find(item => item[key] !== undefined)?.[key];
            if (a === undefined && b === undefined) return "";

            const num = value => parseFloat(String(value).replace("%", "")) || 0;
            const av = num(a);
            const bv = num(b);
            const total = av + bv;
            const ap = total ? av / total * 100 : 50;
            const bp = total ? bv / total * 100 : 50;

            return `
              <div style="padding:13px 10px;border-bottom:1px solid #303030;">
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;">
                  <b style="color:#f4d58b;">${a === undefined ? "—" : escapeHTML(a)}</b>
                  <span style="color:#bbb;text-align:center;">${emoji} ${label}</span>
                  <b style="color:#f4d58b;">${b === undefined ? "—" : escapeHTML(b)}</b>
                </div>
                <div style="display:flex;gap:4px;margin-top:9px;height:6px;">
                  <div style="width:${a === undefined ? 0 : ap}%;background:#d6b15e;border-radius:8px;"></div>
                  <div style="width:${b === undefined ? 0 : bp}%;background:#777;border-radius:8px;"></div>
                </div>
              </div>`;
        }).join("");

        box.innerHTML = `
          <div style="margin-top:14px;background:linear-gradient(145deg,#191919,#101010);border:1px solid #66512b;border-radius:15px;overflow:hidden;">
            <div style="padding:16px;background:linear-gradient(90deg,#302516,#171717);text-align:center;">
              <div style="font-size:11px;letter-spacing:2px;color:#d6b15e;">KHAYITOV PREMIUM</div>
              <h3 style="margin:7px 0;color:#fff;">📊 O‘YIN STATISTIKASI</h3>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;text-align:center;padding:14px 8px;gap:8px;">
              <div style="color:#f4d58b;font-weight:bold;">${names[0] || "Jamoa 1"}</div>
              <div style="color:#ddd;font-weight:bold;">${names[1] || "Jamoa 2"}</div>
            </div>
            ${rows || `<p style="padding:15px;text-align:center;color:#aaa;">Ko‘rsatish uchun statistika topilmadi.</p>`}
            <div style="padding:12px;text-align:center;color:#777;font-size:10px;">MA’LUMOTLAR SPORTScore MANBASIDAN</div>
          </div>`;
    } catch (error) {
        box.innerHTML = `<div style="padding:15px;color:#ff7777;">⚠️ Statistikani yuklab bo‘lmadi.</div>`;
    }
}

async function loadMatchHighlights(button, home, away) {
    const box = button.parentElement.nextElementSibling;
    if (!box) return;

    box.textContent = "🔎 YouTube sharhlari qidirilmoqda...";
    try {
        const params = new URLSearchParams({
            home: decodeURIComponent(home),
            away: decodeURIComponent(away)
        });
        const response = await fetch(
            `https://khayitov-live-api.onrender.com/api/highlights?${params}`
        );
        if (!response.ok) throw new Error("API xatosi");

        const data = await response.json();
        const videos = data.videos || [];

        if (!videos.length) {
            box.textContent = "Bu uchrashuv uchun video topilmadi.";
            return;
        }

        box.innerHTML = videos.map(video => `
          <div style="margin-top:10px;background:#202020;padding:10px;border-radius:9px;">
            <div style="font-size:13px;margin-bottom:8px;">${escapeHTML(video.title || "Video")}</div>
            <div style="font-size:11px;color:#aaa;margin-bottom:8px;">${escapeHTML(video.channel || "YouTube")}</div>
            <iframe src="https://www.youtube.com/embed/${encodeURIComponent(video.video_id || "")}"
              style="width:100%;aspect-ratio:16/9;border:0;border-radius:8px;"
              allowfullscreen loading="lazy"></iframe>
          </div>
        `).join("");
    } catch (error) {
        box.textContent = "⚠️ Videolarni yuklab bo‘lmadi.";
    }
}

let currentNews = 0;
let footballNews = [];

async function loadFootballNews() {
    const title = document.getElementById("newsTitle");
    const description = document.getElementById("newsDescription");

    if (title) title.textContent = "⏳ Yangiliklar yuklanmoqda...";
    if (description) description.textContent = "UZA Sport yangiliklari olinmoqda...";

    try {
        const response = await fetch(
            "https://khayitov-live-api.onrender.com/api/news",
            { cache: "no-store" }
        );

        if (!response.ok) throw new Error("API xatosi");

        const data = await response.json();
        footballNews = data.news || [];

        if (!footballNews.length) throw new Error("Yangilik topilmadi");

        currentNews = 0;
        showNews();

    } catch (error) {
        if (title) title.textContent = "⚠️ Yangiliklarni yuklab bo‘lmadi";
        if (description) description.textContent =
            "Internetni tekshiring va qayta urinib ko‘ring.";
    }
}

function showNews() {
    const item = footballNews[currentNews];
    const image = document.getElementById("newsImage");
    const title = document.getElementById("newsTitle");
    const description = document.getElementById("newsDescription");
    const counter = document.getElementById("newsCounter");

    if (!item || !image || !title || !description || !counter) return;

    image.style.display = "block";
    image.src = item.image || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=900";
    image.onerror = function() {
        this.src = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=900";
    };

    title.textContent = item.title;
    description.textContent = item.description || "Batafsil ma’lumot mavjud emas.";
    counter.textContent = `${currentNews + 1} / ${footballNews.length}`;
}

function changeNews(direction) {
    if (!footballNews.length) return;

    currentNews =
        (currentNews + direction + footballNews.length) % footballNews.length;

    showNews();
}

function openPage(page) {
    if (liveRefreshTimer) clearInterval(liveRefreshTimer);
    console.log("KHAYITOV sahifa:", page);
    if (page === "home") return home();

    const pages = {
        news: ["📰", "Futbol yangiliklari", "Yangiliklar bo‘limi"],
        scores: ["⚽", "Futbol natijalari", "Uchrashuvlar bo‘limi"],
        live: ["🔴", "KHAYITOV LIVE", "Jonli futbol translyatsiyasi"],
        table: ["🏆", "Turnirlar jadvali", "Ligalar bo‘limi"],
        profile: ["👤", "Mening profilim", "Foydalanuvchi profili"]
    };

    if (page === "quiz") {
        startQuiz();
        return;
    }

    const p = pages[page];
    if (!p) return;

    let content = "";

    if (page === "live") {
        content = `
        <div class="match-card">
          <div class="section-title">
            <h3>🔴 KHAYITOV LIVE</h3>
            <span>JONLI</span>
          </div>
          <p style="color:#aaa;margin:10px 0;">Jonli uchrashuvlar avtomatik yangilanadi.</p>
          <div id="liveMatches">⚽ O‘yinlar yuklanmoqda...</div>
          <button class="gold-btn" onclick="openPage('home')">🏠 Bosh sahifa</button>
        </div>`;
    }

    if (page === "news") {
        content = `
        <div class="match-card" style="padding:15px;">
          <h3 style="color:#d6b15e;text-align:center;margin-bottom:15px;">📰 FUTBOL YANGILIKLARI</h3>

          <div id="newsSlide" style="background:#111;border:1px solid #66512b;border-radius:15px;overflow:hidden;">
            <img id="newsImage" src="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=900"
              style="width:100%;height:210px;object-fit:cover;display:block;"
              onerror="this.style.display='none'">
            <div style="padding:16px;">
              <div id="newsTitle" style="font-size:19px;font-weight:bold;color:#f4d58b;margin-bottom:10px;"></div>
              <p id="newsDescription" style="color:#ccc;line-height:1.6;font-size:14px;"></p>
            </div>
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:18px;gap:12px;">
            <button class="gold-btn" onclick="changeNews(-1)" style="flex:1;">← Orqaga</button>
            <b id="newsCounter" style="color:#d6b15e;white-space:nowrap;">1 / 15</b>
            <button class="gold-btn" onclick="changeNews(1)" style="flex:1;">Oldinga →</button>
          </div>

          <button class="gold-btn" onclick="openPage('home')" style="width:100%;margin-top:15px;">🏠 Bosh sahifaga</button>
        </div>`;

        setTimeout(loadFootballNews, 0);
    }

    if (page === "scores") {
        content = `
        <div class="match-card">
          <h3>⚽ O‘yin natijalari</h3>
          <p style="color:#aaa;margin:10px 0;">Tugagan uchrashuvlarni sana bo‘yicha ko‘ring.</p>
          <input id="resultsDate" type="date"
            value="${new Date().toLocaleDateString('en-CA')}"
            style="width:100%;padding:12px;border-radius:9px;background:#151515;color:white;border:1px solid #555;">
          <button class="gold-btn" style="width:100%;margin-top:10px;"
            onclick="loadResults()">🔎 Natijalarni ko‘rish</button>
          <div id="resultsList" style="margin-top:15px;">⚽ Natijalar yuklanmoqda...</div>
          <button class="gold-btn" onclick="openPage('home')">🏠 Bosh sahifaga</button>
        </div>`;
    }

    if (page === "table") {
        content = `
        <div class="match-card">
          <h3>🏆 Futbol ligalari</h3>
          <p>Angliya Premyer Ligasi</p>
          <p>🇪🇸 La Liga</p>
          <p>🇮🇹 Serie A</p>
          <p>🇩🇪 Bundesliga</p>
          <p>🏆 UEFA Champions League</p>
          <p>🇺🇿 O‘zbekiston Superligasi</p>
          <button class="gold-btn" onclick="openPage('home')">Bosh sahifaga</button>
        </div>`;
    }

    if (page === "profile") {
        const user = tg?.initDataUnsafe?.user;
        content = `
        <div class="match-card">
          <div style="font-size:50px">👤</div>
          <h2>${escapeHTML(user?.first_name || "Futbol muxlisi")}</h2>
          <p>${user?.username ? "@"+escapeHTML(user.username) : "KHAYITOV FOOTBALL foydalanuvchisi"}</p>
          <p class="gold">⭐ KHAYITOV FOOTBALL</p>
          <button class="gold-btn" onclick="openPage('home')">Bosh sahifaga</button>
        </div>`;
    }

    app.innerHTML = `
      <div class="page-heading">
        <span>${p[0]}</span>
        <h2>${p[1]}</h2>
      </div>
      ${content}`;
    if (page === "live") startLiveRefresh("liveMatches");
    if (page === "scores") loadResults();
}

function startQuiz() {
    quizIndex = 0;
    quizScore = 0;
    answered = false;
    showQuestion();
}

function showQuestion() {
    if (quizIndex >= questions.length) {
        app.innerHTML = `
        <div class="match-card quiz-card">
          <div style="font-size:55px">🏆</div>
          <h2>Viktorina tugadi!</h2>
          <h1 class="gold">${quizScore} / ${questions.length}</h1>
          <p>Sizning natijangiz</p>
          <button class="gold-btn" onclick="startQuiz()">🔄 Qayta o‘ynash</button>
          <button class="gold-btn" onclick="openPage('home')">🏠 Bosh sahifa</button>
        </div>`;
        return;
    }

    answered = false;
    const q = questions[quizIndex];

    app.innerHTML = `
      <div class="page-heading">
        <span>🧠</span><h2>Futbol viktorinasi</h2>
      </div>
      <div class="match-card quiz-card">
        <p class="gold">SAVOL ${quizIndex+1} / ${questions.length}</p>
        <h3>${q.q}</h3>
        <div class="quiz-options">
          ${q.a.map((a,i)=>`
            <button class="quiz-option" onclick="answerQuiz(${i})">${a}</button>
          `).join("")}
        </div>
        <p id="quiz-feedback"></p>
        <p class="gold">⭐ Ball: ${quizScore}</p>
      </div>`;
}

function answerQuiz(choice) {
    if (answered) return;
    answered = true;

    const q = questions[quizIndex];
    const buttons = document.querySelectorAll(".quiz-option");

    buttons.forEach((b,i) => {
        b.disabled = true;
        if (i === q.c) b.classList.add("correct");
        if (i === choice && choice !== q.c) b.classList.add("wrong");
    });

    const correct = choice === q.c;
    if (correct) quizScore++;

    document.getElementById("quiz-feedback").innerHTML =
        correct ? "✅ To‘g‘ri javob!" : "❌ Noto‘g‘ri javob!";

    const next = document.createElement("button");
    next.className = "gold-btn";
    next.textContent = "Keyingi savol ➜";
    next.onclick = () => {
        quizIndex++;
        showQuestion();
    };
    document.querySelector(".quiz-card").appendChild(next);
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, c => ({
        "&":"&amp;", "<":"&lt;", ">":"&gt;",
        '"':"&quot;", "'":"&#39;"
    }[c]));
}

home();


function playLive() {
    const input = document.getElementById("liveUrl");
    const video = document.getElementById("liveVideo");
    const status = document.getElementById("liveStatus");

    if (!input || !video || !status) return;

    const url = input.value.trim();

    if (!/^https?:\/\//i.test(url)) {
        status.textContent = "⚠️ To‘g‘ri video havolasini kiriting.";
        return;
    }

    video.src = url;
    video.play()
        .then(() => status.textContent = "🔴 Translyatsiya boshlandi.")
        .catch(() => status.textContent =
            "⚠️ Video ochilmadi. Havola MP4 yoki pleer qo‘llaydigan formatda bo‘lishi kerak.");
}

document.addEventListener("DOMContentLoaded", () => {
    const liveButton = document.getElementById("liveNavBtn");
    if (liveButton) {
        liveButton.addEventListener("click", () => openPage("live"));
    }
});

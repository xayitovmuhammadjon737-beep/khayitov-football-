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
          </div>
        `).join("");
    } catch (error) {
        target.innerHTML = "⚠️ O‘yinlarni yuklab bo‘lmadi. Qayta urinib ko‘ring.";
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
}

function openPage(page) {
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
        <div class="match-card">
          <h3>📰 Futbol olamidagi yangiliklar</h3>
          <p>Yangiliklar lentasi uchun bepul ma'lumot manbasi keyingi bosqichda ulanadi.</p>
          <button class="gold-btn" onclick="openPage('home')">Bosh sahifaga</button>
        </div>`;
    }

    if (page === "scores") {
        content = `
        <div class="match-card">
          <h3>⚽ O‘yin natijalari</h3>
          <p>Jonli, bugungi, tugagan va kelgusi o‘yinlar.</p>
          <p class="gold">Natijalar manbasi keyingi bosqichda ulanadi.</p>
          <button class="gold-btn" onclick="openPage('home')">Bosh sahifaga</button>
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

const tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand();
    tg.setHeaderColor("#090909");
    tg.setBackgroundColor("#090909");
}

function openPage(page) {
    const pages = {
        home: "🏠 Bosh sahifa",
        news: "📰 Futbol yangiliklari",
        scores: "⚽ Futbol natijalari",
        table: "🏆 Turnirlar jadvali",
        quiz: "🧠 Futbol viktorinasi",
        profile: "👤 Profil"
    };

    if (page === "home") {
        location.reload();
        return;
    }

    alert(pages[page] + "\n\nBu bo‘lim keyingi bosqichda ulanadi!");
}

document.getElementById("matches").innerHTML = `
    <div style="color:#d6b15e;font-size:12px">
        ✦ KHAYITOV FOOTBALL
    </div>
    <p style="margin-top:10px;color:#aaa">
        Jonli uchrashuvlar tez orada ulanadi
    </p>
`;

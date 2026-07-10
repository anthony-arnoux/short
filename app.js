(() => {
  "use strict";

  const API_URL =
    "https://public.opendatasoft.com/api/records/1.0/search/?dataset=weatherref-france-vigilance-meteo-departement" +
    "&q=domain_id%3A21+AND+phenomenon%3Acanicule&rows=10";

  const CACHE_KEY = "short-dijon-vigilance-v1";
  const CACHE_MAX_AGE_MS = 15 * 60 * 1000;
  const AUTO_REFRESH_MS = 15 * 60 * 1000;

  const COLOR_LABEL = {
    vert: "Vert",
    jaune: "Jaune",
    orange: "Orange",
    rouge: "Rouge",
    inconnu: "Inconnu",
  };

  const COLOR_MESSAGE = {
    rouge: "Il fait assez chaud pour mettre un short, faites-vous plaisir 🩳🔥",
    orange: "Il fait super chaud, mais officiellement c'est pas encore le rouge : fais comme tu veux, débrouille-toi 🤷",
    jaune: "Ça chauffe un peu, mais pas de quoi sortir le short — reste discret 😏",
    vert: "Il fait bien trop froid, pourquoi mettre un short ? 🥶",
    inconnu: "Impossible de savoir quelle tenue est de rigueur aujourd'hui.",
  };

  const el = {
    card: document.getElementById("card"),
    verdict: document.getElementById("verdict"),
    subtext: document.getElementById("subtext"),
    details: document.getElementById("details"),
    pillToday: document.getElementById("pill-today"),
    pillTomorrow: document.getElementById("pill-tomorrow"),
    refreshBtn: document.getElementById("refresh-btn"),
    meta: document.getElementById("meta"),
  };

  const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
  });

  function setPill(node, color) {
    const key = color && COLOR_LABEL[color] ? color : "inconnu";
    node.textContent = COLOR_LABEL[key];
    node.dataset.color = key;
  }

  function setState(state) {
    el.card.dataset.state = state;
  }

  function setLoading() {
    setState("loading");
    el.verdict.innerHTML = '<span class="spinner" aria-hidden="true"></span> Vérification en cours…';
    el.subtext.textContent = "Interrogation de la vigilance météo France.";
    el.details.hidden = true;
    el.meta.textContent = "";
  }

  function setError(message) {
    setState("error");
    el.verdict.textContent = "⚠️ Indisponible";
    el.subtext.textContent = message;
    el.details.hidden = true;
    el.meta.textContent = "";
  }

  function render(data) {
    const { today, tomorrow } = data;
    const isAuthorized = today.color === "rouge";

    setState(isAuthorized ? "yes" : "no");

    el.verdict.textContent = isAuthorized ? "🩳 Short autorisé" : "🚫 Short non autorisé";
    el.subtext.textContent = COLOR_MESSAGE[today.color] || COLOR_MESSAGE.inconnu;

    setPill(el.pillToday, today.color);
    setPill(el.pillTomorrow, tomorrow ? tomorrow.color : null);
    el.details.hidden = false;

    const updated = today.productDatetime
      ? timeFormatter.format(today.productDatetime)
      : null;
    el.meta.textContent = updated
      ? `Bulletin Météo-France de ${updated} (heure de Paris)`
      : "";
  }

  function parseRecords(json) {
    const records = (json.records || []).map((r) => r.fields || {});
    const byEcheance = (echeance) =>
      records.find((f) => f.echeance === echeance);

    const j = byEcheance("J");
    const j1 = byEcheance("J1");

    if (!j) return null;

    return {
      today: {
        color: j.color || "inconnu",
        productDatetime: j.product_datetime ? new Date(j.product_datetime) : null,
      },
      tomorrow: j1
        ? {
            color: j1.color || "inconnu",
            productDatetime: j1.product_datetime ? new Date(j1.product_datetime) : null,
          }
        : null,
    };
  }

  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.savedAt || !parsed.data) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function writeCache(data) {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ savedAt: Date.now(), data })
      );
    } catch {
      /* localStorage unavailable — ignore */
    }
  }

  async function fetchVigilance({ useCache } = { useCache: true }) {
    if (useCache) {
      const cached = readCache();
      if (cached && Date.now() - cached.savedAt < CACHE_MAX_AGE_MS) {
        render(reviveDates(cached.data));
        return;
      }
    }

    setLoading();

    try {
      const res = await fetch(API_URL, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const data = parseRecords(json);
      if (!data) throw new Error("Données canicule introuvables pour Dijon.");

      render(data);
      writeCache(data);
    } catch (err) {
      const cached = readCache();
      if (cached) {
        render(reviveDates(cached.data));
        el.meta.textContent +=
          (el.meta.textContent ? " — " : "") +
          "dernière donnée connue (rafraîchissement impossible)";
      } else {
        setError(
          "Impossible de joindre le service de vigilance météo pour le moment. Réessayez dans un instant."
        );
      }
      console.error("Vigilance fetch failed:", err);
    }
  }

  function reviveDates(data) {
    return {
      today: {
        ...data.today,
        productDatetime: data.today.productDatetime
          ? new Date(data.today.productDatetime)
          : null,
      },
      tomorrow: data.tomorrow
        ? {
            ...data.tomorrow,
            productDatetime: data.tomorrow.productDatetime
              ? new Date(data.tomorrow.productDatetime)
              : null,
          }
        : null,
    };
  }

  function getDemoColor() {
    const raw = new URLSearchParams(location.search).get("demo");
    return raw && COLOR_LABEL[raw] ? raw : null;
  }

  el.refreshBtn.addEventListener("click", async () => {
    const demo = getDemoColor();
    if (demo) {
      render({
        today: { color: demo, productDatetime: new Date() },
        tomorrow: { color: demo, productDatetime: new Date() },
      });
      return;
    }
    el.refreshBtn.disabled = true;
    await fetchVigilance({ useCache: false });
    el.refreshBtn.disabled = false;
  });

  const demoColor = getDemoColor();
  if (demoColor) {
    render({
      today: { color: demoColor, productDatetime: new Date() },
      tomorrow: { color: demoColor, productDatetime: new Date() },
    });
    el.meta.textContent = "🎭 Mode démo — données simulées, pas de requête réseau";
  } else {
    fetchVigilance({ useCache: true });
    setInterval(() => fetchVigilance({ useCache: false }), AUTO_REFRESH_MS);
  }
})();

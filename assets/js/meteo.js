/* Données météo : relevé figé écrit dans la page (repli hors ligne et sans JavaScript),
   puis données en direct d'Open-Meteo (prévisions, géocodage), sans clé, depuis le navigateur. */
const DONNEES = (() => { try { return JSON.parse(document.getElementById('donnees-meteo').textContent); } catch { return {}; } })();
export const codes = DONNEES.codes || {};
export const vigilance = DONNEES.vigilance || null;
const API = 'https://api.open-meteo.com/v1/forecast';
const GEO = 'https://geocoding-api.open-meteo.com/v1/search';
const FUSEAU = 'Europe/Paris';

/* ---------- Formats ---------- */
export const deg = (t) => (t == null || Number.isNaN(t) ? '–' : `${Math.round(t) < 0 ? '−' : ''}${Math.abs(Math.round(t))}°`);
export const nombre = (v) => String(v).replace('.', ',');
export function heureFr(hhmm) { const [h, m] = hhmm.split(':'); return m && m !== '00' ? `${+h} h ${m}` : `${+h} h`; }
const JOURS_COURTS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
export const jourCourt = (iso, i) => { const d = new Date(iso + 'T12:00:00'); return i === 0 ? 'Auj.' : i === 1 ? 'Demain' : `${JOURS_COURTS[d.getDay()]} ${d.getDate()}`; };
const DIRS = ['nord', 'nord-est', 'est', 'sud-est', 'sud', 'sud-ouest', 'ouest', 'nord-ouest'];
export const direction = (d) => DIRS[Math.round(((d % 360) + 360) % 360 / 45) % 8];
export const ventDe = (d) => { const x = direction(d); return x === 'est' || x === 'ouest' ? `Vent d'${x}` : `Vent du ${x}`; };
export const libelle = (code) => (codes[String(code)] || codes['3'] || ['–'])[0];
export function etatCiel(code, jour, altSoleil = null) {
  const e = (codes[String(code)] || codes['3'] || [, , 'nuageux'])[2];
  if ((e === 'clair' || e === 'nuageux') && altSoleil != null && altSoleil > -5 && altSoleil < 6) return 'crepuscule';
  if (!jour && (e === 'clair' || e === 'nuageux')) return 'nuit';
  return e;
}
export function icone(code, jour = 1) {
  let n = (codes[String(code)] || codes['3'] || [, 'nuage'])[1];
  if (!jour && n === 'soleil') n = 'lune';
  if (!jour && n === 'eclaircies') n = 'eclaircies-nuit';
  return n;
}
export const svgIcone = (nom, classe = 'ico') => `<svg class="${classe}" aria-hidden="true" focusable="false"><use href="#i-${nom}"/></svg>`;

/* Heure locale du lieu (Paris), jamais celle du visiteur. */
export function maintenantParis() {
  const p = new Intl.DateTimeFormat('fr-FR', { timeZone: FUSEAU, hour: '2-digit', minute: '2-digit', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const v = Object.fromEntries(p.map((x) => [x.type, x.value]));
  return { date: `${v.year}-${v.month}-${v.day}`, h: +v.hour % 24, m: +v.minute };
}

/* ---------- Soleil (méthode SunCalc / NOAA, reprise du module ciel-en-direct) ---------- */
const RAD = Math.PI / 180;
const jours = (date) => date.valueOf() / 864e5 - 0.5 + 2440588 - 2451545;
export function hauteurSoleil(date, lat, lon) {
  const d = jours(date);
  const M = RAD * (357.5291 + 0.98560028 * d);
  const L = M + RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) + RAD * 102.9372 + Math.PI;
  const e = RAD * 23.4397;
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  const ra = Math.atan2(Math.sin(L) * Math.cos(e), Math.cos(L));
  const H = RAD * (280.16 + 360.9856235 * d) + lon * RAD - ra, phi = lat * RAD;
  return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H)) / RAD;
}

/* Position du soleil et de la lune (méthode SunCalc) : hauteur et azimut en degrés, azimut compté depuis le sud, positif vers l'ouest. */
const OBL = RAD * 23.4397;
const ad = (l, b) => Math.atan2(Math.sin(l) * Math.cos(OBL) - Math.tan(b) * Math.sin(OBL), Math.cos(l));
const dec = (l, b) => Math.asin(Math.sin(b) * Math.cos(OBL) + Math.cos(b) * Math.sin(OBL) * Math.sin(l));
function horizon(d, lat, lon, ra, de) {
  const H = RAD * (280.16 + 360.9856235 * d) + lon * RAD - ra, phi = lat * RAD;
  return {
    alt: Math.asin(Math.sin(phi) * Math.sin(de) + Math.cos(phi) * Math.cos(de) * Math.cos(H)) / RAD,
    az: Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(de) * Math.cos(phi)) / RAD,
  };
}
export function positionSoleil(date, lat, lon) {
  const d = jours(date);
  const M = RAD * (357.5291 + 0.98560028 * d);
  const L = M + RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) + RAD * 102.9372 + Math.PI;
  return horizon(d, lat, lon, ad(L, 0), dec(L, 0));
}
export function positionLune(date, lat, lon) {
  const d = jours(date);
  const L = RAD * (218.316 + 13.176396 * d), Mm = RAD * (134.963 + 13.064993 * d), F = RAD * (93.272 + 13.22935 * d);
  const l = L + RAD * 6.289 * Math.sin(Mm), b = RAD * 5.128 * Math.sin(F);
  return horizon(d, lat, lon, ad(l, b), dec(l, b));
}
/* Position d'un lieu sur une carte des départements (même projection que france.json, lue sur le SVG). */
export function surCarte(svg, lat, lon) {
  const [ox, oy] = (svg.dataset.origine || '0,0').split(',').map(Number), z = +svg.dataset.zoom || 5;
  const Mz = 256 * 2 ** z, s = Math.sin(lat * RAD);
  return [(lon + 180) / 360 * Mz - ox, (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * Mz - oy];
}

/* ---------- Modèle commun (relevé figé ou données en direct) ---------- */
export function depuisReleve() {
  const r = DONNEES.releve;
  if (!r) return null;
  const [t, ressenti, hum, jour, pluie, code, nuages, pression, vent, dir, rafales] = r.maintenant;
  return {
    direct: false, maj: r.maj,
    lieu: { nom: r.lieu[0], dep: r.lieu[1], lat: r.lieu[2], lon: r.lieu[3] },
    maintenant: { t, ressenti, hum, jour, pluie, code, nuages, pression, vent, dir, rafales },
    heures: r.heures.map(([h, t, pp, p, code, jour, raf]) => ({ h, t, pp, p, code, jour, raf })),
    jours: r.jours.map(([date, code, tmin, tmax, pluie, pp, lever, coucher, matin, aprem]) => ({ date, code, tmin, tmax, pluie, pp, lever, coucher, matin, aprem })),
    villes: r.villes.map(([nom, dep, lat, lon, t, code, jour, matin, aprem]) => ({ nom, dep, lat, lon, t, code, jour, matin, aprem })),
  };
}
export const releve = depuisReleve();

function delai(ms) { const c = new AbortController(); setTimeout(() => c.abort(), ms); return c.signal; }
const r1 = (v) => Math.round(v * 10) / 10;

const cache = new Map();
/** Prévisions en direct d'un lieu ; null si le réseau ne répond pas (le relevé figé reste affiché). */
export async function previsions(lieu) {
  const cle = `${lieu.lat.toFixed(3)},${lieu.lon.toFixed(3)}`;
  if (cache.has(cle)) return cache.get(cle);
  const p = new URLSearchParams({
    latitude: lieu.lat, longitude: lieu.lon, timezone: FUSEAU, forecast_days: '16',
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m',
    hourly: 'temperature_2m,precipitation_probability,precipitation,weather_code,is_day,wind_gusts_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max',
  });
  const promesse = (async () => {
    try {
      const d = await fetch(`${API}?${p}`, { signal: delai(7000) }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
      const c = d.current;
      const iH = Math.max(0, d.hourly.time.indexOf(c.time.slice(0, 13) + ':00'));
      const heures = [];
      for (let i = iH; i < Math.min(d.hourly.time.length, iH + 25); i++) {
        heures.push({ h: d.hourly.time[i].slice(11, 13), t: r1(d.hourly.temperature_2m[i]), pp: d.hourly.precipitation_probability[i], p: r1(d.hourly.precipitation[i]), code: d.hourly.weather_code[i], jour: d.hourly.is_day[i], raf: Math.round(d.hourly.wind_gusts_10m[i]) });
      }
      const a = (date, h) => { const k = d.hourly.time.indexOf(`${date}T${h}`); return k < 0 || d.hourly.temperature_2m[k] == null ? null : [Math.round(d.hourly.temperature_2m[k]), d.hourly.weather_code[k]]; };
      return {
        direct: true, maj: c.time, lieu,
        maintenant: { t: r1(c.temperature_2m), ressenti: r1(c.apparent_temperature), hum: c.relative_humidity_2m, jour: c.is_day, pluie: r1(c.precipitation), code: c.weather_code, nuages: c.cloud_cover, pression: Math.round(c.pressure_msl), vent: Math.round(c.wind_speed_10m), dir: c.wind_direction_10m, rafales: Math.round(c.wind_gusts_10m) },
        heures,
        jours: d.daily.time.map((t, i) => ({ date: t, code: d.daily.weather_code[i], tmin: r1(d.daily.temperature_2m_min[i]), tmax: r1(d.daily.temperature_2m_max[i]), pluie: r1(d.daily.precipitation_sum[i] || 0), pp: d.daily.precipitation_probability_max[i], lever: d.daily.sunrise[i].slice(11), coucher: d.daily.sunset[i].slice(11), matin: a(t, '09:00'), aprem: a(t, '15:00') })),
      };
    } catch (err) {
      cache.delete(cle);
      return null;
    }
  })();
  cache.set(cle, promesse);
  return promesse;
}

/** Conditions en direct de plusieurs villes en un seul appel ; null hors ligne. */
export async function villesEnDirect(liste) {
  const p = new URLSearchParams({ latitude: liste.map((v) => v.lat).join(','), longitude: liste.map((v) => v.lon).join(','), current: 'temperature_2m,weather_code,is_day', hourly: 'temperature_2m,weather_code', timezone: FUSEAU, forecast_days: '1' });
  try {
    const d = await fetch(`${API}?${p}`, { signal: delai(7000) }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
    const tab = Array.isArray(d) ? d : [d];
    return tab.map((x, i) => {
      const a = (h) => { const k = x.hourly.time.findIndex((t) => t.endsWith('T' + h)); return k < 0 ? null : [Math.round(x.hourly.temperature_2m[k]), x.hourly.weather_code[k]]; };
      return { ...liste[i], t: r1(x.current.temperature_2m), code: x.current.weather_code, jour: x.current.is_day, matin: a('09:00'), aprem: a('15:00') };
    });
  } catch { return null; }
}

/** Recherche de communes françaises (géocodage Open-Meteo), accents et majuscules ignorés par l'API. */
export async function chercherCommunes(q) {
  const p = new URLSearchParams({ name: q, count: '8', language: 'fr', countryCode: 'FR', format: 'json' });
  const d = await fetch(`${GEO}?${p}`, { signal: delai(6000) }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
  return (d.results || []).map((x) => ({
    nom: x.name, lat: +x.latitude.toFixed(4), lon: +x.longitude.toFixed(4),
    dep: x.postcodes && x.postcodes[0] ? depDepuisCP(x.postcodes[0]) : '',
    detail: [x.admin2, x.admin1].filter(Boolean).join(', '),
  }));
}
function depDepuisCP(cp) {
  if (cp.startsWith('20')) return +cp < 20200 ? '2A' : '2B';
  return cp.startsWith('97') ? cp.slice(0, 3) : cp.slice(0, 2);
}

/* ---------- Lieu choisi : adresse de la page, sinon dernier lieu mémorisé, sinon le relevé (Paris) ---------- */
export function lieuDeLAdresse() {
  const u = new URLSearchParams(location.search);
  const lat = parseFloat(u.get('lat')), lon = parseFloat(u.get('lon'));
  if (u.get('nom') && !Number.isNaN(lat) && !Number.isNaN(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) return { nom: u.get('nom').slice(0, 80), lat, lon, dep: (u.get('dep') || '').slice(0, 3) };
  return null;
}
export function lieuMemorise() {
  try { const l = JSON.parse(localStorage.getItem('meteofr:lieu') || 'null'); if (l && typeof l.lat === 'number' && typeof l.lon === 'number' && l.nom) return l; } catch {}
  return null;
}
export function memoriserLieu(l) { try { localStorage.setItem('meteofr:lieu', JSON.stringify({ nom: l.nom, lat: l.lat, lon: l.lon, dep: l.dep || '' })); } catch {} }
export const lienCommune = (l) => `/commune?nom=${encodeURIComponent(l.nom)}&lat=${l.lat}&lon=${l.lon}${l.dep ? '&dep=' + encodeURIComponent(l.dep) : ''}`;

/* ---------- Teinte des températures (même échelle que la génération) ---------- */
const ECHELLE = [[-10, [59, 76, 192]], [0, [96, 150, 226]], [8, [120, 196, 214]], [14, [166, 214, 160]], [18, [246, 211, 107]], [24, [246, 164, 58]], [32, [211, 58, 44]]];
export function teinte(t) {
  if (t <= ECHELLE[0][0]) return `rgb(${ECHELLE[0][1].join(' ')})`;
  for (let i = 1; i < ECHELLE.length; i++) {
    const [b, cb] = ECHELLE[i], [a, ca] = ECHELLE[i - 1];
    if (t <= b) { const k = (t - a) / (b - a); return `rgb(${ca.map((v, j) => Math.round(v + (cb[j] - v) * k)).join(' ')})`; }
  }
  return `rgb(${ECHELLE[ECHELLE.length - 1][1].join(' ')})`;
}

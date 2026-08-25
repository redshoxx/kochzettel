import { useEffect, useMemo, useState } from "react";
import {
  DAYS,
  initialRecipes,
  extraShopItems,
  initialPlan,
  initialNotes,
  CATEGORY_META,
  ITEM_EMOJI,
} from "./data";

const LS = "kochzettel-v1";

function load() {
  try {
    const raw = localStorage.getItem(LS);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function Icon({ name }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "plan")
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </svg>
    );
  if (name === "cook")
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <path d="M4 10h16v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-8z" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
    );
  if (name === "shop")
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <circle cx="9" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
        <path d="M3 4h2l2.2 11h11.3l2-8H7" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" {...common}>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  );
}

export default function App() {
  const saved = load();
  const [tab, setTab] = useState("plan");
  const [view, setView] = useState("main");
  const [recipes, setRecipes] = useState(saved?.recipes || initialRecipes);
  const [plan, setPlan] = useState(saved?.plan || initialPlan);
  const [extras, setExtras] = useState(saved?.extras || extraShopItems);
  const [notes, setNotes] = useState(saved?.notes || initialNotes);
  const [day, setDay] = useState("wed");
  const [recipeId, setRecipeId] = useState("curry");
  const [rtab, setRtab] = useState("zutaten");
  const [nfilter, setNfilter] = useState("alle");
  const [q, setQ] = useState("");
  const [url, setUrl] = useState("https://www.chefkoch.de/rezepte/123456789/Pasta-mit-Spinat-und-Feta.html");
  const [imported, setImported] = useState(false);
  const [maxInStore, setMaxInStore] = useState(true);
  const [toast, setToast] = useState("");
  const [picker, setPicker] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [newNote, setNewNote] = useState("");
  const [checked, setChecked] = useState(() => {
    const m = {};
    (saved?.extras || extraShopItems).forEach((e) => { if (e.checked) m[e.id] = true; });
    return m;
  });

  useEffect(() => {
    localStorage.setItem(LS, JSON.stringify({ recipes, plan, extras, notes }));
  }, [recipes, plan, extras, notes]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const recipe = recipes.find((r) => r.id === recipeId);

  const shopItems = useMemo(() => {
    const map = new Map();
    Object.values(plan).forEach((slot) => {
      if (!slot?.recipeId) return;
      const rec = recipes.find((r) => r.id === slot.recipeId);
      rec?.ingredients.forEach((ing) => {
        if (ing.have) return;
        const key = ing.name.toLowerCase();
        if (!map.has(key)) {
          const id = "r-" + ing.id;
          map.set(key, {
            id,
            name: ing.name,
            amount: ing.amount || "",
            unit: ing.amount || "",
            category: ing.category,
            checked: !!checked[id],
            note: "",
            fromRecipe: true,
          });
        }
      });
    });
    extras.forEach((e) => map.set("x-" + e.id, { ...e, checked: checked[e.id] ?? e.checked }));
    return [...map.values()];
  }, [plan, recipes, extras, checked]);

  const grouped = useMemo(() => {
    const order = ["Obst & Gemüse", "Kühlung", "Trockenware", "Haushalt"];
    const g = {};
    shopItems.forEach((it) => {
      const c = it.category || "Trockenware";
      (g[c] ||= []).push(it);
    });
    return order.filter((c) => g[c]?.length).map((c) => [c, g[c]]);
  }, [shopItems]);

  const done = shopItems.filter((i) => i.checked).length;
  const total = shopItems.length || 1;

  function openRecipe(id) {
    setRecipeId(id);
    setRtab("zutaten");
    setView("recipe");
  }

  function toggleHave(ingId) {
    setRecipes((rs) =>
      rs.map((r) =>
        r.id !== recipeId
          ? r
          : { ...r, ingredients: r.ingredients.map((i) => (i.id === ingId ? { ...i, have: !i.have } : i)) }
      )
    );
  }

  function toggleExtra(id) {
    setChecked((c) => ({ ...c, [id]: !c[id] }));
    setExtras((xs) => xs.map((x) => (x.id === id ? { ...x, checked: !x.checked } : x)));
  }

  function addMissingToList() {
    const rec = recipes.find((r) => r.id === recipeId);
    const missing = rec.ingredients.filter((i) => !i.have);
    const exist = new Set(extras.map((e) => e.name.toLowerCase()));
    const add = missing
      .filter((i) => !exist.has(i.name.toLowerCase()))
      .map((i) => ({
        id: "m-" + Date.now() + i.id,
        name: i.name,
        amount: i.amount,
        unit: i.amount,
        category: i.category,
        checked: false,
        note: "",
      }));
    if (add.length) setExtras((xs) => [...xs, ...add]);
    setToast(missing.length + " Zutaten auf die Liste");
    setTab("shop");
    setView("main");
  }

  function assignRecipe(id) {
    setPlan((p) => ({ ...p, [day]: { ...(p[day] || {}), recipeId: id, meal: "Abend" } }));
    setPicker(false);
    setToast("Gericht zum Plan hinzugefügt");
  }

  function importUrl() {
    setImported(true);
    setToast("Rezept erkannt");
  }

  function saveImport() {
    assignRecipe("feta");
    setView("main");
    setTab("plan");
    setImported(false);
    setToast("Pasta mit Spinat und Feta gespeichert");
  }

  function addShopItem() {
    if (!newItem.trim()) return;
    setExtras((xs) => [
      ...xs,
      {
        id: "n-" + Date.now(),
        name: newItem.trim(),
        amount: "",
        unit: "",
        category: "Trockenware",
        checked: false,
        note: "",
      },
    ]);
    setNewItem("");
  }

  function addNote() {
    if (!newNote.trim()) return;
    setNotes((ns) => [{ id: "k" + Date.now(), type: "pin", title: newNote.trim(), text: "", pinned: true }, ...ns]);
    setNewNote("");
  }

  function suggestFromRest() {
    assignRecipe("feta");
    setTab("plan");
    setView("main");
    setToast("Vorschlag: Pasta mit Spinat und Feta");
  }

  return (
    <div className="shell">
      <div className="phone">
        <div className="status">
          <span>9:41</span>
          <span className="status-right">●●● LTE 🔋</span>
        </div>

        {view === "main" && tab === "plan" && (
          <div className="screen">
            <div className="top-row">
              <div className="logo">Kochzettel</div>
              <div className="household">
                <div className="avatars">
                  <img src="/img/anna.jpg" alt="Anna" />
                  <img src="/img/max.jpg" alt="Max" />
                </div>
                Anna & Max
              </div>
            </div>
            <div className="week">
              {DAYS.map((d) => (
                <button key={d.key} className={day === d.key ? "on" : ""} onClick={() => setDay(d.key)}>
                  <div className="d">{d.short}</div>
                  <div className="n">{d.date}</div>
                </button>
              ))}
            </div>
            <div className="month-label">August</div>
            {DAYS.filter((d) => plan[d.key]?.recipeId).map((d) => {
              const slot = plan[d.key];
              const rec = recipes.find((r) => r.id === slot.recipeId);
              if (!rec) return null;
              return (
                <article className="meal-card" key={d.key} onClick={() => openRecipe(rec.id)}>
                  <div>
                    <div className="dot-row">
                      <span className="dot" /> {d.label}
                    </div>
                    <h2 className="meal-title">{rec.title}</h2>
                    <div className="meta">
                      <span>⏱ {rec.time} Min</span>
                      <span>👥 {rec.servings} Personen</span>
                    </div>
                  </div>
                  <img className="meal-photo" src={rec.image} alt="" />
                  <div className="abend">{slot.meal} ›</div>
                  {slot.dayNote && <div className="chip-note">🛍 {slot.dayNote}</div>}
                </article>
              );
            })}
            {!Object.values(plan).some((p) => p?.recipeId) && (
              <div className="meal-card empty">Noch nichts geplant – + Gericht tippen</div>
            )}
          </div>
        )}

        {view === "main" && tab === "shop" && (
          <div className="screen">
            <div className="top-row">
              <div className="logo" style={{ fontSize: 28 }}>Kochzettel</div>
              <div className="header-tools">
                <span>🔔</span>
                <div className="avatar-m">M</div>
              </div>
            </div>
            <div className="shop-card">
              <div>
                <div className="shop-head"><h1>Wocheneinkauf</h1></div>
                <div className="shop-sub">REWE • nach Gang sortiert • geteilt mit Max</div>
              </div>
              <div className="progress" style={{ "--p": (done / total) * 100 }}>
                <span>{done} von {shopItems.length}</span>
              </div>
            </div>
            {maxInStore && (
              <button className="live" onClick={() => setMaxInStore(false)}>
                <i /> Max ist im Laden
              </button>
            )}
            <form className="add-form" onSubmit={(e) => { e.preventDefault(); addShopItem(); }}>
              <input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Artikel hinzufügen…" />
              <button type="submit">+</button>
            </form>
            {grouped.map(([cat, items]) => (
              <section key={cat}>
                <div className="cat">
                  <span>{CATEGORY_META[cat]?.emoji} {cat}</span>
                  <span>▾</span>
                </div>
                <div className="cat-list">
                  {items.map((it) => (
                    <div className={"item" + (it.checked ? " done" : "")} key={it.id}>
                      <button className={"check" + (it.checked ? " on" : "")} onClick={() => toggleExtra(it.id)} />
                      <div className="ie">{ITEM_EMOJI[it.name] || "🛒"}</div>
                      <div>
                        <div className="name">{it.amount ? it.amount + " " : ""}{it.name}</div>
                        {it.note && <div className="item-note">{it.note}</div>}
                      </div>
                      <div className="qty">{it.unit || it.amount}</div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {view === "main" && tab === "cook" && (
          <div className="screen">
            <div className="top-row">
              <div className="logo">Kochen</div>
              <button className="primary" style={{ width: "auto", margin: 0, padding: "8px 12px", fontSize: 14 }} onClick={() => setView("import")}>
                + Import
              </button>
            </div>
            <input className="search" placeholder="Rezepte suchen…" value={q} onChange={(e) => setQ(e.target.value)} />
            {recipes
              .filter((r) => r.title.toLowerCase().includes(q.toLowerCase()))
              .map((r) => (
                <article className="lib-card" key={r.id} onClick={() => openRecipe(r.id)}>
                  <img src={r.image} alt="" />
                  <div>
                    <h3 className="meal-title" style={{ fontSize: 20, margin: "4px 0" }}>{r.title}</h3>
                    <div className="meta"><span>⏱ {r.time} Min</span><span>👥 {r.servings}</span></div>
                  </div>
                </article>
              ))}
          </div>
        )}

        {view === "main" && tab === "notes" && (
          <div className="screen">
            <div className="logo" style={{ marginTop: 8 }}>Notizen & Reste</div>
            <div className="filters">
              {[
                ["alle", "Alle"],
                ["reste", "Reste"],
                ["rezepte", "Rezepte"],
                ["plan", "Plan"],
              ].map(([k, l]) => (
                <button key={k} className={nfilter === k ? "on" : ""} onClick={() => setNfilter(k)}>{l}</button>
              ))}
            </div>
            <form className="add-form" onSubmit={(e) => { e.preventDefault(); addNote(); }}>
              <input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Notiz schreiben…" />
              <button type="submit">+</button>
            </form>
            {notes
              .filter((n) => nfilter === "alle" || n.type === nfilter || (nfilter === "plan" && n.type === "pin"))
              .map((n) => (
                <article
                  key={n.id}
                  className={"ncard" + (n.type === "reste" ? " reste" : "") + (n.handwritten || n.type === "pin" || n.type === "plan" ? " paper" : "")}
                >
                  {n.image && <img src={n.image} alt="" />}
                  <div>
                    {n.pinned && <span className="pin">📌</span>}
                    {n.handwritten ? (
                      <div className="hand">{n.title}</div>
                    ) : (
                      <>
                        <h3 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 22, fontWeight: 500 }}>{n.title}</h3>
                        {n.text && <p style={{ color: "#5f5c56", marginTop: 4 }}>{n.type === "reste" ? "• " + n.text : n.text}</p>}
                      </>
                    )}
                    {n.action && (
                      <button className="primary" style={{ marginTop: 10 }} onClick={suggestFromRest}>
                        💡 {n.action}
                      </button>
                    )}
                  </div>
                </article>
              ))}
          </div>
        )}

        {view === "recipe" && recipe && (
          <div className="screen">
            <div className="detail-top">
              <button className="back" onClick={() => setView("main")}>‹</button>
              <div className="logo" style={{ fontSize: 22 }}>Kochzettel</div>
              <button className="icon-btn">🔖</button>
            </div>
            <img className="hero" src={recipe.image} alt="" />
            <h1 className="rtitle">{recipe.title}</h1>
            <div className="rmeta">
              <span>👥 {recipe.servings} Personen</span>
              <span>⏱ {recipe.time} Min</span>
              {recipe.tags.map((t) => <span className="tag" key={t}>{t}</span>)}
            </div>
            <div className="tabs">
              <button className={rtab === "zutaten" ? "on" : ""} onClick={() => setRtab("zutaten")}>Zutaten</button>
              <button className={rtab === "steps" ? "on" : ""} onClick={() => setRtab("steps")}>Zubereitung</button>
            </div>
            {rtab === "zutaten" ? (
              <ul className="ing">
                {recipe.ingredients.map((i) => (
                  <li key={i.id} onClick={() => toggleHave(i.id)}>
                    <span className={"check" + (i.have ? " on" : "")} />
                    <span>{i.amount ? i.amount + " " : ""}{i.name}</span>
                    {i.have && <span className="have">schon da</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <ol className="steps">
                {recipe.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            )}
            <button className="primary" onClick={addMissingToList}>🛍 Fehlende Zutaten auf Liste</button>
            <div className="note-box">
              <strong>☰ Deine Notiz:</strong>
              <textarea
                rows={2}
                value={recipe.note}
                onChange={(e) =>
                  setRecipes((rs) => rs.map((r) => (r.id === recipe.id ? { ...r, note: e.target.value } : r)))
                }
              />
            </div>
            <div className="source">🔗 importiert von {recipe.source}</div>
          </div>
        )}

        {view === "import" && (
          <div className="screen">
            <div className="detail-top">
              <button className="back" onClick={() => setView("main")}>‹</button>
              <div className="logo" style={{ fontSize: 20 }}>Rezept holen</div>
              <span />
            </div>
            <h1 className="rtitle" style={{ fontSize: 28 }}>Rezept aus dem Netz</h1>
            <p className="shop-sub">Hol dir Rezepte aus dem Internet – schnell und einfach in deine Kochzettel.</p>
            {[
              ["🔗", "Link einfügen", "Rezept per URL importieren"],
              ["📷", "Foto / Screenshot", "Rezeptbild oder Screenshot hochladen"],
              ["↗", "Teilen aus Browser", "Direkt aus Safari oder Chrome teilen"],
              ["▶", "Video TikTok / YouTube", "Rezept aus einem Video importieren"],
            ].map(([ic, t, s]) => (
              <button className="action" key={t} onClick={() => setImported(true)}>
                <div className="action-ic">{ic}</div>
                <div>
                  <b>{t}</b>
                  <small>{s}</small>
                </div>
              </button>
            ))}
            <div className="shop-sub" style={{ marginTop: 8 }}>ODER URL DIREKT EINFÜGEN</div>
            <div className="url-row">
              <input value={url} onChange={(e) => setUrl(e.target.value)} />
              <button onClick={importUrl}>Importieren</button>
            </div>
            {imported && (
              <>
                <div className="preview">
                  <img src="/img/pasta-feta.jpg" alt="" />
                  <div>
                    <b>Pasta mit Spinat und Feta</b>
                    <div className="meta"><span>⏱ 8 Zutaten erkannt</span></div>
                    <div className="meta"><span>✓ 6 Schritte erkannt</span></div>
                  </div>
                </div>
                <button className="primary" onClick={saveImport}>Im Plan speichern</button>
              </>
            )}
          </div>
        )}

        {tab === "plan" && view === "main" && (
          <button className="fab" onClick={() => setPicker(true)}>+ Gericht</button>
        )}
        {tab === "shop" && view === "main" && (
          <button className="mic" onClick={() => setToast("Sprich einen Artikel – Demo")}>🎤</button>
        )}
        {toast && <div className="toast">{toast}</div>}

        {picker && (
          <div className="picker" onClick={() => setPicker(false)}>
            <div className="sheet" onClick={(e) => e.stopPropagation()}>
              <h3>Gericht für {DAYS.find((d) => d.key === day)?.label}</h3>
              <button className="action" onClick={() => { setPicker(false); setView("import"); }}>
                <div className="action-ic">🌐</div>
                <div><b>Aus dem Internet</b><small>Link, Foto oder Video</small></div>
              </button>
              {recipes.map((r) => (
                <article className="lib-card" key={r.id} onClick={() => assignRecipe(r.id)}>
                  <img src={r.image} alt="" />
                  <div>
                    <h3 className="meal-title" style={{ fontSize: 18, margin: 0 }}>{r.title}</h3>
                    <div className="meta">{r.time} Min</div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {view !== "import" && (
          <nav className="nav">
            <button className={tab === "plan" ? "on" : ""} onClick={() => { setTab("plan"); setView("main"); }}>
              <Icon name="plan" /> Plan
            </button>
            <button className={tab === "cook" ? "on" : ""} onClick={() => { setTab("cook"); setView("main"); }}>
              <Icon name="cook" /> Kochen
            </button>
            <button className={tab === "shop" ? "on" : ""} onClick={() => { setTab("shop"); setView("main"); }}>
              <Icon name="shop" /> Laden
            </button>
            <button className={tab === "notes" ? "on" : ""} onClick={() => { setTab("notes"); setView("main"); }}>
              <Icon name="notes" /> Notizen
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}

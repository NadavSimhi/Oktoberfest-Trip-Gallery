const palette = [
  "linear-gradient(135deg, #0f766e, #d99a24)",
  "linear-gradient(135deg, #2563eb, #111827)",
  "linear-gradient(135deg, #c2410c, #f3d27a)",
  "linear-gradient(135deg, #111827, #0f766e)",
  "linear-gradient(135deg, #7c2d12, #2563eb)",
];

const fallbackGallery = {
  albums: [
    {
      id: "album-first-day",
      title: "יום ראשון במינכן",
      description: "נחיתה, אוכל ראשון בעיר והתארגנות לקראת המשחק.",
      tags: ["מינכן", "נחיתה", "אוכל"],
      people: ["נדב", "עדן", "יוסי"],
      coverMediaId: "sample-001",
    },
    {
      id: "album-basketball",
      title: "באיירן כדורסל",
      description: "הדרך ל-SAP Garden, אווירה, חטיפים ומשחק.",
      tags: ["כדורסל", "SAP Garden", "באיירן"],
      people: ["כולם"],
      coverMediaId: "sample-003",
    },
    {
      id: "album-food",
      title: "אוכל ושתייה",
      description: "כל המקומות שאכלנו בהם ומה ששווה לזכור.",
      tags: ["אוכל", "בירה", "מסעדות"],
      people: ["כולם"],
      coverMediaId: "sample-002",
    },
  ],
  media: [
    {
      id: "sample-001",
      type: "image",
      title: "הגעה למרכז העיר",
      description: "תמונת פתיחה מהדרך הראשונה בעיר אחרי הנחיתה.",
      sender: { displayName: "NadavS" },
      albumIds: ["album-first-day"],
      people: ["נדב", "עדן"],
      tags: ["מינכן", "דרך", "פתיחה"],
      createdAt: "2026-10-02T09:15:00+03:00",
      files: {},
    },
    {
      id: "sample-002",
      type: "image",
      title: "עצירת אוכל",
      description: "שולחן אוכל קבוצתי עם שתייה ונשנושים לפני המשך היום.",
      sender: { displayName: "אבישי" },
      albumIds: ["album-food"],
      people: ["כולם"],
      tags: ["אוכל", "בירה", "מסעדה"],
      createdAt: "2026-10-02T11:30:00+03:00",
      files: {},
    },
    {
      id: "sample-003",
      type: "video",
      title: "בדרך למשחק",
      description: "וידאו קצר מהדרך ל-SAP Garden והאווירה לפני המשחק.",
      sender: { displayName: "אנדריי" },
      albumIds: ["album-basketball"],
      people: ["יוסי", "נדב"],
      tags: ["כדורסל", "SAP Garden", "באיירן"],
      createdAt: "2026-10-02T18:45:00+03:00",
      files: {},
    },
  ],
};

const state = {
  gallery: fallbackGallery,
  query: "",
  album: "all",
  sender: "all",
  person: "all",
};

const els = {
  mediaCount: document.querySelector("#mediaCount"),
  albumFilter: document.querySelector("#albumFilter"),
  senderFilter: document.querySelector("#senderFilter"),
  personFilter: document.querySelector("#personFilter"),
  clearFilters: document.querySelector("#clearFilters"),
  albumGrid: document.querySelector("#albumGrid"),
  mediaGrid: document.querySelector("#mediaGrid"),
  resultSummary: document.querySelector("#resultSummary"),
  searchFab: document.querySelector("#searchFab"),
  searchPanel: document.querySelector("#searchPanel"),
  closeSearch: document.querySelector("#closeSearch"),
  searchInput: document.querySelector("#searchInput"),
  quickTags: document.querySelector("#quickTags"),
  albumTemplate: document.querySelector("#albumTemplate"),
  mediaTemplate: document.querySelector("#mediaTemplate"),
};

async function loadGallery() {
  try {
    const response = await fetch("./data/gallery.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`gallery.json ${response.status}`);
    const data = await response.json();
    state.gallery = normalizeGallery(data);
  } catch {
    state.gallery = fallbackGallery;
  }

  populateFilters();
  render();
}

function normalizeGallery(data) {
  return {
    albums: Array.isArray(data.albums) ? data.albums : [],
    media: Array.isArray(data.media) ? data.media : [],
  };
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "he"));
}

function populateSelect(select, label, values) {
  select.innerHTML = "";
  select.append(new Option(label, "all"));
  values.forEach((value) => select.append(new Option(value, value)));
}

function populateFilters() {
  const albumTitles = state.gallery.albums.map((album) => album.title);
  const senders = state.gallery.media.map((item) => item.sender?.displayName);
  const people = state.gallery.media.flatMap((item) => item.people || []);
  const tags = uniqueSorted(state.gallery.media.flatMap((item) => item.tags || [])).slice(0, 10);

  populateSelect(els.albumFilter, "כל האלבומים", uniqueSorted(albumTitles));
  populateSelect(els.senderFilter, "כל השולחים", uniqueSorted(senders));
  populateSelect(els.personFilter, "כל המצולמים", uniqueSorted(people));

  els.quickTags.innerHTML = "";
  tags.forEach((tag) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = tag;
    button.addEventListener("click", () => {
      state.query = tag;
      els.searchInput.value = tag;
      closeSearch();
      render();
    });
    els.quickTags.append(button);
  });
}

function mediaSearchText(item) {
  const albumTitles = albumNames(item.albumIds);
  return [
    item.title,
    item.description,
    item.sender?.displayName,
    ...(item.people || []),
    ...(item.tags || []),
    ...albumTitles,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function albumNames(albumIds = []) {
  return albumIds
    .map((id) => state.gallery.albums.find((album) => album.id === id)?.title)
    .filter(Boolean);
}

function filteredMedia() {
  const query = state.query.trim().toLowerCase();

  return state.gallery.media.filter((item) => {
    const itemAlbumNames = albumNames(item.albumIds);
    const matchesQuery = !query || mediaSearchText(item).includes(query);
    const matchesAlbum = state.album === "all" || itemAlbumNames.includes(state.album);
    const matchesSender = state.sender === "all" || item.sender?.displayName === state.sender;
    const matchesPerson = state.person === "all" || (item.people || []).includes(state.person);
    return matchesQuery && matchesAlbum && matchesSender && matchesPerson;
  });
}

function render() {
  const media = filteredMedia();
  renderAlbums(media);
  renderMedia(media);
  els.mediaCount.textContent = `${state.gallery.media.length} פריטי מדיה`;
  els.resultSummary.textContent =
    media.length === state.gallery.media.length
      ? "כל התמונות והסרטונים בגלריה"
      : `${media.length} תוצאות מתוך ${state.gallery.media.length}`;
}

function renderAlbums(visibleMedia) {
  const visibleIds = new Set(visibleMedia.flatMap((item) => item.albumIds || []));
  const albums = state.gallery.albums.filter((album) => visibleIds.has(album.id) || visibleMedia.length === 0);

  els.albumGrid.innerHTML = "";

  if (!albums.length) {
    els.albumGrid.innerHTML = `<div class="empty-state">אין אלבומים שמתאימים לחיפוש הנוכחי.</div>`;
    return;
  }

  albums.forEach((album, index) => {
    const node = els.albumTemplate.content.cloneNode(true);
    const card = node.querySelector(".album-card");
    const button = node.querySelector("button");
    const count = state.gallery.media.filter((item) => (item.albumIds || []).includes(album.id)).length;

    button.style.setProperty("--album-bg", palette[index % palette.length]);
    button.innerHTML = `
      <span>
        <strong>${escapeHtml(album.title)}</strong>
        ${escapeHtml(album.description || "")}
      </span>
      <span>${count} פריטים · ${(album.tags || []).slice(0, 3).map(escapeHtml).join(" · ")}</span>
    `;
    button.addEventListener("click", () => {
      state.album = album.title;
      els.albumFilter.value = album.title;
      render();
      document.querySelector(".media-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    els.albumGrid.append(card);
  });
}

function renderMedia(media) {
  els.mediaGrid.innerHTML = "";

  if (!media.length) {
    els.mediaGrid.innerHTML = `<div class="empty-state">לא נמצאו תמונות או סרטונים. נסו חיפוש אחר.</div>`;
    return;
  }

  media.forEach((item, index) => {
    const node = els.mediaTemplate.content.cloneNode(true);
    const card = node.querySelector(".media-card");
    const thumb = node.querySelector(".thumb");
    const meta = node.querySelector(".media-meta");
    const title = node.querySelector("h3");
    const description = node.querySelector("p");
    const tagRow = node.querySelector(".tag-row");
    const file = item.files?.thumb || item.files?.web || item.files?.original;

    thumb.dataset.type = item.type === "video" ? "וידאו" : "תמונה";
    thumb.style.setProperty("--thumb-bg", palette[index % palette.length]);
    if (file) {
      thumb.style.backgroundImage = `linear-gradient(180deg, transparent, rgba(17,24,39,.18)), url("${file}")`;
      thumb.style.backgroundSize = "cover";
      thumb.style.backgroundPosition = "center";
    }

    meta.textContent = `${item.sender?.displayName || "לא ידוע"} · ${formatDate(item.createdAt)}`;
    title.textContent = item.title || "ללא כותרת";
    description.textContent = item.description || "אין תיאור עדיין";

    [...(item.people || []), ...(item.tags || []).slice(0, 4)].forEach((tag) => {
      const chip = document.createElement("span");
      chip.className = "tag";
      chip.textContent = tag;
      tagRow.append(chip);
    });

    els.mediaGrid.append(card);
  });
}

function formatDate(value) {
  if (!value) return "ללא תאריך";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "ללא תאריך";
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function openSearch() {
  els.searchPanel.classList.add("is-open");
  els.searchPanel.setAttribute("aria-hidden", "false");
  els.searchInput.focus();
}

function closeSearch() {
  els.searchPanel.classList.remove("is-open");
  els.searchPanel.setAttribute("aria-hidden", "true");
}

els.albumFilter.addEventListener("change", (event) => {
  state.album = event.target.value;
  render();
});

els.senderFilter.addEventListener("change", (event) => {
  state.sender = event.target.value;
  render();
});

els.personFilter.addEventListener("change", (event) => {
  state.person = event.target.value;
  render();
});

els.clearFilters.addEventListener("click", () => {
  state.query = "";
  state.album = "all";
  state.sender = "all";
  state.person = "all";
  els.searchInput.value = "";
  els.albumFilter.value = "all";
  els.senderFilter.value = "all";
  els.personFilter.value = "all";
  render();
});

els.searchFab.addEventListener("click", openSearch);
els.closeSearch.addEventListener("click", closeSearch);
els.searchPanel.addEventListener("click", (event) => {
  if (event.target === els.searchPanel) closeSearch();
});
els.searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  render();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeSearch();
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openSearch();
  }
});

loadGallery();

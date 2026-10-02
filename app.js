const state = {
  gallery: { albums: [], media: [] },
  view: "timeline",
  query: "",
  album: "all",
};

const els = {
  views: {
    timeline: document.querySelector("#timelineView"),
    gallery: document.querySelector("#galleryView"),
    people: document.querySelector("#peopleView"),
    search: document.querySelector("#searchView"),
  },
  navItems: [...document.querySelectorAll(".nav-item")],
  albumGrid: document.querySelector("#albumGrid"),
  mediaGrid: document.querySelector("#mediaGrid"),
  searchInput: document.querySelector("#searchInput"),
  searchGrid: document.querySelector("#searchGrid"),
  quickTags: document.querySelector("#quickTags"),
  detailPanel: document.querySelector("#detailPanel"),
  closeDetail: document.querySelector("#closeDetail"),
  detailMedia: document.querySelector("#detailMedia"),
  detailTitle: document.querySelector("#detailTitle"),
  detailDescription: document.querySelector("#detailDescription"),
  detailMeta: document.querySelector("#detailMeta"),
  detailList: document.querySelector("#detailList"),
  detailTags: document.querySelector("#detailTags"),
  mediaTemplate: document.querySelector("#mediaTemplate"),
};

async function loadGallery() {
  try {
    const response = await fetch("./data/gallery.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`gallery.json ${response.status}`);
    state.gallery = normalizeGallery(await response.json());
  } catch {
    state.gallery = { albums: [], media: [] };
  }

  renderAll();
}

function normalizeGallery(data) {
  return {
    albums: Array.isArray(data.albums) ? data.albums : [],
    media: Array.isArray(data.media) ? data.media : [],
  };
}

function renderAll() {
  renderTimeline();
  renderGallery();
  renderPeople();
  renderSearch();
  switchView(state.view);
}

function sortedMedia() {
  return [...state.gallery.media].sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });
}

function renderTimeline() {
  const media = sortedMedia();
  els.views.timeline.innerHTML = "";

  const groups = groupByDate(media);
  Object.entries(groups).forEach(([date, items]) => {
    const group = document.createElement("section");
    group.className = "timeline-group";
    const strip = document.createElement("div");
    strip.className = "media-grid";
    group.append(createTinyLabel(date), strip);
    renderMediaInto(strip, items);
    els.views.timeline.append(group);
  });
}

function renderGallery() {
  const media = state.album === "all" ? sortedMedia() : sortedMedia().filter((item) => albumNames(item.albumIds).includes(state.album));
  renderAlbums();
  renderMediaInto(els.mediaGrid, media);
}

function renderAlbums() {
  els.albumGrid.innerHTML = "";
  const all = document.createElement("button");
  all.className = `album-pill ${state.album === "all" ? "is-active" : ""}`;
  all.type = "button";
  all.textContent = `All (${state.gallery.media.length})`;
  all.addEventListener("click", () => {
    state.album = "all";
    renderGallery();
  });
  els.albumGrid.append(all);

  state.gallery.albums.forEach((album) => {
    const count = state.gallery.media.filter((item) => (item.albumIds || []).includes(album.id)).length;
    const button = document.createElement("button");
    button.className = `album-pill ${state.album === album.title ? "is-active" : ""}`;
    button.type = "button";
    button.textContent = `${album.title} (${count})`;
    button.addEventListener("click", () => {
      state.album = album.title;
      renderGallery();
    });
    els.albumGrid.append(button);
  });
}

function renderPeople() {
  els.views.people.innerHTML = "";
  const people = uniqueSorted(state.gallery.media.flatMap((item) => item.people || []));

  if (!people.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No people tags yet";
    els.views.people.append(empty);
    return;
  }

  people.forEach((person) => {
    const items = sortedMedia().filter((item) => (item.people || []).includes(person));
    const group = document.createElement("section");
    group.className = "timeline-group";
    const strip = document.createElement("div");
    strip.className = "media-grid";
    group.append(createTinyLabel(`${person} (${items.length})`), strip);
    renderMediaInto(strip, items);
    els.views.people.append(group);
  });
}

function renderSearch() {
  const tags = uniqueSorted(state.gallery.media.flatMap((item) => item.tags || [])).slice(0, 16);
  els.quickTags.innerHTML = "";
  tags.forEach((tag) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = tag;
    button.addEventListener("click", () => {
      state.query = tag;
      els.searchInput.value = tag;
      renderSearchResults();
    });
    els.quickTags.append(button);
  });
  renderSearchResults();
}

function renderSearchResults() {
  const query = state.query.trim().toLowerCase();
  const media = !query ? sortedMedia() : sortedMedia().filter((item) => mediaSearchText(item).includes(query));
  renderMediaInto(els.searchGrid, media);
}

function renderMediaInto(container, media) {
  container.innerHTML = "";

  if (!media.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No media";
    container.append(empty);
    return;
  }

  media.forEach((item) => {
    const node = els.mediaTemplate.content.cloneNode(true);
    const card = node.querySelector(".media-card");
    const button = node.querySelector(".thumb-button");
    const thumb = node.querySelector(".thumb");
    const file = item.files?.thumb || item.files?.web || item.files?.original;

    button.setAttribute("aria-label", item.title || "Open media");
    if (file) {
      thumb.style.backgroundImage = `url("${file}")`;
    } else {
      thumb.classList.add("is-missing");
      thumb.textContent = item.type === "video" ? "Video" : "Photo";
    }
    if (item.type === "video") card.classList.add("is-video");
    button.addEventListener("click", () => openDetail(item));
    container.append(card);
  });
}

function switchView(view) {
  state.view = view;
  Object.entries(els.views).forEach(([name, el]) => el.classList.toggle("is-active", name === view));
  els.navItems.forEach((button) => button.classList.toggle("is-active", button.dataset.view === view));
  if (view === "search") els.searchInput.focus();
}

function groupByDate(media) {
  return media.reduce((groups, item) => {
    const date = formatDay(item.createdAt);
    groups[date] ||= [];
    groups[date].push(item);
    return groups;
  }, {});
}

function createTinyLabel(text) {
  const label = document.createElement("p");
  label.className = "tiny-label";
  label.textContent = text;
  return label;
}

function openDetail(item) {
  const file = item.files?.web || item.files?.original || item.files?.thumb;
  els.detailPanel.querySelector(".detail-card")?.classList.remove("show-info");
  els.detailMedia.innerHTML = "";

  if (file && item.type === "video") {
    const video = document.createElement("video");
    video.src = file;
    video.controls = true;
    video.playsInline = true;
    els.detailMedia.append(video);
  } else if (file) {
    const image = document.createElement("img");
    image.src = file;
    image.alt = item.title || "Gallery image";
    els.detailMedia.append(image);
  } else {
    els.detailMedia.textContent = item.type === "video" ? "Video" : "Photo";
  }

  els.detailTitle.textContent = item.title || "Untitled";
  els.detailDescription.textContent = item.description || "";
  els.detailMeta.textContent = `${item.sender?.displayName || "Unknown"} · ${formatDate(item.createdAt)}`;
  els.detailList.innerHTML = "";
  addDetail("Albums", albumNames(item.albumIds).join(", ") || "None");
  addDetail("People", (item.people || []).join(", ") || "Not tagged");

  els.detailTags.innerHTML = "";
  (item.tags || []).forEach((tag) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "tag";
    chip.textContent = tag;
    chip.addEventListener("click", () => {
      state.query = tag;
      els.searchInput.value = tag;
      closeDetail();
      switchView("search");
      renderSearchResults();
    });
    els.detailTags.append(chip);
  });

  els.detailPanel.classList.add("is-open");
  els.detailPanel.setAttribute("aria-hidden", "false");
}

function addDetail(label, value) {
  const dt = document.createElement("dt");
  const dd = document.createElement("dd");
  dt.textContent = label;
  dd.textContent = value;
  els.detailList.append(dt, dd);
}

function closeDetail() {
  els.detailPanel.classList.remove("is-open");
  els.detailPanel.setAttribute("aria-hidden", "true");
  els.detailPanel.querySelector(".detail-card")?.classList.remove("show-info");
  els.detailMedia.innerHTML = "";
}

function toggleDetailInfo() {
  els.detailPanel.querySelector(".detail-card")?.classList.toggle("show-info");
}

function albumNames(albumIds = []) {
  return albumIds
    .map((id) => state.gallery.albums.find((album) => album.id === id)?.title)
    .filter(Boolean);
}

function mediaSearchText(item) {
  return [
    item.title,
    item.description,
    item.sender?.displayName,
    ...(item.people || []),
    ...(item.tags || []),
    ...albumNames(item.albumIds),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function formatDay(value) {
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime())) return "No date";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(date);
}

function formatDate(value) {
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime())) return "No date";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

els.navItems.forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.view));
});

els.searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderSearchResults();
});

els.closeDetail.addEventListener("click", closeDetail);
els.detailMedia.addEventListener("click", toggleDetailInfo);
els.detailPanel.addEventListener("click", (event) => {
  if (event.target === els.detailPanel) closeDetail();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeDetail();
});

loadGallery();

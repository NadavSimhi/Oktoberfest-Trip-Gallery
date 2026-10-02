const fallbackGallery = { albums: [], media: [] };

const state = {
  gallery: fallbackGallery,
  query: "",
  album: "all",
  sender: "all",
  person: "all",
};

const els = {
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
  detailPanel: document.querySelector("#detailPanel"),
  closeDetail: document.querySelector("#closeDetail"),
  detailMedia: document.querySelector("#detailMedia"),
  detailTitle: document.querySelector("#detailTitle"),
  detailDescription: document.querySelector("#detailDescription"),
  detailMeta: document.querySelector("#detailMeta"),
  detailList: document.querySelector("#detailList"),
  detailTags: document.querySelector("#detailTags"),
  albumTemplate: document.querySelector("#albumTemplate"),
  mediaTemplate: document.querySelector("#mediaTemplate"),
};

async function loadGallery() {
  try {
    const response = await fetch("./data/gallery.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`gallery.json ${response.status}`);
    state.gallery = normalizeGallery(await response.json());
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
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function populateSelect(select, label, values) {
  select.innerHTML = "";
  select.append(new Option(label, "all"));
  values.forEach((value) => select.append(new Option(value, value)));
}

function populateFilters() {
  populateSelect(
    els.albumFilter,
    "All albums",
    uniqueSorted(state.gallery.albums.map((album) => album.title)),
  );
  populateSelect(
    els.senderFilter,
    "All senders",
    uniqueSorted(state.gallery.media.map((item) => item.sender?.displayName)),
  );
  populateSelect(
    els.personFilter,
    "All people",
    uniqueSorted(state.gallery.media.flatMap((item) => item.people || [])),
  );

  const tags = uniqueSorted(state.gallery.media.flatMap((item) => item.tags || [])).slice(0, 14);
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
  els.resultSummary.textContent =
    media.length === state.gallery.media.length
      ? `${state.gallery.media.length} items`
      : `${media.length} of ${state.gallery.media.length} items`;
}

function renderAlbums(visibleMedia) {
  const visibleIds = new Set(visibleMedia.flatMap((item) => item.albumIds || []));
  const albums = state.gallery.albums.filter((album) => visibleIds.has(album.id) || visibleMedia.length === 0);

  els.albumGrid.innerHTML = "";
  albums.forEach((album) => {
    const node = els.albumTemplate.content.cloneNode(true);
    const button = node.querySelector(".album-pill");
    const count = state.gallery.media.filter((item) => (item.albumIds || []).includes(album.id)).length;
    button.textContent = `${album.title} (${count})`;
    button.classList.toggle("is-active", state.album === album.title);
    button.addEventListener("click", () => {
      state.album = state.album === album.title ? "all" : album.title;
      els.albumFilter.value = state.album;
      render();
    });
    els.albumGrid.append(button);
  });
}

function renderMedia(media) {
  els.mediaGrid.innerHTML = "";

  if (!media.length) {
    els.mediaGrid.innerHTML = `<div class="empty-state">No matching media found.</div>`;
    return;
  }

  media.forEach((item) => {
    const node = els.mediaTemplate.content.cloneNode(true);
    const card = node.querySelector(".media-card");
    const button = node.querySelector(".thumb-button");
    const thumb = node.querySelector(".thumb");
    const file = item.files?.thumb || item.files?.web || item.files?.original;

    button.setAttribute("aria-label", `Open ${item.title || "media item"}`);
    if (file) {
      thumb.style.backgroundImage = `url("${file}")`;
    } else {
      thumb.classList.add("is-missing");
      thumb.textContent = item.type === "video" ? "Video" : "Photo";
    }

    if (item.type === "video") {
      card.classList.add("is-video");
    }

    button.addEventListener("click", () => openDetail(item));
    els.mediaGrid.append(card);
  });
}

function openDetail(item) {
  const file = item.files?.web || item.files?.original || item.files?.thumb;
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
  els.detailDescription.textContent = item.description || "No description yet.";
  els.detailMeta.textContent = `${item.sender?.displayName || "Unknown sender"} · ${formatDate(item.createdAt)}`;
  els.detailList.innerHTML = "";
  addDetail("Albums", albumNames(item.albumIds).join(", ") || "None");
  addDetail("People", (item.people || []).join(", ") || "Not tagged yet");
  addDetail("Type", item.type || "image");

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
      render();
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
  els.detailMedia.innerHTML = "";
}

function formatDate(value) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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

els.closeDetail.addEventListener("click", closeDetail);
els.detailPanel.addEventListener("click", (event) => {
  if (event.target === els.detailPanel) closeDetail();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeSearch();
    closeDetail();
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openSearch();
  }
});

loadGallery();

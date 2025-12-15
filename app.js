/* global Swiper, GLightbox */

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "class") node.className = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) node.setAttribute(k, String(v));
  });
  for (const c of children) node.append(c);
  return node;
}

function safeText(str) {
  return (str ?? "").toString();
}

function buildSocialLinks(links, mount) {
  mount.innerHTML = "";
  for (const link of links || []) {
    const a = el("a", {
      class: "pill",
      href: link.url,
      target: "_blank",
      rel: "noopener noreferrer"
    }, [document.createTextNode(safeText(link.label))]);
    mount.append(a);
  }
}

function buildCTA(cta, mount) {
  mount.innerHTML = "";
  for (const item of cta || []) {
    const a = el("a", {
      class: "btn",
      href: item.url,
      target: item.url.startsWith("mailto:") ? "_self" : "_blank",
      rel: "noopener noreferrer"
    }, [document.createTextNode(safeText(item.label))]);
    mount.append(a);
  }
}

function buildPhotoSlides(photos, wrapper) {
  wrapper.innerHTML = "";
  for (const p of photos || []) {
    // GLightbox: use <a class="glightbox" href="full">
    const link = el("a", {
      class: "glightbox",
      href: p.src,
      "data-gallery": "photos",
      "data-title": p.caption || "",
	  "data-width": "100vw",
	  "data-height": "100vh"
    });

    const fig = el("figure", { class: "card figure" });
    const img = el("img", {
      class: "mediaThumb",
      src: p.thumb || p.src,
      alt: p.caption || "Фото"
    });

    const cap = el("figcaption", { class: "caption" }, [
      document.createTextNode(safeText(p.caption || "Фото"))
    ]);

    fig.append(img, cap);
    link.append(fig);

    const slide = el("div", { class: "swiper-slide" });
    slide.append(link);
    wrapper.append(slide);
  }
}

function youtubeThumb(id) {
  // good default thumbnail
  return `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;
}

function buildVideoSlides(videos, wrapper, onOpen) {
  wrapper.innerHTML = "";
  for (const v of videos || []) {
    const fig = el("figure", { class: "card figure" });

    const img = el("img", {
      class: "mediaThumb",
      src: youtubeThumb(v.youtubeId),
      alt: v.caption || "Видео"
    });

    const overlay = el("div", { class: "playBadge" }, [
      el("div", { class: "playIcon", "aria-hidden": "true" }, [
        document.createTextNode("▶")
      ])
    ]);

    const cap = el("figcaption", { class: "caption" }, [
      document.createTextNode(safeText(v.caption || "Видео"))
    ]);

    fig.append(img, overlay, cap);

    const btn = el("button", {
      type: "button",
      class: "unstyledBtn",
      "aria-label": `Открыть видео: ${safeText(v.caption || "")}`,
      onclick: () => onOpen(v.youtubeId, v.caption || "")
    });
    // Make button cover the whole card
    btn.style.all = "unset";
    btn.style.cursor = "pointer";
    btn.style.display = "block";
    btn.append(fig);

    const slide = el("div", { class: "swiper-slide" });
    slide.append(btn);
    wrapper.append(slide);
  }
}

function initSwiper(selector, opts = {}) {
  return new Swiper(selector, {
    slidesPerView: 1.15,
    spaceBetween: 12,
    grabCursor: true,
    watchOverflow: true,
    pagination: {
      el: `${selector} .swiper-pagination`,
      clickable: true
    },
    navigation: {
      nextEl: `${selector} .swiper-button-next`,
      prevEl: `${selector} .swiper-button-prev`
    },
    breakpoints: {
      560: { slidesPerView: 2.05, spaceBetween: 12 },
      980: { slidesPerView: 2.2, spaceBetween: 14 },
      1180: { slidesPerView: 2.35, spaceBetween: 14 }
    },
    ...opts
  });
}

function setupVideoModal() {
  const modal = document.getElementById("videoModal");
  const closeBtn = document.getElementById("modalClose");
  const frame = document.getElementById("ytFrame");
  const caption = document.getElementById("videoCaption");

  function open(youtubeId, text) {
    // privacy-friendly domain
    const url = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}?rel=0&modestbranding=1`;
    frame.src = url;
    caption.textContent = text || "";
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function close() {
    modal.setAttribute("aria-hidden", "true");
    frame.src = ""; // stop playback
    caption.textContent = "";
    document.body.style.overflow = "";
  }

  closeBtn.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.getAttribute && t.getAttribute("data-close") === "true") close();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false") close();
  });

  return { open, close };
}

async function main() {
  const res = await fetch("./media.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Не удалось загрузить media.json: ${res.status}`);
  const data = await res.json();

  // Profile
  document.getElementById("brand").textContent = data.profile?.name || "Визитка";
  document.getElementById("profileName").textContent = data.profile?.name || "";
  document.getElementById("profileTitle").textContent = data.profile?.title || "";
  document.getElementById("profileAbout").textContent = data.profile?.about || "";

  const photoEl = document.getElementById("profilePhoto");
  photoEl.src = data.profile?.photo || "";
  photoEl.alt = data.profile?.name ? `Фото: ${data.profile.name}` : "Фото профиля";

  buildSocialLinks(data.profile?.links, document.getElementById("socialLinks"));
  buildCTA(data.profile?.cta, document.getElementById("ctaRow"));

  // Gallery
  const videoModal = setupVideoModal();

  buildPhotoSlides(data.photos, document.getElementById("photoWrapper"));
  buildVideoSlides(data.videos, document.getElementById("videoWrapper"), videoModal.open);

  // init lightbox
  GLightbox({ selector: ".glightbox" });

  // init swipers
  initSwiper(".photoSwiper");
  initSwiper(".videoSwiper");

  // footer
  const year = new Date().getFullYear();
  document.getElementById("footerText").textContent = `© ${data.profile?.name || ""} · ${year}`;
}

function buildPhotoSlides(photos, wrapper) {
  wrapper.innerHTML = "";
  for (const p of photos || []) {
    const link = el("a", {
      class: "glightbox",
      href: p.src,
      "data-gallery": "photos"
    });

    const fig = el("figure", { class: "card figure" });
    const img = el("img", {
      class: "mediaThumb",
      src: p.thumb || p.src,
      alt: p.caption || "Фото"
    });

    fig.append(img);
    link.append(fig);

    const slide = el("div", { class: "swiper-slide" });
    slide.append(link);
    wrapper.append(slide);
  }
}

main().catch((err) => {
  console.error(err);
  document.body.innerHTML = `
    <div style="padding:20px;font-family:system-ui;color:white">
      <h2>Ошибка загрузки</h2>
      <pre style="white-space:pre-wrap;opacity:.85">${String(err)}</pre>
      <p style="opacity:.75">Проверь, что рядом лежит <b>media.json</b> и сайт запущен через http-сервер (не file://).</p>
    </div>
  `;
});

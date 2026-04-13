(function () {
  const EXPENSE_URL =
    "https://drive.google.com/file/d/1MWqffcPAzERlKSW_Qp-dph9G808UmO5O/view?usp=drive_link";
  const AFTERSCHOOL_PAY_URL =
    "https://drive.google.com/file/d/16Nc2oCjoHVBOExbE1mRIWFdJk_x7--re/view?usp=drive_link";

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFC")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(text) {
    return normalize(text)
      .split(" ")
      .map((token) => token.trim())
      .filter(Boolean);
  }

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeRegExp(text) {
    return String(text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function setDownloadLinks() {
    const afterschoolPay = document.getElementById("downloadAfterschoolpay");
    const expense = document.getElementById("downloadExpense");

    if (afterschoolPay) afterschoolPay.href = AFTERSCHOOL_PAY_URL;
    if (expense) expense.href = EXPENSE_URL;
  }

  function openSectionForHash() {
    const raw = (window.location.hash || "").replace(/^#/, "");
    if (!raw) return;

    let id = raw;
    try {
      id = decodeURIComponent(raw);
    } catch (_) {}

    const target = document.getElementById(id);
    if (!target) return;

    if (target.matches(".home-category-section")) {
      const details = target.querySelector(".home-accordion");
      if (details) details.open = true;
      return;
    }

    const parentCategory = target.closest(".home-category-section");
    if (parentCategory) {
      const details = parentCategory.querySelector(".home-accordion");
      if (details) details.open = true;
    }
  }

  function readQueryFromUrl() {
    try {
      const url = new URL(window.location.href);
      return url.searchParams.get("q") || "";
    } catch (_) {
      return "";
    }
  }

  function writeQueryToUrl(query) {
    try {
      const url = new URL(window.location.href);
      const normalized = String(query || "").trim();

      if (normalized) {
        url.searchParams.set("q", normalized);
      } else {
        url.searchParams.delete("q");
      }

      history.replaceState(null, "", url.pathname + url.search + url.hash);
    } catch (_) {}
  }


  function shouldOpenLinkInNewTab(anchor) {
    if (!anchor) return false;

    const href = String(anchor.getAttribute("href") || "").trim();
    if (!href || href === "#" || href.startsWith("#")) return false;
    if (/^(javascript:|tel:|sms:)/i.test(href)) return false;
    return true;
  }

  function decorateHomeLinks(root) {
    const scope = root || document;
    const links = Array.from(scope.querySelectorAll('a[href]'));

    links.forEach((link) => {
      if (!shouldOpenLinkInNewTab(link)) {
        return;
      }

      link.setAttribute("target", "_blank");

      const rel = new Set(
        String(link.getAttribute("rel") || "")
          .split(/\s+/)
          .map((value) => value.trim())
          .filter(Boolean)
      );

      rel.add("noopener");
      link.setAttribute("rel", Array.from(rel).join(" "));
    });
  }

  function navigateFromLink(anchor) {
  if (!anchor) return;

  const href = String(anchor.getAttribute("href") || "").trim();
  if (!href || href === "#") return;

  if (href.startsWith("#")) {
    window.location.hash = href.slice(1);
    return;
  }

  if (shouldOpenLinkInNewTab(anchor)) {
    window.open(href, "_blank", "noopener");
    return;
  }

  window.location.href = href;
}

function isInteractiveTarget(target) {
  return !!(
    target &&
    target.closest("a, button, input, select, textarea, summary, details, label")
  );
}

function makeIndexCardsClickable(root) {
  const scope = root || document;
  const cards = Array.from(scope.querySelectorAll(".home-index-item"));

  cards.forEach((card) => {
    const primaryLink = card.querySelector(
      ".home-index-item-title a[href], .home-card-cta[href], a[href]"
    );
    const redundantButtons = Array.from(card.querySelectorAll(".home-index-open"));

    redundantButtons.forEach((button) => button.remove());

    if (!primaryLink) return;

    const href = primaryLink.getAttribute("href") || "";
    const titleText = (
      card.querySelector(".home-index-item-title") ||
      card.querySelector(".home-card-title") ||
      primaryLink
    ).textContent || "";

    const opensNewTab = shouldOpenLinkInNewTab(primaryLink);

    card.classList.add("is-card-link");
    card.dataset.cardHref = href;
    card.setAttribute("role", "link");
    card.setAttribute("tabindex", "0");
    card.setAttribute(
      "aria-label",
      titleText.trim() + (opensNewTab ? " 새 탭에서 열기" : " 열기")
    );

    if (card.__cardLinkBound === true) return;
    card.__cardLinkBound = true;

    card.addEventListener("click", (event) => {
      if (event.defaultPrevented) return;
      if (isInteractiveTarget(event.target)) return;
      navigateFromLink(primaryLink);
    });

    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      navigateFromLink(primaryLink);
    });
  });
}

  function bindSearch() {
  const searchSection = document.getElementById("home-search");
  const form = document.getElementById("homeSearchForm");
  const submitBtn = document.getElementById("homeSearchSubmit");
  const input = document.getElementById("homeSearchInput");
  const resetBtn = document.getElementById("homeSearchReset");
  const status = document.getElementById("homeSearchStatus");

  if (!searchSection || !input || !resetBtn || !status) {
    return;
  }

  const hasExplicitSubmit = !!(form || submitBtn);
  let liveSearchTimer = null;

  let outputWrap = document.getElementById("homeSearchOutput");
  if (!outputWrap) {
    outputWrap = document.createElement("div");
    outputWrap.id = "homeSearchOutput";
    outputWrap.className = "home-search-output";
    outputWrap.hidden = true;
  }

  let resultPanel = document.getElementById("homeSearchResults");
  let resultGrid = document.getElementById("homeSearchResultGrid");

  if (!resultPanel) {
    resultPanel = document.createElement("section");
    resultPanel.id = "homeSearchResults";
    resultPanel.className = "card home-search-results";
    resultPanel.hidden = true;
    resultPanel.setAttribute("aria-labelledby", "homeSearchResultsTitle");
    resultPanel.innerHTML =
      '<div class="home-search-results-head">' +
      '  <div>' +
      '    <p class="home-section-kicker">검색 결과</p>' +
      '    <h3 class="home-card-title" id="homeSearchResultsTitle">해당하는 기능 카드</h3>' +
      '  </div>' +
      '  <p class="muted">대표 기능과 전체 업무 목록에서 일치하는 기능 카드를 우선 보여줍니다.</p>' +
      '</div>' +
      '<div class="home-search-result-grid" id="homeSearchResultGrid"></div>';
    resultGrid = resultPanel.querySelector("#homeSearchResultGrid");
  } else if (!resultGrid) {
    resultGrid = document.createElement("div");
    resultGrid.id = "homeSearchResultGrid";
    resultGrid.className = "home-search-result-grid";
    resultPanel.appendChild(resultGrid);
  }

  let empty = document.getElementById("homeSearchEmpty");
  if (!empty) {
    empty = document.createElement("div");
    empty.id = "homeSearchEmpty";
    empty.className = "card home-empty-state";
    empty.hidden = true;
    empty.innerHTML =
      '<h3 class="local-h3">검색 결과가 없습니다.</h3>' +
      '<p>단어를 조금 줄이거나, 다른 조합으로 다시 검색해 보세요. 예: 연차 / 사회보험 엑셀 / 통상임금</p>';
  }

  if (status.nextElementSibling !== outputWrap) {
    status.insertAdjacentElement("afterend", outputWrap);
  }

  if (!outputWrap.contains(resultPanel)) {
    outputWrap.appendChild(resultPanel);
  }

  if (!outputWrap.contains(empty)) {
    outputWrap.appendChild(empty);
  }

  const allItems = Array.from(document.querySelectorAll(".js-search-item"));
  const searchableSections = Array.from(
    document.querySelectorAll(".home-search-scope")
  );
  const categorySections = Array.from(
    document.querySelectorAll(".home-category-section")
  );
  const chips = Array.from(document.querySelectorAll(".home-search-chip"));
  const sectionLabels = {
    "home-features": "대표 기능",
    "home-packages": "업무 패키지",
    "home-all-tools": "전체 업무 목록",
  };

  const highlightTargets = Array.from(
    document.querySelectorAll(
      [
        ".js-search-item .home-card-title",
        ".js-search-item .home-card-desc",
        ".js-search-item .home-index-item-title a",
        ".js-search-item .home-meta-list dd",
        ".js-search-item .home-compact-meta dd",
      ].join(",")
    )
  );

  function getItemPriority(item) {
    if (item.classList.contains("home-feature-card")) return 0;
    if (item.classList.contains("home-index-item")) return 1;
    if (item.classList.contains("home-package-card")) return 2;
    return 3;
  }

  function getPrimaryHref(item) {
    const link = item.querySelector(
      ".home-card-cta[href], .home-index-open[href], .home-index-item-title a[href], a[href]"
    );
    return link ? link.getAttribute("href") || "" : "";
  }

  const itemRecords = allItems.map((item, index) => ({
    item,
    index,
    priority: getItemPriority(item),
    href: getPrimaryHref(item),
    haystack: normalize(item.getAttribute("data-search")),
  }));

  highlightTargets.forEach((element) => {
    if (!element.dataset.searchOriginalText) {
      element.dataset.searchOriginalText = element.textContent || "";
    }
  });

  categorySections.forEach((section) => {
    const details = section.querySelector(".home-accordion");
    const meta = section.querySelector(".home-accordion-meta");

    if (details) {
      details.dataset.defaultOpen = details.open ? "true" : "false";
    }

    if (meta && !meta.dataset.defaultText) {
      meta.dataset.defaultText = meta.textContent.trim();
    }
  });

  let appliedQuery = "";

  function buildStateFromQuery(query) {
    const normalizedQuery = String(query || "").trim();
    const tokens = tokenize(normalizedQuery);
    const active = tokens.length > 0;

    if (!active) {
      return {
        query: normalizedQuery,
        active: false,
        tokens,
        matches: [],
        matchSet: new Set(),
      };
    }

    const rawMatches = itemRecords
      .filter((record) => tokens.every((token) => record.haystack.includes(token)))
      .sort((a, b) => a.priority - b.priority || a.index - b.index);

    const seen = new Set();
    const matches = [];

    rawMatches.forEach((record) => {
      const key = record.href || "item-" + record.index;
      if (seen.has(key)) return;
      seen.add(key);
      matches.push(record.item);
    });

    return {
      query: normalizedQuery,
      active: true,
      tokens,
      matches,
      matchSet: new Set(matches),
    };
  }

  function countMatchesInSection(section, matches) {
    return matches.filter((item) => section.contains(item)).length;
  }

  function updateStatus(state) {
    if (!state.active) {
      status.textContent =
        "대표 기능, 업무 패키지, 전체 업무 목록에서 총 " +
        allItems.length +
        "개 항목을 찾을 수 있습니다.";
      return;
    }

    const parts = searchableSections.map((section) => {
      const label = sectionLabels[section.id] || "항목";
      const count = countMatchesInSection(section, state.matches);
      return label + " " + count + "개";
    });

    status.textContent =
      "검색 결과 " + state.matches.length + "개 · " + parts.join(" / ");
  }

  function restoreDefaultAccordionState() {
    categorySections.forEach((section) => {
      const details = section.querySelector(".home-accordion");
      if (!details) return;
      details.open = details.dataset.defaultOpen === "true";
    });
  }

  function setChipState(query) {
    const normalizedQuery = normalize(query);

    chips.forEach((chip) => {
      const chipQuery = normalize(chip.getAttribute("data-query"));
      const active = chipQuery === normalizedQuery && normalizedQuery !== "";
      chip.classList.toggle("is-active", active);
      chip.setAttribute("aria-pressed", String(active));
    });
  }

  function restoreHighlights() {
    highlightTargets.forEach((element) => {
      if (!element.dataset.searchOriginalText) return;
      element.textContent = element.dataset.searchOriginalText;
    });
  }

  function applyHighlights(tokens) {
    if (!tokens.length) {
      restoreHighlights();
      return;
    }

    const uniqueTokens = Array.from(new Set(tokens))
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);

    if (!uniqueTokens.length) {
      restoreHighlights();
      return;
    }

    const sourcePattern =
      "(" + uniqueTokens.map((token) => escapeRegExp(token)).join("|") + ")";
    const splitPattern = new RegExp(sourcePattern, "gi");
    const matchPattern = new RegExp("^" + sourcePattern + "$", "i");

    highlightTargets.forEach((element) => {
      const originalText = element.dataset.searchOriginalText || "";
      if (!originalText) return;

      const parts = originalText.split(splitPattern);
      element.innerHTML = parts
        .map((part) => {
          if (!part) return "";
          const safe = escapeHtml(part);
          return matchPattern.test(part)
            ? '<mark class="home-search-mark">' + safe + "</mark>"
            : safe;
        })
        .join("");
    });
  }

  function updateCategoryMeta(active, matches) {
    categorySections.forEach((section) => {
      const meta = section.querySelector(".home-accordion-meta");
      if (!meta) return;

      if (active) {
        meta.textContent = countMatchesInSection(section, matches) + "개 일치";
      } else {
        meta.textContent = meta.dataset.defaultText || meta.textContent;
      }
    });
  }

  function renderResults(state) {
    resultGrid.innerHTML = "";

    if (!state.active || !state.matches.length) {
      resultPanel.hidden = true;
      return;
    }

    const fragment = document.createDocumentFragment();

    state.matches.forEach((item) => {
      const clone = item.cloneNode(true);
      clone.hidden = false;
      clone.removeAttribute("hidden");
      clone.classList.remove("js-search-item");
      clone.classList.add("home-search-result-card");
      clone.removeAttribute("data-search");
      fragment.appendChild(clone);
    });

    resultGrid.appendChild(fragment);
    decorateHomeLinks(resultGrid);
    makeIndexCardsClickable(resultGrid);
    resultPanel.hidden = false;
  }

  function refreshResetVisibility() {
    const hasInput = String(input.value || "").trim() !== "";
    const hasApplied = String(appliedQuery || "").trim() !== "";
    resetBtn.hidden = !(hasInput || hasApplied);
  }

  function resetSearch(options) {
    const opts = options || {};

    input.value = "";
    appliedQuery = "";

    allItems.forEach((item) => {
      item.hidden = false;
    });

    searchableSections.forEach((section) => {
      section.hidden = false;
    });

    categorySections.forEach((section) => {
      section.hidden = false;
    });

    outputWrap.hidden = true;
    empty.hidden = true;
    resultPanel.hidden = true;
    resultGrid.innerHTML = "";

    restoreHighlights();
    updateCategoryMeta(false, []);
    restoreDefaultAccordionState();
    updateStatus({ active: false, matches: [] });
    setChipState("");
    refreshResetVisibility();

    if (opts.syncUrl !== false) {
      writeQueryToUrl("");
    }

    if (!opts.skipFocus) {
      input.focus();
    }
  }

  function applySearch(query, options) {
    const opts = options || {};
    const state = buildStateFromQuery(query);
    appliedQuery = state.query;
    input.value = state.query;

    allItems.forEach((item) => {
      item.hidden = state.active ? !state.matchSet.has(item) : false;
    });

    if (state.active) {
      searchableSections.forEach((section) => {
        section.hidden = true;
      });

      categorySections.forEach((section) => {
        const details = section.querySelector(".home-accordion");
        const matchCount = countMatchesInSection(section, state.matches);
        if (details) {
          details.open = matchCount > 0;
        }
      });
    } else {
      searchableSections.forEach((section) => {
        section.hidden = false;
      });
      categorySections.forEach((section) => {
        section.hidden = false;
      });
      restoreDefaultAccordionState();
    }

    outputWrap.hidden = !state.active;
    empty.hidden = !(state.active && state.matches.length === 0);
    updateStatus(state);
    updateCategoryMeta(state.active, state.matches);
    restoreHighlights();
    applyHighlights(state.tokens);
    renderResults(state);
    setChipState(state.query);
    refreshResetVisibility();

    if (opts.syncUrl !== false) {
      writeQueryToUrl(state.query);
    }
  }

  function queueLiveSearch() {
    if (hasExplicitSubmit) return;

    if (liveSearchTimer) {
      window.clearTimeout(liveSearchTimer);
    }

    const value = input.value;

    liveSearchTimer = window.setTimeout(() => {
      if (!String(value || "").trim()) {
        resetSearch({ skipFocus: true });
        return;
      }
      applySearch(value, { scroll: false });
    }, 180);
  }

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      applySearch(input.value);
    });
  } else if (submitBtn) {
    submitBtn.addEventListener("click", (event) => {
      event.preventDefault();
      applySearch(input.value);
    });
  }

  input.addEventListener("input", () => {
    setChipState(input.value);
    refreshResetVisibility();
    queueLiveSearch();
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      resetSearch();
      return;
    }

    if (event.key === "Enter" && !form) {
      event.preventDefault();
      applySearch(input.value);
    }
  });

  resetBtn.addEventListener("click", () => {
    resetSearch();
  });

  chips.forEach((chip) => {
    chip.setAttribute("aria-pressed", "false");
    chip.addEventListener("click", () => {
      input.value = chip.getAttribute("data-query") || "";
      setChipState(input.value);
      refreshResetVisibility();

      if (hasExplicitSubmit) {
        input.focus();
        return;
      }

      applySearch(input.value, { scroll: false });
      input.focus();
    });
  });

  const initialQuery = readQueryFromUrl();
  if (initialQuery) {
    input.value = initialQuery;
    applySearch(initialQuery, { syncUrl: false, scroll: false });
    return;
  }

  resetSearch({ syncUrl: false, skipFocus: true });
}

  function init() {
    if (!document.body.classList.contains("home-page")) return;
    setDownloadLinks();
    decorateHomeLinks(document);
    makeIndexCardsClickable(document);
    bindSearch();
    openSectionForHash();
    window.addEventListener("hashchange", openSectionForHash);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

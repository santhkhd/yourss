// JS: UI (Home)
document.addEventListener("DOMContentLoaded", () => {
  const state = {
    all: [],
    filtered: [],
    search: "",
    sortBy: "year",
    sortDirection: "desc", // Default: latest year to older
    page: 1,
    pageSize: 36,
  };

  const els = {
    search: document.getElementById("searchInput"),
    sort: document.getElementById("sortSelect"),
    sortDirectionBtn: document.getElementById("sortDirectionBtn"),
    grid: document.getElementById("movieGrid"),
    loadMore: document.getElementById("loadMoreBtn"),
    themeToggle: document.getElementById("themeToggle"),
    template: document.getElementById("movieCardTemplate"),
  };

  const init = async () => {
    attachEvents();
    state.all = await MovieStore.loadMovies();
    runPipeline();
    prepInfiniteScroll();
  };

  const attachEvents = () => {
    els.search.addEventListener("input", debounce((e) => {
      state.search = e.target.value.trim().toLowerCase();
      resetPage();
    }, 150));

    els.sort.addEventListener("change", (e) => {
      state.sortBy = e.target.value;
      resetPage();
    });

    els.sortDirectionBtn.addEventListener("click", () => {
      state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
      updateSortDirectionIcon();
      resetPage();
    });

    els.loadMore.addEventListener("click", () => {
      state.page += 1;
      renderMovies();
    });

    els.themeToggle.addEventListener("click", () => {
      const mode = ThemeManager.toggleTheme();
      els.themeToggle.textContent = mode === "dark" ? "🌙" : "☀️";
    });
  };

  const updateSortDirectionIcon = () => {
    const svg = els.sortDirectionBtn.querySelector("svg path");
    if (state.sortDirection === "asc") {
      svg.setAttribute("d", "M7 14l5-5 5 5z");
      els.sortDirectionBtn.setAttribute("aria-label", "Sort ascending");
    } else {
      svg.setAttribute("d", "M7 10l5 5 5-5z");
      els.sortDirectionBtn.setAttribute("aria-label", "Sort descending");
    }
  };

  const resetPage = () => {
    state.page = 1;
    runPipeline();
  };

  const runPipeline = () => {
    const filtered = state.all.filter((movie) => {
      if (!state.search) return true;
      const haystack = [
        movie.title,
        movie.plot,
        movie.director,
        movie.writer,
        movie.genre.join(" "),
        movie.cast.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(state.search);
    });

    state.filtered = sortList(filtered, state.sortBy, state.sortDirection);
    renderMovies(true);
  };

  const parseRuntime = (runtime) => {
    if (!runtime || typeof runtime !== "string") return 0;
    // Extract minutes from strings like "120 min", "2h 30min", etc.
    const match = runtime.match(/(\d+)\s*(?:min|m|minutes?)/i);
    if (match) return Number(match[1]);
    const hourMatch = runtime.match(/(\d+)\s*h/i);
    if (hourMatch) return Number(hourMatch[1]) * 60;
    return 0;
  };

  const parseReleaseDate = (released) => {
    if (!released || typeof released !== "string") return 0;
    // Try to parse dates like "31 Oct 1931", "2020-01-15", etc.
    const date = new Date(released);
    return isNaN(date.getTime()) ? 0 : date.getTime();
  };

  const sortList = (list, sortBy, direction) => {
    const sorted = [...list];
    const factor = direction === "asc" ? 1 : -1;
    
    sorted.sort((a, b) => {
      switch (sortBy) {
        case "popularity":
          // Use rating as popularity proxy, fallback to year
          const aPop = a.rating || (a.year ? a.year / 100 : 0);
          const bPop = b.rating || (b.year ? b.year / 100 : 0);
          return (bPop - aPop) * factor;
        
        case "rating":
          const aRating = a.rating || 0;
          const bRating = b.rating || 0;
          return (bRating - aRating) * factor;
        
        case "runtime":
          const aRuntime = parseRuntime(a.runtime);
          const bRuntime = parseRuntime(b.runtime);
          return (bRuntime - aRuntime) * factor;
        
        case "year":
          const aYear = a.year ? Number(a.year) : 0;
          const bYear = b.year ? Number(b.year) : 0;
          if (aYear === 0 && bYear === 0) return 0;
          if (aYear === 0) return 1 * factor;
          if (bYear === 0) return -1 * factor;
          return (bYear - aYear) * factor;
        
        case "released":
          const aReleased = parseReleaseDate(a.released);
          const bReleased = parseReleaseDate(b.released);
          return (bReleased - aReleased) * factor;
        
        case "title":
          return a.title.localeCompare(b.title) * factor;
        
        default:
          return 0;
      }
    });
    
    return sorted;
  };

  const renderMovies = (reset = false) => {
    if (reset) els.grid.innerHTML = "";
    const limit = state.page * state.pageSize;
    const slice = state.filtered.slice(0, limit);
    const fragment = document.createDocumentFragment();
    const favoritesSet = new Set(
      MovieStore.getFavorites().map((fav) => `${fav.id}`)
    );

    slice.forEach((movie) => {
      const card = els.template.content.cloneNode(true);
      const img = card.querySelector("img");
      const defaultImg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450'%3E%3Crect width='300' height='450' fill='%23111827'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff' font-family='Arial' font-size='16'%3ENo Image%3C/text%3E%3C/svg%3E";
      
      img.src = movie.poster || defaultImg;
      img.alt = `${movie.title} poster`;
      img.onerror = function() {
        this.src = defaultImg;
      };

      card.querySelector(".movie-card__title").textContent = movie.title;
      
      const yearEl = card.querySelector(".movie-card__year");
      if (movie.year) {
        yearEl.textContent = movie.year;
        yearEl.style.display = "block";
      } else {
        yearEl.style.display = "none";
      }
      
      const ratingEl = card.querySelector(".movie-card__rating");
      if (movie.rating) {
        ratingEl.textContent = movie.rating.toFixed(1);
        ratingEl.style.display = "block";
      } else {
        ratingEl.style.display = "none";
      }

      const link = card.querySelector(".movie-card__link");
      link.href = `details.html?id=${movie.id}`;

      const favBtn = card.querySelector(".movie-card__favorite");
      const isFavorite = favoritesSet.has(`${movie.id}`);
      favBtn.classList.toggle("is-active", isFavorite);
      favBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const currentlyFavorite = MovieStore.isFavorite(movie.id);
        if (currentlyFavorite) {
          MovieStore.removeFavorite(movie.id);
          favBtn.classList.remove("is-active");
          favoritesSet.delete(`${movie.id}`);
          MovieStore.showToast("Removed from favorites");
        } else {
          MovieStore.addFavorite(movie);
          favBtn.classList.add("is-active");
          favoritesSet.add(`${movie.id}`);
          MovieStore.showToast("Added to favorites");
        }
      });

      fragment.appendChild(card);
    });

    els.grid.appendChild(fragment);
    els.loadMore.style.display =
      state.filtered.length > slice.length ? "inline-flex" : "none";
  };

  const prepInfiniteScroll = () => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (state.page * state.pageSize < state.filtered.length) {
            state.page += 1;
            renderMovies();
          }
        }
      });
    });
    observer.observe(els.loadMore);
  };

  function debounce(fn, delay = 200) {
    let id;
    return (...args) => {
      clearTimeout(id);
      id = setTimeout(() => fn(...args), delay);
    };
  }

  init();
});

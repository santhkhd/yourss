// JS: Cast Page
document.addEventListener("DOMContentLoaded", async () => {
  const state = {
    all: [],
    selectedCast: null,
    castMap: new Map(),
  };

  const els = {
    castSearch: document.getElementById("castSearchInput"),
    castGrid: document.getElementById("castGrid"),
    moviesGrid: document.getElementById("moviesGrid"),
    castMoviesTitle: document.getElementById("castMoviesTitle"),
    castTemplate: document.getElementById("castCardTemplate"),
    movieTemplate: document.getElementById("movieCardTemplate"),
    themeToggle: document.getElementById("themeToggle"),
  };

  const init = async () => {
    els.themeToggle.addEventListener("click", () => {
      const mode = ThemeManager.toggleTheme();
      els.themeToggle.textContent = mode === "dark" ? "🌙" : "☀️";
    });

    state.all = await MovieStore.loadMovies();
    
    // Build cast map
    state.all.forEach(movie => {
      if (movie.cast && movie.cast.length > 0) {
        movie.cast.forEach(castName => {
          if (castName && castName.trim()) {
            const name = castName.trim();
            if (!state.castMap.has(name)) {
              state.castMap.set(name, []);
            }
            state.castMap.get(name).push(movie);
          }
        });
      }
    });

    // Check if cast is selected from URL
    const params = new URLSearchParams(window.location.search);
    const castParam = params.get("cast");
    if (castParam) {
      state.selectedCast = decodeURIComponent(castParam);
      renderMoviesForCast(state.selectedCast);
    } else {
      renderCast();
    }

    els.castSearch.addEventListener("input", debounce((e) => {
      const query = e.target.value.trim().toLowerCase();
      renderCast(query);
    }, 200));
  };

  const renderCast = (searchQuery = "") => {
    els.castGrid.style.display = "grid";
    els.moviesGrid.style.display = "none";
    els.castGrid.innerHTML = "";

    let castList = Array.from(state.castMap.entries());
    
    if (searchQuery) {
      castList = castList.filter(([name]) => 
        name.toLowerCase().includes(searchQuery)
      );
    }

    castList.sort((a, b) => {
      // Sort by movie count (descending), then by name
      if (b[1].length !== a[1].length) {
        return b[1].length - a[1].length;
      }
      return a[0].localeCompare(b[0]);
    });

    const fragment = document.createDocumentFragment();

    castList.forEach(([castName, movies]) => {
      const card = els.castTemplate.content.cloneNode(true);
      const link = card.querySelector(".cast-card__link");
      const nameEl = card.querySelector(".cast-card__name");
      const countEl = card.querySelector(".cast-card__count");
      
      nameEl.textContent = castName;
      countEl.textContent = `${movies.length} movie${movies.length !== 1 ? 's' : ''}`;
      
      link.addEventListener("click", () => {
        state.selectedCast = castName;
        renderMoviesForCast(castName);
        window.history.pushState({}, "", `?cast=${encodeURIComponent(castName)}`);
      });

      fragment.appendChild(card);
    });

    els.castGrid.appendChild(fragment);
  };

  const renderMoviesForCast = (castName) => {
    els.castGrid.style.display = "none";
    els.moviesGrid.style.display = "grid";
    els.castMoviesTitle.textContent = `Movies with ${castName} (${state.castMap.get(castName)?.length || 0})`;
    els.moviesGrid.innerHTML = "";
    els.moviesGrid.appendChild(els.castMoviesTitle);

    const movies = state.castMap.get(castName) || [];
    movies.sort((a, b) => {
      if (b.rating && a.rating) return b.rating - a.rating;
      if (b.rating) return 1;
      if (a.rating) return -1;
      if (b.year && a.year) return b.year - a.year;
      return a.title.localeCompare(b.title);
    });

    const fragment = document.createDocumentFragment();
    const defaultImg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450'%3E%3Crect width='300' height='450' fill='%23111827'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff' font-family='Arial' font-size='16'%3ENo Image%3C/text%3E%3C/svg%3E";

    movies.forEach(movie => {
      const card = els.movieTemplate.content.cloneNode(true);
      const img = card.querySelector("img");
      img.src = movie.poster || defaultImg;
      img.alt = `${movie.title} poster`;
      img.onerror = function() {
        this.src = defaultImg;
      };

      card.querySelector(".movie-card__title").textContent = movie.title;
      const ratingEl = card.querySelector(".movie-card__rating");
      if (movie.rating) {
        ratingEl.textContent = movie.rating.toFixed(1);
        ratingEl.style.display = "block";
      } else {
        ratingEl.style.display = "none";
      }

      card.querySelector(".movie-card__link").href = `details.html?id=${movie.id}`;
      fragment.appendChild(card);
    });

    els.moviesGrid.appendChild(fragment);
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


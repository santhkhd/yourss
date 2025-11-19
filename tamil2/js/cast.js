// JS: Cast Page
document.addEventListener("DOMContentLoaded", async () => {
  const state = {
    all: [],
    selectedPerson: null,
    peopleMap: new Map(),
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
    buildPeopleMap();

    const params = new URLSearchParams(window.location.search);
    const castParam = params.get("cast");
    if (castParam) {
      state.selectedPerson = decodeURIComponent(castParam);
      renderMoviesForPerson(state.selectedPerson);
    } else {
      renderPeople();
    }

    els.castSearch.addEventListener("input", debounce((e) => {
      const query = e.target.value.trim().toLowerCase();
      renderPeople(query);
    }, 200));
  };

  const extractNames = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === "string") {
      return value
        .split(/[,/;&]/)
        .map((name) => name.trim())
        .filter(Boolean);
    }
    return [];
  };

  const addPerson = (rawName, movie, role) => {
    if (!rawName) return;
    const name = rawName.trim();
    if (!name) return;

    if (!state.peopleMap.has(name)) {
      state.peopleMap.set(name, { movies: [], roles: new Set() });
    }

    const person = state.peopleMap.get(name);
    if (!person.movies.some((m) => m.id === movie.id)) {
      person.movies.push(movie);
    }
    person.roles.add(role);
  };

  const buildPeopleMap = () => {
    state.peopleMap.clear();
    state.all.forEach((movie) => {
      if (Array.isArray(movie.cast)) {
        movie.cast.forEach((castName) => addPerson(castName, movie, "Cast"));
      }
      extractNames(movie.director).forEach((directorName) =>
        addPerson(directorName, movie, "Director")
      );
    });
  };

  const renderPeople = (searchQuery = "") => {
    els.castGrid.style.display = "grid";
    els.moviesGrid.style.display = "none";
    els.castGrid.innerHTML = "";

    let peopleList = Array.from(state.peopleMap.entries());
    
    if (searchQuery) {
      peopleList = peopleList.filter(([name]) => 
        name.toLowerCase().includes(searchQuery)
      );
    }

    peopleList.sort((a, b) => {
      // Sort by movie count (descending), then by name
      if (b[1].movies.length !== a[1].movies.length) {
        return b[1].movies.length - a[1].movies.length;
      }
      return a[0].localeCompare(b[0]);
    });

    const fragment = document.createDocumentFragment();

    peopleList.forEach(([personName, personData]) => {
      const card = els.castTemplate.content.cloneNode(true);
      const link = card.querySelector(".cast-card__link");
      const nameEl = card.querySelector(".cast-card__name");
      const roleEl = card.querySelector(".cast-card__role");
      const countEl = card.querySelector(".cast-card__count");
      
      nameEl.textContent = personName;
      const roles = Array.from(personData.roles);
      roleEl.textContent = roles.length ? roles.join(" · ") : "Contributor";
      const movieCount = personData.movies.length;
      countEl.textContent = `${movieCount} movie${movieCount !== 1 ? 's' : ''}`;
      
      link.addEventListener("click", () => {
        state.selectedPerson = personName;
        renderMoviesForPerson(personName);
        window.history.pushState({}, "", `?cast=${encodeURIComponent(personName)}`);
      });

      fragment.appendChild(card);
    });

    els.castGrid.appendChild(fragment);
  };

  const renderMoviesForPerson = (personName) => {
    els.castGrid.style.display = "none";
    els.moviesGrid.style.display = "grid";
    const total = state.peopleMap.get(personName)?.movies.length || 0;
    els.castMoviesTitle.textContent = `Movies with ${personName} (${total})`;
    els.moviesGrid.innerHTML = "";
    els.moviesGrid.appendChild(els.castMoviesTitle);

    const movies = state.peopleMap.get(personName)?.movies || [];
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
      const hasRating = typeof movie.rating === "number" && !Number.isNaN(movie.rating);
      if (hasRating) {
        ratingEl.textContent = movie.rating.toFixed(1);
        ratingEl.classList.remove("is-missing");
      } else {
        ratingEl.textContent = "NR";
        ratingEl.classList.add("is-missing");
      }
      ratingEl.style.display = "block";

      const yearEl = card.querySelector(".movie-card__year");
      yearEl.textContent = movie.year ? `Year: ${movie.year}` : "Year: N/A";
      yearEl.style.display = "block";

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


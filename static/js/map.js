(() => {
  const tooltip = document.getElementById("map-tooltip");
  const details = document.getElementById("map-details");
  const mapSvg = document.getElementById("world-map");
  if (!tooltip || !details || !mapSvg) {
    return;
  }

  let posts = [];
  if (Array.isArray(window.__mapPosts)) {
    posts = window.__mapPosts;
  } else if (typeof window.__mapPosts === "string") {
    try {
      posts = JSON.parse(window.__mapPosts);
    } catch (error) {
      posts = [];
    }
  }

  // Fix B: normalize the list of countries that have posts for highlighting
  const countriesWithPosts = (Array.isArray(window.__countriesWithPosts)
    ? window.__countriesWithPosts
    : []
  ).map((c) => normalize(c));
  const normalize = (value) =>
    String(value || "")
      .trim()
      .toLowerCase();

  const grouped = posts.reduce((acc, post) => {
    const key = normalize(post.country_key || post.country);
    if (!key) {
      return acc;
    }
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(post);
    return acc;
  }, {});

  const escapeHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const renderDetails = (countryKey, label) => {
    const normalizedKey = normalize(countryKey || label);
    let items = grouped[normalizedKey] || [];
    if (!items.length && label) {
      items = posts.filter((post) => normalize(post.country) === normalizedKey);
    }
    if (!items.length) {
      details.innerHTML = `
        <div class="map-empty">
          <h3>${escapeHtml(label)}</h3>
          <p>No itineraries yet. Add a post to start this route.</p>
        </div>
      `;
      return;
    }

    const cards = items
      .map(
        (post) => `
          <article class="map-post">
            <img src="${escapeHtml(post.cover)}" alt="${escapeHtml(post.title)} cover" loading="lazy" />
            <div>
              <p class="map-meta">${escapeHtml(post.date)} · ${escapeHtml(post.location)}</p>
              <h4><a href="${escapeHtml(post.url)}">${escapeHtml(post.title)}</a></h4>
              <p>${escapeHtml(post.summary)}</p>
            </div>
          </article>
        `
      )
      .join("");

    const countrySlug = normalize(label).replace(/\s+/g, "-");
    details.innerHTML = `
      <div class="map-header">
        <h3>${escapeHtml(label)}</h3>
        <a class="map-country-link" href="/countries/${countrySlug}/">${items.length} itineraries →</a>
      </div>
      <div class="map-posts">
        ${cards}
      </div>
    `;
  };

  const getOffset = (event) => {
    const bounds = event.currentTarget.ownerSVGElement.getBoundingClientRect();
    const x = event.clientX - bounds.left + 12;
    const y = event.clientY - bounds.top - 12;
    return { x, y };
  };

  const positionTooltip = (event) => {
    const { x, y } = getOffset(event);
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
  };

  const bindRegionEvents = () => {
    const regions = document.querySelectorAll(".map-region");
    regions.forEach((region) => {
      region.addEventListener("mouseenter", (event) => {
        const label = region.getAttribute("data-label") || "";
        tooltip.textContent = label;
        tooltip.classList.add("is-visible");
        positionTooltip(event);
        region.classList.add("is-active");
      });

      region.addEventListener("mousemove", (event) => {
        positionTooltip(event);
      });

      region.addEventListener("mouseleave", () => {
        tooltip.classList.remove("is-visible");
        region.classList.remove("is-active");
      });

      region.addEventListener("click", () => {
        const countryKey = region.getAttribute("data-country") || "";
        const label = region.getAttribute("data-label") || countryKey;
        regions.forEach((item) => item.classList.remove("is-selected"));
        region.classList.add("is-selected");
        renderDetails(countryKey, label);
      });
    });
  };

  const buildPath = (coordinates, width, height) => {
    const project = ([lon, lat]) => [
      ((lon + 180) / 360) * width,
      ((90 - lat) / 180) * height,
    ];

    const line = (points) =>
      points
        .map((point, index) => {
          const [x, y] = project(point);
          return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(" ") + " Z";

    if (!coordinates.length) {
      return "";
    }

    return coordinates.map((ring) => line(ring)).join(" ");
  };

  const renderGeoJson = (geojson) => {
    const width = mapSvg.viewBox.baseVal.width || 1000;
    const height = mapSvg.viewBox.baseVal.height || 500;

    geojson.features.forEach((feature) => {
      const name = feature.properties && feature.properties.name ? feature.properties.name : "";
      const geometry = feature.geometry;
      if (!geometry || !geometry.coordinates || !name) {
        return;
      }

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      let d = "";
      if (geometry.type === "Polygon") {
        d = buildPath(geometry.coordinates, width, height);
      } else if (geometry.type === "MultiPolygon") {
        d = geometry.coordinates.map((poly) => buildPath(poly, width, height)).join(" ");
      }

      if (!d) {
        return;
      }

      const countryKey = normalize(name);
      const hasPosts = countriesWithPosts.includes(countryKey);
      path.setAttribute("d", d);
      path.setAttribute("class", hasPosts ? "map-region has-posts" : "map-region");
      path.setAttribute("data-country", countryKey);
      path.setAttribute("data-label", name);
      mapSvg.appendChild(path);
    });

    bindRegionEvents();
  };

  const loadGeoJson = async () => {
    try {
      const response = await fetch("/data/world.geojson");
      if (!response.ok) {
        throw new Error("Failed to load map data");
      }
      const geojson = await response.json();
      renderGeoJson(geojson);
    } catch (error) {
      details.innerHTML = `
        <div class="map-empty">
          <h3>Map unavailable</h3>
          <p>We couldn't load the world map data. Please refresh the page.</p>
        </div>
      `;
    }
  };

  loadGeoJson();
})();

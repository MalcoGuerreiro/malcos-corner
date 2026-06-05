const state = {
  activeTab: 'all',
  muted: localStorage.getItem('malco-muted') === 'true'
};

const feed = document.querySelector('#content-feed');
const tabButtons = document.querySelectorAll('.tab-button');
const clickSound = document.querySelector('#click-sound');
const muteToggle = document.querySelector('#mute-toggle');
const recommendationForm = document.querySelector('#recommendation-form');
const recommendationMessage = document.querySelector('#recommendation-message');

const projects = window.MALCO_PROJECTS || [];
const games = window.MALCO_GAMES || [];
const things = window.MALCO_THINGS || [];
const links = window.MALCO_LINKS || [];

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function playClick() {
  if (state.muted || !clickSound) return;
  clickSound.currentTime = 0;
  clickSound.volume = 0.16;
  clickSound.play().catch(() => {});
}

function updateMuteButton() {
  if (!muteToggle) return;
  muteToggle.textContent = state.muted ? 'sound: off' : 'sound: on';
}

function setActiveTab(tabName) {
  state.activeTab = tabName;

  tabButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tabName);
  });

  renderTab(tabName);
}

function contentCard(title, body, extra = '') {
  return `
    <article class="content-card card">
      <p class="eyebrow">malco corner</p>
      <h2>${escapeHtml(title)}</h2>
      <div class="big-copy">${body}</div>
      ${extra}
    </article>
  `;
}

function renderWelcome() {
  return contentCard(
    'welcome to my corner',
    `<p>this is my little corner of the internet.</p>
     <p>Everything you'll see here is just something my mind found interesting enough to end up here.</p>`
  );
}

function renderAbout() {
  return contentCard(
    'about',
    `<p>i’m Malco.</p>
     <p>computer engineering student (at CESUPA) from brazil, professional overthinker, and someone currently trying to make code feel less like homework and more like something personal.</p>
     <p>i like music, games, cars, and lots of random stuff that make things feel alive.</p>
     <p>i’m still figuring out what kind of developer i want to become, but this site is part of that process.</p>`
  );
}

function renderProjects() {
  if (!projects.length) {
    return contentCard('projects', `<p class="empty-state">nothing here yet.\n\ni’m not putting fake projects here just to look productive.</p>`);
  }

  const cards = projects.map((project) => `
    <article class="project-card card-clickable">
      <h3>${escapeHtml(project.name)}</h3>
      <p>${escapeHtml(project.description)}</p>
      <p class="status-pill">${escapeHtml(project.status)}</p>
      <div class="project-techs">
        ${(project.technologies || []).map((tech) => `<span class="soft-tag">${escapeHtml(tech)}</span>`).join('')}
      </div>
      ${project.link ? `<p><a href="${escapeHtml(project.link)}" target="_blank" rel="noreferrer">open project →</a></p>` : ''}
    </article>
  `).join('');

  return contentCard('projects', `<p>real projects, real ideas, and things that are actually being built.</p>`, `<div class="card-grid">${cards}</div>`);
}

function renderMusic() {
  return contentCard(
    'music',
    `<p>this part is mostly about what is playing right now and songs people think i should listen to.</p>
     <p>the now playing card uses Last.fm, so it shows what im listening to.</p>
     <p>(recommendations are saved privately for your information)</p>`
  );
}

function renderGames() {
  if (!games.length) {
    return contentCard('games', `<p class="empty-state">no games here yet.\n\nwhich is weird, honestly.</p>`);
  }

  const cards = games.map((game) => `
    <article class="game-card card-clickable">
      <div class="cover-frame">
        ${game.cover ? `<img src="${escapeHtml(game.cover)}" alt="${escapeHtml(game.title)} cover">` : '▣'}
      </div>
      <h3>${escapeHtml(game.title)}</h3>
      ${game.status ? `<p class="status-pill">${escapeHtml(game.status)}</p>` : ''}
    </article>
  `).join('');

  return contentCard('games', `<p>just a small list of games i like. no long reviews, no fake deep takes.</p>`, `<div class="card-grid">${cards}</div>`);
}

function renderThings() {
  if (!things.length) {
    return contentCard('things i’m into', `<p class="empty-state">nothing here right now.\n\nmy brain is buffering.</p>`);
  }

  const cards = things.map((thing) => `
    <article class="thing-card card-clickable">
      <div class="thing-image">
        ${thing.image ? `<img src="${escapeHtml(thing.image)}" alt="${escapeHtml(thing.title)}">` : '✦'}
      </div>
      <p class="eyebrow">${escapeHtml(thing.category)}</p>
      <h3>${escapeHtml(thing.title)}</h3>
      <p>${escapeHtml(thing.note)}</p>
    </article>
  `).join('');

  return contentCard('things i’m into', `<p>a small moodboard of things living rent free in my head.</p>`, `<div class="card-grid">${cards}</div>`);
}

function renderLinks() {
  if (!links.length) {
    return contentCard('links', `<p class="empty-state">no links added yet.</p>`);
  }

  const cards = links.map((link) => `
    <a class="link-card card-clickable" href="${escapeHtml(link.url)}" target="${link.url.startsWith('mailto:') ? '_self' : '_blank'}" rel="noreferrer">
      <span class="link-icon">${escapeHtml(link.icon)}</span>
      <span>
        <h3>${escapeHtml(link.name)}</h3>
        <p>${escapeHtml(link.description)}</p>
      </span>
    </a>
  `).join('');

  return contentCard('links', `<p>a tiny link in bio, but with more personality.</p>`, `<div class="card-grid">${cards}</div>`);
}

function renderAll() {
  return [
    renderWelcome(),
    contentCard('small previews', `<p>music, games, ideas, projects, links, and whatever else feels worth keeping around.</p>`),
    renderProjects(),
    renderThings()
  ].join('');
}

function renderTab(tabName) {
  const views = {
    all: renderAll,
    about: renderAbout,
    projects: renderProjects,
    music: renderMusic,
    games: renderGames,
    things: renderThings,
    links: renderLinks
  };

  feed.innerHTML = (views[tabName] || views.all)();
}

async function fetchNowPlaying() {
  const container = document.querySelector('#now-playing');
  if (!container) return;

  try {
    const response = await fetch('/api/lastfm/now-playing');
    const data = await response.json();

    if (!data.ok && data.configured === false) {
      container.innerHTML = `
        <div class="album-cover placeholder-cover">?</div>
        <div>
          <p class="track-status">idle</p>
          <p class="track-name">not configured yet.</p>
          <p class="track-artist">add Last.fm in .env</p>
        </div>
      `;
      return;
    }

    if (!data.ok) throw new Error(data.message || 'Last.fm error');

    if (!data.hasTrack || !data.nowPlaying) {
  container.innerHTML = `
    <div class="album-cover placeholder-cover">?</div>
    <div>
      <p class="track-status">idle</p>
      <p class="track-name">nothing on rn.</p>
      <p class="track-artist">silence hours...
    </div>
  `;
  return;
}

    const coverMarkup = data.cover
      ? `<img class="album-cover" src="${escapeHtml(data.cover)}" alt="album cover">`
      : `<div class="album-cover placeholder-cover">no</div>`;

    container.innerHTML = `
      ${coverMarkup}
      <div>
        <p class="track-status">${escapeHtml(data.status)}</p>
        <p class="track-name">${escapeHtml(data.name)}</p>
        <p class="track-artist">${escapeHtml(data.artist)}</p>
      </div>
    `;
  } catch (error) {
    container.innerHTML = `
      <div class="album-cover placeholder-cover">:(</div>
      <div>
        <p class="track-status">error</p>
        <p class="track-name">couldn’t load the song :(</p>
        <p class="track-artist">try again in a bit.</p>
      </div>
    `;
  }
}

async function submitRecommendation(event) {
  event.preventDefault();
  playClick();

  const formData = new FormData(recommendationForm);
  const payload = Object.fromEntries(formData.entries());
  const song = String(payload.artist_song || '').trim();

  if (!song) {
    recommendationMessage.textContent = 'fill the song first :)';
    return;
  }

  recommendationMessage.textContent = 'please wait...';

  try {
    const response = await fetch('/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    recommendationMessage.textContent = data.message || (response.ok ? 'recommendation sent :)' : 'couldn’t send it :(');

    if (response.ok) recommendationForm.reset();
  } catch (error) {
    recommendationMessage.textContent = 'couldn’t send it :(\ntry again in a bit.';
  }
}

function updateClock() {
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  const weekday = now.toLocaleDateString('en-US', { weekday: 'short' });
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');

  document.querySelector('#clock-time').textContent = time;
  document.querySelector('#clock-date').textContent = `${weekday} ${day}/${month}`;
}

function updateStats() {
  const statsList = document.querySelector('#stats-list');
  if (!statsList) return;

  statsList.innerHTML = `
    <li><span>projects</span><strong>${projects.length}</strong></li>
    <li><span>games listed</span><strong>${games.length}</strong></li>
    <li><span>things</span><strong>${things.length}</strong></li>
  `;
}

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    playClick();
    setActiveTab(button.dataset.tab);
  });
});

document.addEventListener('click', (event) => {
  const target = event.target.closest('button, a, .card-clickable');
  if (target && !target.classList.contains('tab-button') && target.id !== 'mute-toggle') {
    playClick();
  }
});

muteToggle?.addEventListener('click', () => {
  state.muted = !state.muted;
  localStorage.setItem('malco-muted', String(state.muted));
  updateMuteButton();
  if (!state.muted) playClick();
});

recommendationForm?.addEventListener('submit', submitRecommendation);

updateMuteButton();
updateStats();
setActiveTab('all');
updateClock();
fetchNowPlaying();

setInterval(updateClock, 1000);
setInterval(fetchNowPlaying, 60_000);

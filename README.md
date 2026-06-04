# Malco Corner

A Wii-inspired personal website for Malco: clean, nostalgic, rounded, friendly, and a little unserious on purpose.

The site is one-page and works like a personal dashboard, with a sidebar of small widgets and a main feed controlled by tabs.

## What is included

- Wii-inspired visual style
- Profile card with the Mii-style avatar
- Tabs: `all`, `about`, `projects`, `music`, `games`, `things i’m into`, `links`
- Manual data files for projects, games, things and links
- Last.fm now playing widget
- Music recommendation form
- Supabase backend route for saving recommendations
- Custom Wii-style cursor on desktop
- Click sound with mute button
- Responsive layout
- Footer/status bar with current time and date

## Requirements

Install Node.js first. This project was made for a simple Node + Express setup.

## How to install

Open a terminal inside the project folder and run:

```bash
npm install
```

## How to configure `.env`

Create a file called `.env` in the project root.

You can copy `.env.example` and fill it in:

```env
LASTFM_API_KEY=
LASTFM_USERNAME=

SUPABASE_URL=
SUPABASE_ANON_KEY=

PORT=3000
```

Do not upload `.env` to GitHub. It contains private values.

## Last.fm setup

The now playing widget uses Last.fm.

You need:

1. A Last.fm account.
2. A Last.fm API key.
3. Your Spotify connected to Last.fm scrobbling, if you want Spotify songs to appear.

Then fill:

```env
LASTFM_API_KEY=your_key_here
LASTFM_USERNAME=your_username_here
```

If Last.fm is not configured, the site still works. The widget will show a friendly idle message.

## Supabase setup

The recommendation form sends data to the backend route:

```txt
POST /api/recommendations
```

The frontend does not talk directly to Supabase. Express receives the form and saves it.

Create a Supabase table called:

```txt
recommendations
```

Suggested columns:

| column | type | notes |
| --- | --- | --- |
| id | uuid or bigint | primary key |
| visitor_name | text | optional name |
| artist_song | text | required song field |
| reason | text | optional reason |
| created_at | timestamp | default now |

Then fill:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

If Supabase is not configured, the site still loads, but recommendations will not be saved.

## How to run locally

```bash
npm start
```

Then open:

```txt
http://localhost:3000
```

For development with auto-restart:

```bash
npm run dev
```

## Where to edit content

Edit these files:

```txt
public/data/projects.js
public/data/games.js
public/data/things.js
public/data/links.js
```

### Projects

Use only real projects or real ideas.

```js
window.MALCO_PROJECTS = [
  {
    name: 'project name',
    description: 'short description',
    status: 'work in progress',
    technologies: ['html', 'css', 'javascript'],
    link: ''
  }
];
```

### Games

Add games manually:

```js
window.MALCO_GAMES = [
  {
    title: 'Game Name',
    status: 'favorite',
    cover: '/assets/images/games/game-cover.png'
  }
];
```

If `cover` is empty, the site shows a simple placeholder.

### Things I’m Into

```js
window.MALCO_THINGS = [
  {
    title: 'thing name',
    category: 'fashion',
    note: 'small note',
    image: ''
  }
];
```

### Links

Replace `#` with real links:

```js
window.MALCO_LINKS = [
  { name: 'GitHub', description: 'projects and code', url: 'https://github.com/your-user', icon: '⌘' }
];
```

## Assets

Assets live here:

```txt
public/assets/
├── images/
│   ├── profile/
│   ├── games/
│   └── things/
├── icons/
├── cursors/
└── sounds/
```

The profile image is already placed at:

```txt
public/assets/images/profile/malco-mii.png
```

The click sound is at:

```txt
public/assets/sounds/click.wav
```

You can replace it with the real Mii Maker sound later. Keep the filename the same if you do not want to edit the HTML.

## Common problems

### The page opens, but Last.fm does not load

Check your `.env` values:

```env
LASTFM_API_KEY=
LASTFM_USERNAME=
```

Restart the server after editing `.env`.

### Recommendations do not send

Check:

- Supabase URL
- Supabase anon key
- table name: `recommendations`
- column names
- internet connection

### The image does not appear

Make sure the profile image exists here:

```txt
public/assets/images/profile/malco-mii.png
```

### The cursor does not appear on mobile

That is intentional. Mobile uses normal touch behavior.

## Important security notes

- Do not commit `.env`.
- Do not render user-submitted HTML.
- Keep recommendations private in v1.
- The backend validates field sizes before sending data to Supabase.
- There is a small cooldown and honeypot to reduce spam.

## First version scope

This is meant to be a polished first version, not the final version of everything.

Future ideas:

- admin panel
- Backloggd integration
- Spotify API
- theme switcher
- project detail pages
- recommendation history
- playlists
- visitor counter

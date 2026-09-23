require('dotenv').config();

const path = require('path');
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

app.use(express.json({ limit: '20kb' }));
app.use(express.static(PUBLIC_DIR));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const recommendationCooldown = new Map();
const COOLDOWN_MS = 20_000;
const trackDurationCache = new Map();
const TRACK_DURATION_CACHE_MS = 24 * 60 * 60 * 1000;

function cleanText(value, maxLength) {
  return String(value || '')
    .replace(/<[^>]*>?/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function getClientKey(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded) ? forwarded[0] : String(forwarded || req.ip || 'unknown');
  return ip.split(',')[0].trim();
}

async function getLastFmTrackDuration(apiKey, artist, trackName) {
  if (!artist || !trackName) return 0;

  const cacheKey = `${artist.toLowerCase()}::${trackName.toLowerCase()}`;
  const cached = trackDurationCache.get(cacheKey);

  if (cached && Date.now() - cached.savedAt < TRACK_DURATION_CACHE_MS) {
    return cached.durationMs;
  }

  const infoUrl = new URL('https://ws.audioscrobbler.com/2.0/');
  infoUrl.searchParams.set('method', 'track.getInfo');
  infoUrl.searchParams.set('api_key', apiKey);
  infoUrl.searchParams.set('artist', artist);
  infoUrl.searchParams.set('track', trackName);
  infoUrl.searchParams.set('format', 'json');
  infoUrl.searchParams.set('autocorrect', '1');

  try {
    const response = await fetch(infoUrl);
    if (!response.ok) return 0;

    const data = await response.json();
    const durationMs = Number.parseInt(data?.track?.duration, 10) || 0;

    trackDurationCache.set(cacheKey, {
      durationMs,
      savedAt: Date.now()
    });

    return durationMs;
  } catch {
    return 0;
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, project: 'malco-corner' });
});

app.get('/api/lastfm/now-playing', async (_req, res) => {
  const apiKey = process.env.LASTFM_API_KEY;
  const username = process.env.LASTFM_USERNAME;

  if (!apiKey || !username) {
    return res.status(200).json({
      ok: false,
      configured: false,
      message: 'Last.fm is not configured yet.'
    });
  }

  const url = new URL('https://ws.audioscrobbler.com/2.0/');
  url.searchParams.set('method', 'user.getrecenttracks');
  url.searchParams.set('user', username);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Last.fm responded with ${response.status}`);

    const data = await response.json();
    const track = data?.recenttracks?.track?.[0];

    if (!track) {
      return res.json({ ok: true, hasTrack: false });
    }

    const images = Array.isArray(track.image) ? track.image : [];
    const cover = [...images].reverse().find((image) => image['#text'])?.['#text'] || '';
    const nowPlaying = track?.['@attr']?.nowplaying === 'true';

    const name = track.name || 'unknown song';
    const artist = track.artist?.['#text'] || 'unknown artist';
    const durationMs = nowPlaying
      ? await getLastFmTrackDuration(apiKey, artist, name)
      : 0;

    return res.json({
      ok: true,
      hasTrack: true,
      nowPlaying,
      status: nowPlaying ? 'now playing' : 'last played',
      name,
      artist,
      album: track.album?.['#text'] || '',
      url: track.url || '',
      cover,
      durationMs
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'couldn’t load the song :('
    });
  }
});

app.post('/api/recommendations', async (req, res) => {
  const honeypot = cleanText(req.body.website, 120);
  if (honeypot) return res.status(200).json({ ok: true, message: 'recommendation sent :)' });

  const clientKey = getClientKey(req);
  const lastSentAt = recommendationCooldown.get(clientKey) || 0;
  if (Date.now() - lastSentAt < COOLDOWN_MS) {
    return res.status(429).json({ ok: false, message: 'wait a little before sending again :)' });
  }

  const visitor_name = cleanText(req.body.visitor_name, 40) || 'someone';
  const artist_song = cleanText(req.body.artist_song, 120);
  const reason = cleanText(req.body.reason, 300);

  if (!artist_song) {
    return res.status(400).json({ ok: false, message: 'fill the song first :)' });
  }

  if (!supabase) {
    return res.status(503).json({ ok: false, message: 'recommendations are not configured yet :(' });
  }

  try {
    const { error } = await supabase.from('recommendations').insert({
      visitor_name,
      artist_song,
      reason
    });

    if (error) throw error;

    recommendationCooldown.set(clientKey, Date.now());
    return res.json({ ok: true, message: 'recommendation sent :)' });
  } catch (error) {
  console.error('Supabase recommendation error:', error);

  return res.status(500).json({
    ok: false,
    message: 'couldn’t send it :(\ntry again in a bit.'
  });
}
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`malco-corner running at http://localhost:${PORT}`);
});

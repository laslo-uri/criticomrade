const crypto = require('crypto');

const SECRET = process.env.DEMO_TOKEN_SECRET || 'criticomrade-demo-secret';
const UA = 'CritiComrade/1.0 (https://github.com/laslo-uri/CritiComrade)';

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 32).toString('hex');
}

function publicUser(user, viewer) {
  if (!user) return null;
  const following = viewer ? state.follows.some((row) => row.followerId === viewer.id && row.followingId === user.id) : false;
  const dto = {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    profilePublic: user.profilePublic,
    gainedChallengePoints: user.gainedChallengePoints,
    followerCount: state.follows.filter((row) => row.followingId === user.id).length,
    followingCount: state.follows.filter((row) => row.followerId === user.id).length,
    following,
  };
  if (viewer && viewer.id === user.id) dto.email = user.email;
  return dto;
}

function mediaDto(item) {
  if (!item) return null;
  return {
    id: item.id,
    tmdbId: item.tmdbId,
    mediaType: item.mediaType,
    externalKey: item.externalKey,
    creator: item.creator,
    title: item.title,
    description: item.description,
    genre: item.genre,
    year: item.year,
    posterApiLink: item.posterApiLink,
    backdropApiLink: item.backdropApiLink,
    imdbRating: item.imdbRating,
    letterboxdLink: item.letterboxdLink,
    imdbLink: item.imdbLink,
    network: item.network,
    seasonCount: item.seasonCount,
    pageCount: item.pageCount,
    trackCount: item.trackCount,
  };
}

function reviewDto(review, viewer) {
  const movie = state.media.find((item) => item.id === review.movieId);
  const author = state.users.find((user) => user.id === review.authorId);
  const likes = state.reactions.filter((row) => row.target === 'review' && row.targetId === review.id && row.type === 'LIKE');
  return {
    id: review.id,
    rating: review.rating,
    text: review.text,
    movie: mediaDto(movie),
    author: publicUser(author, viewer),
    dateWatched: review.dateWatched,
    seenBefore: review.seenBefore,
    spoiler: review.spoiler,
    reviewTime: review.reviewTime,
    lastUpdated: review.lastUpdated,
    commentCount: state.comments.filter((comment) => comment.reviewId === review.id).length,
    reactions: [{
      type: 'LIKE',
      count: likes.length,
      reactedByCurrentUser: viewer ? likes.some((row) => row.userId === viewer.id) : false,
    }],
  };
}

function commentDto(comment, viewer) {
  const user = publicUser(state.users.find((entry) => entry.id === comment.userId), viewer);
  return {
    id: comment.id,
    text: comment.text,
    reviewId: comment.reviewId,
    user,
    author: user,
    createdAt: comment.createdAt,
  };
}

const state = createState();

function createState() {
  const demoSalt = 'demo-salt';
  const miraSalt = 'mira-salt';
  const nelaSalt = 'nela-salt';
  const users = [
    {
      id: 1,
      username: 'demo',
      email: 'demo@criticomrade.local',
      fullName: 'Demo Comrade',
      bio: 'Rates films, shows, books, and albums.',
      avatarUrl: '',
      profilePublic: true,
      gainedChallengePoints: 10,
      salt: demoSalt,
      passwordHash: hashPassword('criticomrade', demoSalt),
    },
    {
      id: 2,
      username: 'mira',
      email: 'mira@criticomrade.local',
      fullName: 'Mira Kovac',
      bio: 'Shows and novels, mostly.',
      avatarUrl: '',
      profilePublic: true,
      gainedChallengePoints: 20,
      salt: miraSalt,
      passwordHash: hashPassword('not-the-demo-password', miraSalt),
    },
    {
      id: 3,
      username: 'nela',
      email: 'nela@criticomrade.local',
      fullName: 'Nela Horvat',
      bio: 'Albums on repeat.',
      avatarUrl: '',
      profilePublic: true,
      gainedChallengePoints: 0,
      salt: nelaSalt,
      passwordHash: hashPassword('not-the-demo-password', nelaSalt),
    },
  ];
  const media = [
    makeMedia(1, 'FILM', 'Inception', '2010', 'Science Fiction', 'Christopher Nolan', 'tmdb:27205', 27205, 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg'),
    makeMedia(2, 'FILM', 'Parasite', '2019', 'Drama', 'Bong Joon-ho', 'tmdb:496243', 496243, 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg'),
    makeMedia(3, 'FILM', 'The Grand Budapest Hotel', '2014', 'Comedy', 'Wes Anderson', 'tmdb:120467', 120467, 'https://image.tmdb.org/t/p/w500/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg'),
    makeMedia(4, 'SHOW', 'The Bear', '2022', 'Drama', 'Christopher Storer', 'tv:136315', null, 'https://image.tmdb.org/t/p/w500/sHFlbKS3WLqMnp9t2ghADIJ3n41.jpg', { network: 'FX', seasonCount: 4 }),
    makeMedia(5, 'SHOW', 'Severance', '2022', 'Science Fiction', 'Dan Erickson', 'tv:95396', null, 'https://image.tmdb.org/t/p/w500/lFf6LLrQjYldcZItzOkGmMMigP7.jpg', { network: 'Apple TV+', seasonCount: 2 }),
    makeMedia(6, 'BOOK', 'Dune', '1965', 'Science Fiction', 'Frank Herbert', 'ol:OL893576W', null, 'https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg', { pageCount: 412 }),
    makeMedia(7, 'BOOK', 'The Left Hand of Darkness', '1969', 'Science Fiction', 'Ursula K. Le Guin', 'ol:OL7353617M', null, 'https://covers.openlibrary.org/b/isbn/9780441478125-L.jpg', { pageCount: 304 }),
    makeMedia(8, 'ALBUM', 'Rumours', '1977', 'Rock', 'Fleetwood Mac', 'mb:83d91898-7763-47d7-b03b-b92132375c47', null, 'https://coverartarchive.org/release-group/83d91898-7763-47d7-b03b-b92132375c47/front-250', { trackCount: 11 }),
    makeMedia(9, 'ALBUM', 'Blond', '2016', 'R&B', 'Frank Ocean', 'mb:7587d7cf-8c04-49a8-a56e-5d6b0b1b1e0e', null, '', { trackCount: 17 }),
  ];
  const now = '2026-10-01T12:00:00.000Z';
  const reviews = [
    { id: 1, movieId: 1, authorId: 1, rating: 9, text: 'Still folds the room in half.', dateWatched: '2026-09-12', seenBefore: true, spoiler: false, reviewTime: now, lastUpdated: now },
    { id: 2, movieId: 2, authorId: 2, rating: 10, text: 'The house is the whole plot.', dateWatched: '2026-08-02', seenBefore: false, spoiler: false, reviewTime: now, lastUpdated: now },
    { id: 3, movieId: 4, authorId: 1, rating: 8, text: 'The kitchen sounds like a thriller.', dateWatched: '2026-07-20', seenBefore: false, spoiler: false, reviewTime: now, lastUpdated: now },
    { id: 4, movieId: 6, authorId: 2, rating: 8, text: 'Sand, spice, and a long memory.', dateWatched: '2026-06-03', seenBefore: true, spoiler: false, reviewTime: now, lastUpdated: now },
    { id: 5, movieId: 8, authorId: 1, rating: 9, text: 'The second side still wins.', dateWatched: '2026-05-18', seenBefore: true, spoiler: false, reviewTime: now, lastUpdated: now },
  ];
  const comments = [
    { id: 1, reviewId: 1, userId: 2, text: 'The hallway dream is the one I rewind.', createdAt: now },
  ];
  const follows = [{ followerId: 1, followingId: 2 }];
  const requests = [{ id: 1, senderId: 3, receiverId: 1, requestDateTime: now }];
  const reactions = [{ id: 1, userId: 2, target: 'review', targetId: 1, type: 'LIKE' }];
  const notifications = [
    { id: 1, userId: 1, type: 'FOLLOW_REQUEST', message: 'Nela Horvat wants to follow you.', read: false, createdAt: now, actorId: 3, referenceId: 1 },
    { id: 2, userId: 1, type: 'LIKE', message: 'Mira Kovac liked your review of Inception.', read: false, createdAt: now, actorId: 2, referenceId: 1 },
  ];
  const lists = [
    { id: 1, ownerId: 1, name: 'Watchlist', listType: 'WATCHLIST', privateList: false, movieIds: [3, 5], reviewIds: [], creationDate: now, lastModificationDate: now },
    { id: 2, ownerId: 1, name: 'Diary', listType: 'DIARY', privateList: false, movieIds: [], reviewIds: [1, 3, 5], creationDate: now, lastModificationDate: now },
    { id: 3, ownerId: 2, name: 'Watchlist', listType: 'WATCHLIST', privateList: false, movieIds: [7], reviewIds: [], creationDate: now, lastModificationDate: now },
    { id: 4, ownerId: 2, name: 'Diary', listType: 'DIARY', privateList: false, movieIds: [], reviewIds: [2, 4], creationDate: now, lastModificationDate: now },
  ];
  const recommendations = [
    { id: 1, fromUserId: 2, toUserId: 1, movieId: 6, status: 'PENDING', creationTime: now, challengeDurationDays: 14, endTime: '2026-10-15T12:00:00.000Z', challengePoints: 10 },
  ];
  return {
    users, media, reviews, comments, follows, requests, reactions, notifications, lists, recommendations,
    nextUser: 4, nextMedia: 10, nextReview: 6, nextComment: 2, nextRequest: 2, nextReaction: 2, nextNotification: 3, nextList: 5, nextRecommendation: 2,
  };
}

function makeMedia(id, mediaType, title, year, genre, creator, externalKey, tmdbId, posterApiLink, extra = {}) {
  return {
    id, mediaType, title, year, genre, creator, externalKey, tmdbId, posterApiLink,
    description: extra.description || '',
    backdropApiLink: extra.backdropApiLink || '',
    imdbRating: extra.imdbRating,
    network: extra.network,
    seasonCount: extra.seasonCount,
    pageCount: extra.pageCount,
    trackCount: extra.trackCount,
    cast: extra.cast || [],
    tracks: extra.tracks || [],
  };
}

function sign(userId) {
  const body = Buffer.from(JSON.stringify({ id: userId, exp: Date.now() + 12 * 60 * 60 * 1000 })).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verify(token) {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return state.users.find((user) => user.id === payload.id) || null;
  } catch {
    return null;
  }
}

function upsertExternal(item) {
  const existing = state.media.find((entry) => entry.externalKey && entry.externalKey === item.externalKey);
  if (existing) return existing;
  const saved = { ...item, id: state.nextMedia++ };
  state.media.push(saved);
  return saved;
}

function searchLocal(type, query) {
  const needle = (query || '').trim().toLowerCase();
  return state.media.filter((item) => {
    if (item.mediaType !== type) return false;
    if (!needle) return true;
    return [item.title, item.creator, item.genre, item.year].filter(Boolean).join(' ').toLowerCase().includes(needle);
  });
}

async function searchRemote(type, query) {
  try {
    if ((type === 'FILM' || type === 'SHOW') && process.env.TMDB_API_KEY) return await tmdbSearch(type, query);
    if (type === 'BOOK') return await openLibrarySearch(query || 'fiction');
    if (type === 'ALBUM') {
      if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
        const albums = await spotifySearch(query || 'album');
        if (albums.length) return albums;
      }
      return await musicBrainzSearch(query || 'album');
    }
  } catch {
    return [];
  }
  return [];
}

async function popularRemote(type) {
  try {
    // `return await` keeps a failed upstream request inside this try/catch.
    if (type === 'FILM' && process.env.TMDB_API_KEY) return await tmdbList('/movie/popular', 'FILM');
    if (type === 'SHOW' && process.env.TMDB_API_KEY) return await tmdbList('/tv/popular', 'SHOW');
    if (type === 'BOOK') return await openLibrarySearch('fiction');
    if (type === 'ALBUM') return await searchRemote('ALBUM', 'album');
  } catch {
    return [];
  }
  return [];
}

async function tmdbList(path, type) {
  const payload = await getJson(`https://api.themoviedb.org/3${path}?api_key=${encodeURIComponent(process.env.TMDB_API_KEY)}`);
  return (payload.results || []).slice(0, 12).map((row) => upsertExternal(fromTmdb(row, type)));
}

async function tmdbSearch(type, query) {
  const kind = type === 'SHOW' ? 'tv' : 'movie';
  const payload = await getJson(`https://api.themoviedb.org/3/search/${kind}?api_key=${encodeURIComponent(process.env.TMDB_API_KEY)}&query=${encodeURIComponent(query)}`);
  return (payload.results || []).slice(0, 12).map((row) => upsertExternal(fromTmdb(row, type)));
}

function fromTmdb(row, type) {
  const title = type === 'SHOW' ? row.name : row.title;
  const date = type === 'SHOW' ? row.first_air_date : row.release_date;
  return {
    mediaType: type,
    title: title || 'Untitled',
    year: (date || '').slice(0, 4),
    description: row.overview || '',
    creator: '',
    genre: '',
    tmdbId: type === 'FILM' ? row.id : undefined,
    externalKey: type === 'FILM' ? `tmdb:${row.id}` : `tv:${row.id}`,
    posterApiLink: row.poster_path ? `https://image.tmdb.org/t/p/w500${row.poster_path}` : '',
    backdropApiLink: row.backdrop_path ? `https://image.tmdb.org/t/p/w1280${row.backdrop_path}` : '',
    imdbRating: row.vote_average,
  };
}

async function openLibrarySearch(query) {
  const payload = await getJson(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=12`);
  return (payload.docs || []).map((doc) => upsertExternal({
    mediaType: 'BOOK',
    title: doc.title || 'Untitled',
    year: String(doc.first_publish_year || ''),
    creator: (doc.author_name || [])[0] || '',
    genre: (doc.subject || [])[0] || '',
    externalKey: doc.key ? `ol:${String(doc.key).replace('/works/', '')}` : undefined,
    posterApiLink: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : '',
    pageCount: doc.number_of_pages_median,
    description: '',
  }));
}

async function musicBrainzSearch(query) {
  const payload = await getJson(`https://musicbrainz.org/ws/2/release-group/?query=${encodeURIComponent(query)}&fmt=json&limit=12`);
  return (payload['release-groups'] || []).map((group) => upsertExternal({
    mediaType: 'ALBUM',
    title: group.title || 'Untitled',
    year: (group['first-release-date'] || '').slice(0, 4),
    creator: group['artist-credit']?.[0]?.name || '',
    externalKey: group.id ? `mb:${group.id}` : undefined,
    posterApiLink: group.id ? `https://coverartarchive.org/release-group/${group.id}/front-250` : '',
    description: '',
  }));
}

let spotifyToken = { value: '', exp: 0 };

async function spotifySearch(query) {
  const token = await spotifyAccessToken();
  if (!token) return [];
  const payload = await getJson(`https://api.spotify.com/v1/search?type=album&limit=12&q=${encodeURIComponent(query)}`, { Authorization: `Bearer ${token}` });
  return (payload.albums?.items || []).map((album) => upsertExternal({
    mediaType: 'ALBUM',
    title: album.name,
    year: (album.release_date || '').slice(0, 4),
    creator: (album.artists || []).map((artist) => artist.name).join(', '),
    externalKey: `sp:${album.id}`,
    posterApiLink: album.images?.[0]?.url || '',
    trackCount: album.total_tracks,
    description: '',
  }));
}

async function spotifyAccessToken() {
  if (spotifyToken.value && spotifyToken.exp > Date.now()) return spotifyToken.value;
  const body = new URLSearchParams({ grant_type: 'client_credentials' });
  const auth = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(4500),
  });
  if (!response.ok) return '';
  const payload = await response.json();
  spotifyToken = { value: payload.access_token || '', exp: Date.now() + ((payload.expires_in || 300) - 30) * 1000 };
  return spotifyToken.value;
}

async function creditsFor(item) {
  if (!item) return { cast: [], tracks: [] };
  if (item.cast?.length || item.tracks?.length) return { cast: item.cast || [], tracks: item.tracks || [] };
  if (item.externalKey?.startsWith('sp:') && process.env.SPOTIFY_CLIENT_ID) {
    const token = await spotifyAccessToken();
    if (token) {
      const payload = await getJson(`https://api.spotify.com/v1/albums/${item.externalKey.slice(3)}/tracks?limit=20`, { Authorization: `Bearer ${token}` });
      return { cast: [], tracks: (payload.items || []).map((track) => track.name).filter(Boolean) };
    }
  }
  if (process.env.TMDB_API_KEY && (item.mediaType === 'FILM' || item.mediaType === 'SHOW')) {
    const id = item.mediaType === 'FILM' ? item.tmdbId : item.externalKey?.replace(/^tv:/, '');
    const kind = item.mediaType === 'FILM' ? 'movie' : 'tv';
    if (id) {
      const payload = await getJson(`https://api.themoviedb.org/3/${kind}/${id}/credits?api_key=${encodeURIComponent(process.env.TMDB_API_KEY)}`);
      return { cast: (payload.cast || []).slice(0, 8).map((person) => person.name), tracks: [] };
    }
  }
  return { cast: [], tracks: [] };
}

async function getJson(url, headers = {}) {
  // A slow upstream must not use up the whole serverless time limit; the seed catalog is the fallback.
  const response = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json', ...headers }, signal: AbortSignal.timeout(4500) });
  if (!response.ok) throw new Error(String(response.status));
  return response.json();
}

function taste(username) {
  const user = state.users.find((entry) => entry.username === username);
  const mine = user ? state.reviews.filter((review) => review.authorId === user.id) : [];
  const genres = share(mine.map((review) => state.media.find((item) => item.id === review.movieId)?.genre).filter(Boolean));
  const mediaTypes = share(mine.map((review) => state.media.find((item) => item.id === review.movieId)?.mediaType).filter(Boolean));
  const average = mine.length ? mine.reduce((sum, review) => sum + review.rating, 0) / mine.length / 2 : 0;
  return { ratedCount: mine.length, averageRating: round1(average), genres, mediaTypes };
}

function diary(username) {
  const profile = taste(username);
  const user = state.users.find((entry) => entry.username === username);
  const year = new Date().getFullYear();
  const mine = user ? state.reviews.filter((review) => review.authorId === user.id && String(review.dateWatched || '').startsWith(String(year))) : [];
  const distribution = [0, 0, 0, 0, 0];
  for (const review of mine) {
    const stars = Math.min(5, Math.max(1, Math.round(review.rating / 2)));
    distribution[stars - 1] += 1;
  }
  const average = mine.length ? mine.reduce((sum, review) => sum + review.rating, 0) / mine.length / 2 : 0;
  return {
    year,
    yearCount: mine.length,
    yearAverage: round1(average),
    topGenre: profile.genres[0]?.name || null,
    distribution,
    mediaTypes: profile.mediaTypes,
  };
}

function share(names) {
  const counts = new Map();
  for (const name of names) counts.set(name, (counts.get(name) || 0) + 1);
  const total = names.length || 1;
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count, percentage: Math.round((count / total) * 100) }));
}

function compatibility(username, viewer) {
  if (!viewer) return { sharedCount: 0, percent: null };
  const other = state.users.find((user) => user.username === username);
  if (!other || other.id === viewer.id) return { sharedCount: 0, percent: null };
  const mine = new Map(state.reviews.filter((review) => review.authorId === viewer.id).map((review) => [review.movieId, review.rating]));
  const theirs = state.reviews.filter((review) => review.authorId === other.id && mine.has(review.movieId));
  if (!theirs.length) return { sharedCount: 0, percent: null };
  const mean = theirs.reduce((sum, review) => sum + Math.abs(mine.get(review.movieId) - review.rating) / 10, 0) / theirs.length;
  return { sharedCount: theirs.length, percent: Math.round((1 - mean) * 100) };
}

function suggestions(viewer) {
  if (!viewer) return [];
  const mine = state.reviews.filter((review) => review.authorId === viewer.id);
  const top = [...mine].sort((a, b) => b.rating - a.rating)[0];
  const genre = top ? state.media.find((item) => item.id === top.movieId)?.genre : '';
  const seen = new Set(mine.map((review) => review.movieId));
  return state.media.filter((item) => !seen.has(item.id) && (!genre || item.genre === genre)).slice(0, 12);
}

function listDto(list, viewer) {
  const owner = publicUser(state.users.find((user) => user.id === list.ownerId), viewer);
  return {
    id: list.id,
    name: list.name,
    listType: list.listType,
    privateList: list.privateList,
    numberOfElements: list.listType === 'DIARY' ? list.reviewIds.length : list.movieIds.length,
    creationDate: list.creationDate,
    lastModificationDate: list.lastModificationDate,
    owner,
    movies: list.movieIds.map((id) => mediaDto(state.media.find((item) => item.id === id))).filter(Boolean),
    reviews: list.reviewIds.map((id) => reviewDto(state.reviews.find((review) => review.id === id), viewer)).filter(Boolean),
  };
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function notify(userId, type, message, actorId, referenceId) {
  state.notifications.unshift({
    id: state.nextNotification++,
    userId,
    type,
    message,
    read: false,
    createdAt: new Date().toISOString(),
    actorId,
    referenceId,
  });
}

module.exports = {
  state,
  publicUser,
  mediaDto,
  reviewDto,
  commentDto,
  sign,
  verify,
  hashPassword,
  searchLocal,
  searchRemote,
  popularRemote,
  creditsFor,
  taste,
  diary,
  compatibility,
  suggestions,
  listDto,
  notify,
  upsertExternal,
};

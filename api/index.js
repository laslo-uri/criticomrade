const {
  state, publicUser, mediaDto, reviewDto, commentDto, sign, verify, hashPassword,
  searchLocal, searchRemote, popularRemote, creditsFor, taste, diary, compatibility,
  suggestions, listDto, notify, randomSecret,
} = require('./store');

const MAX_BODY_BYTES = 64 * 1024;
const MAX_ROWS = 2000; // The store is in memory: a public write endpoint must not grow it without end.
const USERNAME = /^[a-z0-9_.]{3,20}$/;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const HTTP_URL = /^https?:\/\/\S+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Best effort: counted per serverless instance, enough to slow down guessing and scripted writes.
const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMITS = { auth: 15, write: 60, read: 300 };
const rateWindows = new Map();

function overLimit(req, method, path) {
  const kind = /\/auth\/(login|register|forgot-password|reset-password)$/.test(path) ? 'auth' : method === 'GET' ? 'read' : 'write';
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const key = `${kind}:${req.headers['x-real-ip'] || forwarded || req.socket?.remoteAddress || 'unknown'}`;
  const now = Date.now();
  if (rateWindows.size > 20000) rateWindows.clear();
  const entry = rateWindows.get(key);
  if (!entry || now - entry.start > RATE_WINDOW_MS) {
    rateWindows.set(key, { start: now, count: 1 });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMITS[kind];
}

module.exports = async function handler(req, res) {
  try {
    const { pathname, query } = readRequest(req);
    const path = pathname.replace(/\/+$/, '') || '/';
    const method = (req.method || 'GET').toUpperCase();
    if (overLimit(req, method, path)) {
      res.setHeader('Retry-After', '60');
      return send(res, 429, { error: 'Too many requests. Try again in a minute.' });
    }
    const viewer = verify(bearer(req));
    const body = await readBody(req);
    if (body === null) return send(res, 413, { error: 'Request too large' });
    const result = await route(method, path.startsWith('/api') ? path.slice(4) || '/' : path, query, body, viewer);
    if (result === undefined) return send(res, 404, { error: 'Not found' });
    if (result && result.__status) return send(res, result.__status, result.body ?? {});
    return send(res, 200, result);
  } catch (error) {
    return send(res, 500, { error: 'Demo API failed' });
  }
};

async function route(method, path, query, body, viewer) {
  if (method === 'POST' && path === '/auth/login') return login(body);
  if (method === 'POST' && path === '/auth/register') return register(body);
  if (method === 'GET' && path === '/auth/me') return viewer ? { token: null, user: publicUser(viewer, viewer) } : denied();
  if (method === 'POST' && path === '/auth/forgot-password') return { message: 'If an account exists, a code has been sent. Check your email.' };
  if (method === 'POST' && path === '/auth/reset-password') return fail(400, 'Invalid or expired code. Request a new one.');

  if (method === 'GET' && path === '/media/search') return mergeSearch(query.type || 'FILM', query.q || '');
  if (method === 'GET' && path === '/media/popular') return mergePopular(query.type || 'FILM');
  if (method === 'GET' && path === '/media/resolve') return resolveMedia(query.type, query.key);
  if (method === 'GET' && path === '/media/credits') return creditsFor(findByKey(query.type, query.key));

  if (method === 'GET' && path === '/movies/popular') return (await mergePopular('FILM')).map(mediaDto);
  if (method === 'GET' && path === '/movies/search') return (await mergeSearch('FILM', query.q || query.query || '')).map(mediaDto);
  const tmdb = path.match(/^\/movies\/tmdb\/(\d+)$/);
  if (method === 'GET' && tmdb) return mediaDto(state.media.find((item) => item.tmdbId === Number(tmdb[1]))) || fail(404, 'Not found');
  const movieId = path.match(/^\/movies\/(\d+)$/);
  if (method === 'GET' && movieId) return mediaDto(state.media.find((item) => item.id === Number(movieId[1]))) || fail(404, 'Not found');
  const movieReviews = path.match(/^\/movies\/(\d+)\/reviews$/);
  if (method === 'GET' && movieReviews) return page(state.reviews.filter((review) => review.movieId === Number(movieReviews[1]) && canView(state.users.find((user) => user.id === review.authorId), viewer)).map((review) => reviewDto(review, viewer)), query);

  if (method === 'GET' && path === '/stats') {
    return {
      userCount: state.users.length,
      movieCount: state.media.length,
      reviewCount: state.reviews.length,
      commentCount: state.comments.length,
      reactionCount: state.reactions.length,
      recommendationCount: state.recommendations.length,
      // Lets the frontend show the demo sign-in hint.
      demo: true,
    };
  }

  const userReviews = path.match(/^\/users\/([^/]+)\/reviews$/);
  if (method === 'GET' && userReviews) {
    const user = byUsername(decodeURIComponent(userReviews[1]));
    if (!user) return fail(404, 'Not found');
    if (!canView(user, viewer)) return fail(403, 'Profile is private');
    return page(state.reviews.filter((review) => review.authorId === user.id).map((review) => reviewDto(review, viewer)), query);
  }
  const tastePath = path.match(/^\/users\/([^/]+)\/taste-profile$/);
  if (method === 'GET' && tastePath) return visibleOr403(decodeURIComponent(tastePath[1]), viewer) || taste(decodeURIComponent(tastePath[1]));
  const diaryPath = path.match(/^\/users\/([^/]+)\/diary-stats$/);
  if (method === 'GET' && diaryPath) return visibleOr403(decodeURIComponent(diaryPath[1]), viewer) || diary(decodeURIComponent(diaryPath[1]));
  const compatPath = path.match(/^\/users\/([^/]+)\/compatibility$/);
  if (method === 'GET' && compatPath) return viewer ? visibleOr403(decodeURIComponent(compatPath[1]), viewer) || compatibility(decodeURIComponent(compatPath[1]), viewer) : denied();
  if (method === 'GET' && path === '/users/me/suggestions') return viewer ? suggestions(viewer).map(mediaDto) : denied();
  if (method === 'GET' && path === '/users/search') {
    const needle = (query.q || '').toLowerCase();
    const matches = state.users.filter((user) => !needle || user.username.includes(needle) || (user.fullName || '').toLowerCase().includes(needle));
    return page(matches.map((user) => publicUser(user, viewer)), query);
  }
  if (method === 'PUT' && path === '/users/me') return viewer ? updateMe(viewer, body) : denied();
  const profile = path.match(/^\/users\/([^/]+)$/);
  if (method === 'GET' && profile && profile[1] !== 'me' && profile[1] !== 'search') {
    const user = byUsername(decodeURIComponent(profile[1]));
    if (!user) return fail(404, 'Not found');
    return canView(user, viewer) ? publicUser(user, viewer) : fail(403, 'Profile is private');
  }

  if (method === 'GET' && path === '/feed') {
    if (!viewer) return denied();
    const ids = new Set([viewer.id, ...state.follows.filter((row) => row.followerId === viewer.id).map((row) => row.followingId)]);
    return page(state.reviews.filter((review) => ids.has(review.authorId)).sort((a, b) => b.id - a.id).map((review) => reviewDto(review, viewer)), query);
  }

  if (method === 'POST' && path === '/reviews') return viewer ? createReview(viewer, body) : denied();
  const oneReview = path.match(/^\/reviews\/(\d+)$/);
  if (oneReview && method === 'GET') {
    const review = state.reviews.find((entry) => entry.id === Number(oneReview[1]));
    if (!review || !canView(state.users.find((user) => user.id === review.authorId), viewer)) return fail(404, 'Not found');
    return reviewDto(review, viewer);
  }
  if (oneReview && method === 'PUT') return viewer ? updateReview(viewer, Number(oneReview[1]), body) : denied();
  if (oneReview && method === 'DELETE') return viewer ? deleteReview(viewer, Number(oneReview[1])) : denied();
  const reviewComments = path.match(/^\/reviews\/(\d+)\/comments$/);
  if (reviewComments && method === 'GET') return state.comments.filter((comment) => comment.reviewId === Number(reviewComments[1])).map((comment) => commentDto(comment, viewer));
  if (reviewComments && method === 'POST') return viewer ? addComment(viewer, Number(reviewComments[1]), body) : denied();
  const oneComment = path.match(/^\/comments\/(\d+)$/);
  if (oneComment && method === 'DELETE') return viewer ? deleteComment(viewer, Number(oneComment[1])) : denied();

  const reaction = path.match(/^\/reactions\/(movie|review|comment)\/(\d+)$/);
  if (reaction && method === 'POST') return viewer ? toggleReaction(viewer, reaction[1], Number(reaction[2])) : denied();
  if (reaction && method === 'GET') return reactionSummary(reaction[1], Number(reaction[2]), viewer);

  if (path === '/follow/requests' && method === 'GET') return viewer ? state.requests.filter((row) => row.receiverId === viewer.id).map(requestDto) : denied();
  const followRequest = path.match(/^\/follow\/request\/([^/]+)$/);
  if (followRequest && method === 'POST') return viewer ? requestFollow(viewer, decodeURIComponent(followRequest[1])) : denied();
  const followUser = path.match(/^\/follow\/([^/]+)$/);
  if (followUser && method === 'DELETE' && !['accept', 'reject', 'request', 'requests', 'followers', 'following'].includes(followUser[1])) {
    return viewer ? unfollow(viewer, decodeURIComponent(followUser[1])) : denied();
  }
  const accept = path.match(/^\/follow\/accept\/(\d+)$/);
  if (accept && method === 'POST') return viewer ? settleRequest(viewer, Number(accept[1]), true) : denied();
  const reject = path.match(/^\/follow\/reject\/(\d+)$/);
  if (reject && method === 'POST') return viewer ? settleRequest(viewer, Number(reject[1]), false) : denied();
  const followers = path.match(/^\/follow\/followers\/([^/]+)$/);
  if (followers && method === 'GET') return peopleWho(decodeURIComponent(followers[1]), 'followers', viewer);
  const following = path.match(/^\/follow\/following\/([^/]+)$/);
  if (following && method === 'GET') return peopleWho(decodeURIComponent(following[1]), 'following', viewer);

  if (path === '/lists' && method === 'GET') return viewer ? myLists(viewer, query.type).map((list) => listDto(list, viewer)) : denied();
  if (path === '/lists' && method === 'POST') return viewer ? createList(viewer, body) : denied();
  if (path === '/lists/watchlist' && method === 'GET') return viewer ? listDto(ensureSystemList(viewer, 'WATCHLIST'), viewer) : denied();
  if (path === '/lists/diary' && method === 'GET') return viewer ? listDto(ensureSystemList(viewer, 'DIARY'), viewer) : denied();
  const listMovie = path.match(/^\/lists\/(\d+)\/movies\/(\d+)$/);
  if (listMovie && method === 'POST') return viewer ? addMovieToList(viewer, Number(listMovie[1]), Number(listMovie[2])) : denied();
  if (listMovie && method === 'DELETE') return viewer ? removeMovieFromList(viewer, Number(listMovie[1]), Number(listMovie[2])) : denied();
  const listReview = path.match(/^\/lists\/(\d+)\/reviews\/(\d+)$/);
  if (listReview && method === 'POST') return viewer ? addReviewToList(viewer, Number(listReview[1]), Number(listReview[2])) : denied();
  const oneList = path.match(/^\/lists\/(\d+)$/);
  if (oneList && method === 'GET') {
    const list = state.lists.find((entry) => entry.id === Number(oneList[1]));
    // A private list is its owner's alone, and "not found" does not confirm that it exists.
    if (!list || (list.privateList && list.ownerId !== viewer?.id)) return fail(404, 'Not found');
    return listDto(list, viewer);
  }
  if (oneList && method === 'DELETE') return viewer ? deleteList(viewer, Number(oneList[1])) : denied();

  if (path === '/notifications' && method === 'GET') return viewer ? page(myNotes(viewer), query) : denied();
  if (path === '/notifications/unread-count' && method === 'GET') return viewer ? state.notifications.filter((note) => note.userId === viewer.id && !note.read).length : denied();
  if (path === '/notifications/read-all' && method === 'PATCH') return viewer ? markAll(viewer) : denied();
  const oneNote = path.match(/^\/notifications\/(\d+)\/read$/);
  if (oneNote && method === 'PATCH') return viewer ? markOne(viewer, Number(oneNote[1])) : denied();

  if (path === '/recommendations' && method === 'POST') return viewer ? createRecommendation(viewer, body) : denied();
  if (path === '/recommendations/incoming' && method === 'GET') return viewer ? state.recommendations.filter((row) => row.toUserId === viewer.id).map(recommendationDto) : denied();
  if (path === '/recommendations/outgoing' && method === 'GET') return viewer ? state.recommendations.filter((row) => row.fromUserId === viewer.id).map(recommendationDto) : denied();
  const rec = path.match(/^\/recommendations\/(\d+)\/(accept|reject|complete)$/);
  if (rec && method === 'POST') return viewer ? moveRecommendation(viewer, Number(rec[1]), rec[2]) : denied();

  return undefined;
}

function login(body) {
  if (!validPassword(body.password)) return fail(401, 'Invalid credentials');
  const name = String(body.username || body.email || '').trim().toLowerCase();
  const user = state.users.find((entry) => entry.username === name || entry.email.toLowerCase() === name);
  if (!user || !passwordMatches(user, body.password)) return fail(401, 'Invalid credentials');
  return { token: sign(user.id), user: publicUser(user, user) };
}

function register(body) {
  const username = String(body.username || '').trim().toLowerCase();
  const email = String(body.email || '').trim().toLowerCase();
  if (!USERNAME.test(username) || !EMAIL.test(email) || email.length > 254 || !validPassword(body.password) || body.password.length < 8) {
    return fail(400, 'Registration failed');
  }
  if (state.users.length >= MAX_ROWS) return full();
  if (state.users.some((user) => user.username === username || user.email === email)) return fail(409, 'Registration failed');
  const salt = randomSecret();
  const user = {
    id: state.nextUser++,
    username,
    email,
    fullName: limited(body.fullName, 80) || username,
    bio: '',
    avatarUrl: '',
    profilePublic: true,
    gainedChallengePoints: 0,
    salt,
    passwordHash: hashPassword(body.password, salt),
  };
  state.users.push(user);
  ensureSystemList(user, 'WATCHLIST');
  ensureSystemList(user, 'DIARY');
  return { __status: 201, body: { token: sign(user.id), user: publicUser(user, user) } };
}

function updateMe(viewer, body) {
  if (body.avatarUrl != null && body.avatarUrl !== '' && !(HTTP_URL.test(String(body.avatarUrl)) && String(body.avatarUrl).length <= 512)) {
    return fail(400, 'Avatar must be an http or https address');
  }
  if (tooLong(body.fullName, 80) || tooLong(body.bio, 280)) return fail(400, 'Too long');
  if (body.fullName != null) viewer.fullName = String(body.fullName);
  if (body.bio != null) viewer.bio = String(body.bio);
  if (body.avatarUrl != null) viewer.avatarUrl = String(body.avatarUrl);
  if (body.profilePublic != null) viewer.profilePublic = Boolean(body.profilePublic);
  return publicUser(viewer, viewer);
}

function createReview(viewer, body) {
  const invalid = invalidReview(body);
  if (invalid) return invalid;
  if (state.reviews.length >= MAX_ROWS) return full();
  const movie = findReviewTarget(body);
  if (!movie) return fail(400, 'Title not found');
  const now = new Date().toISOString();
  const review = {
    id: state.nextReview++,
    movieId: movie.id,
    authorId: viewer.id,
    rating: Number(body.rating ?? 0),
    text: body.text == null ? '' : String(body.text),
    dateWatched: body.dateWatched || now.slice(0, 10),
    seenBefore: Boolean(body.seenBefore),
    spoiler: Boolean(body.spoiler),
    reviewTime: now,
    lastUpdated: now,
  };
  state.reviews.unshift(review);
  const diaryList = ensureSystemList(viewer, 'DIARY');
  diaryList.reviewIds.unshift(review.id);
  return reviewDto(review, viewer);
}

function updateReview(viewer, id, body) {
  const review = state.reviews.find((entry) => entry.id === id);
  if (!review) return fail(404, 'Not found');
  if (review.authorId !== viewer.id) return fail(403, 'Forbidden');
  const invalid = invalidReview(body);
  if (invalid) return invalid;
  if (body.rating != null) review.rating = Number(body.rating);
  if (body.text != null) review.text = String(body.text);
  if (body.dateWatched != null) review.dateWatched = body.dateWatched;
  if (body.spoiler != null) review.spoiler = Boolean(body.spoiler);
  review.lastUpdated = new Date().toISOString();
  return reviewDto(review, viewer);
}

function deleteReview(viewer, id) {
  const review = state.reviews.find((entry) => entry.id === id);
  if (!review) return fail(404, 'Not found');
  if (review.authorId !== viewer.id) return fail(403, 'Forbidden');
  state.reviews = state.reviews.filter((entry) => entry.id !== id);
  state.comments = state.comments.filter((comment) => comment.reviewId !== id);
  return empty();
}

function addComment(viewer, reviewId, body) {
  if (!state.reviews.some((review) => review.id === reviewId)) return fail(404, 'Not found');
  const text = String(body.text ?? '').trim();
  if (!text || text.length > 2000) return fail(400, 'A comment needs 1 to 2000 characters');
  if (state.comments.length >= MAX_ROWS) return full();
  const comment = { id: state.nextComment++, reviewId, userId: viewer.id, text, createdAt: new Date().toISOString() };
  state.comments.push(comment);
  const review = state.reviews.find((entry) => entry.id === reviewId);
  if (review && review.authorId !== viewer.id) notify(review.authorId, 'COMMENT', `${viewer.fullName} commented on your review.`, viewer.id, reviewId);
  return commentDto(comment, viewer);
}

function deleteComment(viewer, id) {
  const comment = state.comments.find((entry) => entry.id === id);
  if (!comment) return fail(404, 'Not found');
  if (comment.userId !== viewer.id) return fail(403, 'Forbidden');
  state.comments = state.comments.filter((entry) => entry.id !== id);
  return empty();
}

function toggleReaction(viewer, target, id) {
  const type = 'LIKE';
  if (state.reactions.length >= MAX_ROWS) return full();
  const existing = state.reactions.find((row) => row.userId === viewer.id && row.target === target && row.targetId === id && row.type === type);
  if (existing) state.reactions = state.reactions.filter((row) => row !== existing);
  else {
    state.reactions.push({ id: state.nextReaction++, userId: viewer.id, target, targetId: id, type });
    if (target === 'review') {
      const review = state.reviews.find((entry) => entry.id === id);
      if (review && review.authorId !== viewer.id) notify(review.authorId, 'LIKE', `${viewer.fullName} liked your review.`, viewer.id, id);
    }
  }
  return reactionSummary(target, id, viewer);
}

function reactionSummary(target, id, viewer) {
  const rows = state.reactions.filter((row) => row.target === target && row.targetId === id && row.type === 'LIKE');
  return [{ type: 'LIKE', count: rows.length, reactedByCurrentUser: viewer ? rows.some((row) => row.userId === viewer.id) : false }];
}

function requestFollow(viewer, username) {
  const other = byUsername(username);
  if (!other || other.id === viewer.id) return fail(404, 'Not found');
  if (state.follows.some((row) => row.followerId === viewer.id && row.followingId === other.id)) return empty();
  // Like the Spring API: a public profile is followed at once, a private one gets a request.
  if (other.profilePublic) {
    state.follows.push({ followerId: viewer.id, followingId: other.id });
    notify(other.id, 'FOLLOW', `${viewer.username} started following you`, viewer.id);
    return empty();
  }
  if (!state.requests.some((row) => row.senderId === viewer.id && row.receiverId === other.id)) {
    const id = state.nextRequest++;
    state.requests.push({ id, senderId: viewer.id, receiverId: other.id, requestDateTime: new Date().toISOString() });
    notify(other.id, 'FOLLOW_REQUEST', `${viewer.fullName} wants to follow you.`, viewer.id, id);
  }
  return empty();
}

function unfollow(viewer, username) {
  const other = byUsername(username);
  if (!other) return fail(404, 'Not found');
  state.follows = state.follows.filter((row) => !(row.followerId === viewer.id && row.followingId === other.id));
  // Unfollowing someone you only asked to follow withdraws the request.
  state.requests = state.requests.filter((row) => !(row.senderId === viewer.id && row.receiverId === other.id));
  return empty();
}

function settleRequest(viewer, id, accept) {
  const request = state.requests.find((row) => row.id === id && row.receiverId === viewer.id);
  if (!request) return fail(404, 'Not found');
  state.requests = state.requests.filter((row) => row.id !== id);
  if (accept && !state.follows.some((row) => row.followerId === request.senderId && row.followingId === viewer.id)) {
    state.follows.push({ followerId: request.senderId, followingId: viewer.id });
  }
  return empty();
}

function peopleWho(username, kind, viewer) {
  const user = byUsername(username);
  if (!user) return fail(404, 'Not found');
  if (!canView(user, viewer)) return fail(403, 'Profile is private');
  const ids = state.follows
    .filter((row) => (kind === 'followers' ? row.followingId === user.id : row.followerId === user.id))
    .map((row) => (kind === 'followers' ? row.followerId : row.followingId));
  return ids.map((id) => publicUser(state.users.find((entry) => entry.id === id), viewer)).filter(Boolean);
}

function requestDto(request) {
  return {
    id: request.id,
    sender: publicUser(state.users.find((user) => user.id === request.senderId), null),
    receiver: publicUser(state.users.find((user) => user.id === request.receiverId), null),
    requestDateTime: request.requestDateTime,
  };
}

function myLists(viewer, type) {
  return state.lists.filter((list) => list.ownerId === viewer.id && (!type || list.listType === type));
}

function createList(viewer, body) {
  const name = String(body.name ?? '').trim();
  if (!name || name.length > 120) return fail(400, 'A list name needs 1 to 120 characters');
  if (state.lists.length >= MAX_ROWS) return full();
  const now = new Date().toISOString();
  const list = {
    id: state.nextList++,
    ownerId: viewer.id,
    name,
    listType: 'CUSTOM',
    privateList: Boolean(body.privateList),
    movieIds: [],
    reviewIds: [],
    creationDate: now,
    lastModificationDate: now,
  };
  state.lists.push(list);
  return listDto(list, viewer);
}

function ensureSystemList(viewer, listType) {
  let list = state.lists.find((entry) => entry.ownerId === viewer.id && entry.listType === listType);
  if (!list) {
    const now = new Date().toISOString();
    list = { id: state.nextList++, ownerId: viewer.id, name: listType === 'DIARY' ? 'Diary' : 'Watchlist', listType, privateList: false, movieIds: [], reviewIds: [], creationDate: now, lastModificationDate: now };
    state.lists.push(list);
  }
  return list;
}

function addMovieToList(viewer, listId, tmdbId) {
  const list = ownedList(viewer, listId);
  if (!list) return fail(404, 'Not found');
  const movie = state.media.find((item) => item.tmdbId === tmdbId) || state.media.find((item) => item.id === tmdbId);
  if (!movie) return fail(404, 'Not found');
  if (!list.movieIds.includes(movie.id)) list.movieIds.push(movie.id);
  list.lastModificationDate = new Date().toISOString();
  return listDto(list, viewer);
}

function removeMovieFromList(viewer, listId, movieId) {
  const list = ownedList(viewer, listId);
  if (!list) return fail(404, 'Not found');
  list.movieIds = list.movieIds.filter((id) => id !== movieId);
  return empty();
}

function deleteList(viewer, listId) {
  const list = ownedList(viewer, listId);
  if (!list) return fail(404, 'Not found');
  if (list.listType !== 'CUSTOM') return fail(400, 'The diary and watchlist cannot be deleted.');
  state.lists = state.lists.filter((entry) => entry.id !== listId);
  return empty();
}

function addReviewToList(viewer, listId, reviewId) {
  const list = ownedList(viewer, listId);
  if (!list || !state.reviews.some((review) => review.id === reviewId)) return fail(404, 'Not found');
  if (!list.reviewIds.includes(reviewId)) list.reviewIds.push(reviewId);
  return listDto(list, viewer);
}

function ownedList(viewer, listId) {
  return state.lists.find((list) => list.id === listId && list.ownerId === viewer.id);
}

function myNotes(viewer) {
  return state.notifications.filter((note) => note.userId === viewer.id).map((note) => ({
    id: note.id,
    type: note.type,
    message: note.message,
    read: note.read,
    createdAt: note.createdAt,
    actor: publicUser(state.users.find((user) => user.id === note.actorId), viewer),
    referenceId: note.referenceId,
  }));
}

function markOne(viewer, id) {
  const note = state.notifications.find((entry) => entry.id === id && entry.userId === viewer.id);
  if (note) note.read = true;
  return empty();
}

function markAll(viewer) {
  for (const note of state.notifications) if (note.userId === viewer.id) note.read = true;
  return empty();
}

function createRecommendation(viewer, body) {
  const to = byUsername(String(body.toUsername || '').toLowerCase());
  const movie = state.media.find((item) => item.tmdbId === Number(body.tmdbId));
  if (!to || !movie || to.id === viewer.id) return fail(400, 'Failed to send');
  const days = Number(body.challengeDurationDays || 14);
  const points = Number(body.challengePoints ?? 10);
  if (!Number.isInteger(days) || days < 1 || days > 90 || !Number.isInteger(points) || points < 0 || points > 100) {
    return fail(400, 'Failed to send');
  }
  if (state.recommendations.length >= MAX_ROWS) return full();
  const now = new Date();
  const row = {
    id: state.nextRecommendation++,
    fromUserId: viewer.id,
    toUserId: to.id,
    movieId: movie.id,
    status: 'PENDING',
    creationTime: now.toISOString(),
    challengeDurationDays: days,
    endTime: new Date(now.getTime() + days * 86400000).toISOString(),
    challengePoints: points,
  };
  state.recommendations.push(row);
  notify(to.id, 'RECOMMENDATION', `${viewer.fullName} recommended ${movie.title}.`, viewer.id, row.id);
  return recommendationDto(row);
}

function moveRecommendation(viewer, id, action) {
  const row = state.recommendations.find((entry) => entry.id === id);
  if (!row || row.toUserId !== viewer.id) return fail(404, 'Not found');
  // One way only, so the points of a challenge cannot be collected twice.
  const allowed = { accept: ['PENDING'], reject: ['PENDING', 'ACCEPTED'], complete: ['ACCEPTED'] }[action];
  if (!allowed.includes(row.status)) return fail(400, 'This challenge can no longer change that way');
  row.status = action === 'accept' ? 'ACCEPTED' : action === 'reject' ? 'REJECTED' : 'COMPLETED';
  if (action === 'complete') viewer.gainedChallengePoints += row.challengePoints;
  return recommendationDto(row);
}

function recommendationDto(row) {
  return {
    id: row.id,
    fromUser: publicUser(state.users.find((user) => user.id === row.fromUserId), null),
    toUser: publicUser(state.users.find((user) => user.id === row.toUserId), null),
    movie: mediaDto(state.media.find((item) => item.id === row.movieId)),
    status: row.status,
    creationTime: row.creationTime,
    challengeDurationDays: row.challengeDurationDays,
    endTime: row.endTime,
    challengePoints: row.challengePoints,
  };
}

async function mergeSearch(type, query) {
  const remote = query ? await searchRemote(type, query) : [];
  const local = searchLocal(type, query);
  const seen = new Set(remote.map((item) => item.id));
  return [...remote, ...local.filter((item) => !seen.has(item.id))].slice(0, 20).map(mediaDto);
}

async function mergePopular(type) {
  const remote = await popularRemote(type);
  if (remote.length) return remote.map(mediaDto);
  return searchLocal(type, '').slice(0, 12).map(mediaDto);
}

async function resolveMedia(type, key) {
  const found = findByKey(type, key);
  if (found) return mediaDto(found);
  const remote = await searchRemote(type, key);
  const match = remote.find((item) => item.externalKey === key || item.externalKey === `${prefixFor(type)}${key}`) || remote[0];
  return match ? mediaDto(match) : fail(404, 'Not found');
}

function findByKey(type, key) {
  if (!key) return null;
  const raw = String(key);
  return state.media.find((item) => (!type || item.mediaType === type) && (item.externalKey === raw || item.externalKey === `${prefixFor(type)}${raw}` || String(item.tmdbId) === raw));
}

function findReviewTarget(body) {
  if (body.tmdbId) return state.media.find((item) => item.tmdbId === Number(body.tmdbId));
  if (body.externalKey) return state.media.find((item) => item.externalKey === body.externalKey);
  return null;
}

function prefixFor(type) {
  if (type === 'FILM') return 'tmdb:';
  if (type === 'SHOW' || type === 'EPISODE') return 'tv:';
  if (type === 'BOOK') return 'ol:';
  if (type === 'ALBUM') return 'mb:';
  return '';
}

function canView(user, viewer) {
  if (!user || user.profilePublic || user.id === viewer?.id) return Boolean(user);
  return Boolean(viewer) && state.follows.some((row) => row.followerId === viewer.id && row.followingId === user.id);
}

function visibleOr403(username, viewer) {
  const user = byUsername(username);
  return user && !canView(user, viewer) ? fail(403, 'Profile is private') : null;
}

function validPassword(password) {
  return typeof password === 'string' && password.length >= 1 && password.length <= 200;
}

function tooLong(value, max) {
  return value != null && String(value).length > max;
}

function limited(value, max) {
  return value == null ? '' : String(value).trim().slice(0, max);
}

function invalidReview(body) {
  if (body.rating != null) {
    const rating = Number(body.rating);
    if (!Number.isFinite(rating) || rating < 0 || rating > 10) return fail(400, 'Rating out of range');
  }
  if (tooLong(body.text, 4000)) return fail(400, 'Review too long');
  if (body.dateWatched != null && !DATE.test(String(body.dateWatched))) return fail(400, 'Invalid date');
  return null;
}

function full() {
  return fail(503, 'The demo is full for now. It resets soon.');
}

function byUsername(username) {
  return state.users.find((user) => user.username === String(username).toLowerCase());
}

function passwordMatches(user, password) {
  const hash = hashPassword(password, user.salt);
  const left = Buffer.from(hash);
  const right = Buffer.from(user.passwordHash);
  return left.length === right.length && require('crypto').timingSafeEqual(left, right);
}

function bearer(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

function page(items, query) {
  const pageNumber = Math.max(0, Math.trunc(Number(query.page)) || 0);
  const size = Math.min(100, Math.max(1, Math.trunc(Number(query.size)) || 20));
  const start = pageNumber * size;
  return { content: items.slice(start, start + size), page: pageNumber, size, totalElements: items.length, totalPages: Math.max(1, Math.ceil(items.length / size)) };
}

function denied() {
  return fail(401, 'Unauthorized');
}

function fail(status, error) {
  return { __status: status, body: { error } };
}

function empty() {
  return { __status: 204, body: '' };
}

function readRequest(req) {
  const headerUrl = req.headers['x-vercel-original-url'] || req.headers['x-invoke-path'] || '';
  const raw = headerUrl || req.url || '/';
  const url = new URL(raw, 'https://criticomrade.local');
  let pathname = url.pathname;
  if (req.query && req.query.path) {
    const parts = Array.isArray(req.query.path) ? req.query.path : [req.query.path];
    pathname = `/api/${parts.join('/')}`;
  }
  const query = Object.fromEntries(url.searchParams.entries());
  return { pathname, query };
}

function objectOnly(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(objectOnly(req.body));
  if (typeof req.body === 'string') {
    if (req.body.length > MAX_BODY_BYTES) return Promise.resolve(null);
    try { return Promise.resolve(objectOnly(req.body ? JSON.parse(req.body) : {})); } catch { return Promise.resolve({}); }
  }
  const method = (req.method || 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'DELETE') return Promise.resolve({});
  return new Promise((resolve) => {
    const chunks = [];
    let received = 0;
    req.on('data', (chunk) => {
      received += chunk.length;
      if (received <= MAX_BODY_BYTES) chunks.push(chunk);
    });
    req.on('end', () => {
      if (received > MAX_BODY_BYTES) return resolve(null);
      const text = Buffer.concat(chunks).toString('utf8');
      if (!text) return resolve({});
      try { resolve(objectOnly(JSON.parse(text))); } catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

function send(res, status, body) {
  res.statusCode = status;
  if (status === 204) {
    res.end();
    return;
  }
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

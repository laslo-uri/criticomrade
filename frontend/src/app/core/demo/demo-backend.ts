import { MediaType } from '../models/media-item.model';
import { storage } from '../utils/storage';
import {
  DEMO_PASSWORD,
  DEMO_RESET_CODE,
  SEED_COMMENTS,
  SEED_FOLLOWS,
  SEED_LIKES,
  SEED_LISTS,
  SEED_MEDIA,
  SEED_REVIEWS,
  SEED_USERS,
  SEED_WATCHLIST,
} from './demo-seed';

/**
 * An in-browser stand-in for the Spring Boot API.
 *
 * It implements the same routes and JSON shapes the Angular services call, keeps its
 * state in localStorage, and is only used when no real API answers (see RuntimeService).
 */

const DB_KEY = 'criticomrade_demo_db';
const DB_VERSION = 4;
const DAY = 86_400_000;

interface DUser {
  id: number;
  username: string;
  email: string;
  password: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  profilePublic: boolean;
  points: number;
}
interface DMedia {
  id: number;
  tmdbId?: number;
  slug: string;
  type: MediaType;
  title: string;
  creator: string;
  year: string;
  genre: string;
  description: string;
  network?: string;
  seasonCount?: number;
  cast?: string[];
  tracks?: string[];
}
interface DReview {
  id: number;
  userId: number;
  mediaId: number;
  rating: number;
  text?: string;
  dateWatched?: string;
  seenBefore: boolean;
  spoiler: boolean;
  reviewTime: string;
  lastUpdated: string;
}
interface DComment {
  id: number;
  reviewId: number;
  userId: number;
  text: string;
  createdAt: string;
}
interface DReaction {
  target: string;
  targetId: number;
  userId: number;
  type: string;
}
interface DList {
  id: number;
  ownerId: number;
  name: string;
  listType: 'WATCHLIST' | 'CUSTOM';
  privateList: boolean;
  mediaIds: number[];
  reviewIds: number[];
  creationDate: string;
  lastModificationDate: string;
}
interface DRequest {
  id: number;
  senderId: number;
  receiverId: number;
  at: string;
}
interface DNotification {
  id: number;
  userId: number;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  actorId?: number;
  referenceId?: number;
}
interface DRec {
  id: number;
  fromId: number;
  toId: number;
  mediaId: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
  creationTime: string;
  days: number;
  points: number;
}
interface DB {
  version: number;
  nextId: number;
  users: DUser[];
  media: DMedia[];
  reviews: DReview[];
  comments: DComment[];
  reactions: DReaction[];
  lists: DList[];
  follows: [number, number][];
  requests: DRequest[];
  notifications: DNotification[];
  recs: DRec[];
  sessions: Record<string, number>;
}

export interface DemoRequest {
  method: string;
  path: string;
  params: URLSearchParams;
  body: any;
  token: string | null;
}

export interface DemoResponse {
  status: number;
  body: unknown;
}

export class DemoHttpError {
  constructor(
    readonly status: number,
    readonly message: string
  ) {}
}

const iso = (offsetMs = 0) => new Date(Date.now() - offsetMs).toISOString();
const dateOnly = (offsetMs = 0) => iso(offsetMs).slice(0, 10);
const round1 = (n: number) => Math.round(n * 10) / 10;

export class DemoBackend {
  private db: DB;
  private me: DUser | null = null;
  /** Called after background activity (e.g. a simulated like) so the UI can refresh badges. */
  onActivity: () => void = () => undefined;

  constructor() {
    const stored = storage.getJson<DB>(DB_KEY);
    this.db = stored && stored.version === DB_VERSION ? stored : this.seed();
    this.save();
  }

  reset(): void {
    this.db = this.seed();
    this.save();
  }

  // ————————————————————————————————————————————————————— routing

  handle(req: DemoRequest): DemoResponse {
    this.me = req.token ? this.userById(this.db.sessions[req.token]) ?? null : null;
    const { method, path } = req;
    const p = path.replace(/\/+$/, '') || '/';

    for (const [m, pattern, fn] of this.routes) {
      if (m !== method) continue;
      const match = pattern.exec(p);
      if (!match) continue;
      const result = fn.call(this, req, ...match.slice(1).map(decodeURIComponent));
      if (method !== 'GET') this.save();
      return { status: 200, body: result ?? null };
    }
    throw new DemoHttpError(404, `No demo route for ${method} ${p}`);
  }

  private readonly routes: [string, RegExp, (req: DemoRequest, ...args: string[]) => unknown][] = [
    // auth
    ['POST', /^\/auth\/login$/, this.login],
    ['POST', /^\/auth\/register$/, this.register],
    ['GET', /^\/auth\/me$/, () => ({ token: null, user: this.userDto(this.requireMe()) })],
    ['POST', /^\/auth\/forgot-password$/, () => ({ message: `Demo mode: use code ${DEMO_RESET_CODE}.` })],
    ['POST', /^\/auth\/reset-password$/, this.resetPassword],
    // catalogue
    ['GET', /^\/media\/popular$/, (r) => this.popular(r.params.get('type') as MediaType | null)],
    ['GET', /^\/media\/search$/, (r) => this.search(r.params.get('q') ?? '', r.params.get('type') as MediaType | null)],
    ['GET', /^\/media\/resolve$/, (r) => this.mediaDto(this.mediaByKey(r.params.get('key') ?? ''))],
    ['GET', /^\/media\/credits$/, (r) => {
      const m = this.mediaByKey(r.params.get('key') ?? '');
      return { cast: m.cast ?? [], tracks: m.tracks ?? [] };
    }],
    ['GET', /^\/movies\/popular$/, () => this.popular('FILM')],
    ['GET', /^\/movies\/search$/, (r) => this.search(r.params.get('q') ?? '', null)],
    ['GET', /^\/movies\/tmdb\/(\d+)$/, (_r, id) => this.mediaDto(this.mediaWhere((m) => m.tmdbId === +id))],
    ['GET', /^\/movies\/(\d+)\/reviews$/, (r, id) =>
      this.page(this.reviewsWhere((rv) => rv.mediaId === +id).map((rv) => this.reviewDto(rv)), r.params)],
    ['GET', /^\/movies\/(\d+)$/, (_r, id) => this.mediaDto(this.mediaWhere((m) => m.id === +id))],
    // reviews and feed
    ['GET', /^\/feed$/, this.feed],
    ['POST', /^\/reviews$/, this.createReview],
    ['GET', /^\/reviews\/(\d+)$/, (_r, id) => this.reviewDto(this.reviewById(+id))],
    ['PUT', /^\/reviews\/(\d+)$/, this.updateReview],
    ['DELETE', /^\/reviews\/(\d+)$/, this.deleteReview],
    ['GET', /^\/reviews\/(\d+)\/comments$/, (_r, id) =>
      this.db.comments.filter((c) => c.reviewId === +id).map((c) => this.commentDto(c))],
    ['POST', /^\/reviews\/(\d+)\/comments$/, this.addComment],
    ['DELETE', /^\/comments\/(\d+)$/, this.deleteComment],
    ['POST', /^\/reactions\/(movie|review|comment)\/(\d+)$/, this.toggleReaction],
    ['GET', /^\/reactions\/(movie|review|comment)\/(\d+)$/, (_r, t, id) => this.reactionSummary(t, +id)],
    // users
    ['GET', /^\/users\/search$/, (r) => this.page(this.searchUsers(r.params.get('q') ?? ''), r.params)],
    ['GET', /^\/users\/me\/suggestions$/, () => this.suggestions()],
    ['PUT', /^\/users\/me$/, this.updateMe],
    ['GET', /^\/users\/([^/]+)\/reviews$/, (r, u) =>
      this.page(this.reviewsWhere((rv) => rv.userId === this.userByName(u).id).map((rv) => this.reviewDto(rv)), r.params)],
    ['GET', /^\/users\/([^/]+)\/taste-profile$/, (_r, u) => this.tasteProfile(this.userByName(u))],
    ['GET', /^\/users\/([^/]+)\/compatibility$/, (_r, u) => this.compatibility(this.userByName(u))],
    ['GET', /^\/users\/([^/]+)\/diary-stats$/, (_r, u) => this.diaryStats(this.userByName(u))],
    ['GET', /^\/users\/([^/]+)$/, (_r, u) => this.userDto(this.userByName(u))],
    // follow
    ['POST', /^\/follow\/request\/([^/]+)$/, this.follow],
    ['DELETE', /^\/follow\/([^/]+)$/, this.unfollow],
    ['POST', /^\/follow\/accept\/(\d+)$/, (_r, id) => this.answerRequest(+id, true)],
    ['POST', /^\/follow\/reject\/(\d+)$/, (_r, id) => this.answerRequest(+id, false)],
    ['GET', /^\/follow\/requests$/, () =>
      this.db.requests.filter((q) => q.receiverId === this.requireMe().id).map((q) => ({
        id: q.id, sender: this.userDto(this.userById(q.senderId)!), receiver: this.userDto(this.requireMe()), requestDateTime: q.at,
      }))],
    ['GET', /^\/follow\/followers\/([^/]+)$/, (_r, u) => {
      const id = this.userByName(u).id;
      return this.db.follows.filter(([, b]) => b === id).map(([a]) => this.userDto(this.userById(a)!));
    }],
    ['GET', /^\/follow\/following\/([^/]+)$/, (_r, u) => {
      const id = this.userByName(u).id;
      return this.db.follows.filter(([a]) => a === id).map(([, b]) => this.userDto(this.userById(b)!));
    }],
    // lists
    ['GET', /^\/lists$/, (r) => {
      const type = r.params.get('type');
      return this.db.lists
        .filter((l) => l.ownerId === this.requireMe().id && (!type || l.listType === type))
        .map((l) => this.listDto(l));
    }],
    ['GET', /^\/lists\/watchlist$/, () => this.listDto(this.watchlistOf(this.requireMe()))],
    ['GET', /^\/lists\/diary$/, this.diary],
    ['GET', /^\/lists\/(\d+)$/, (_r, id) => this.listDto(this.ownList(+id, false))],
    ['POST', /^\/lists$/, this.createList],
    ['POST', /^\/lists\/(\d+)\/movies\/(\d+)$/, (_r, id, tmdb) =>
      this.addToList(this.ownList(+id), this.mediaWhere((m) => m.tmdbId === +tmdb))],
    ['POST', /^\/lists\/(\d+)\/media$/, (r, id) => this.addToList(this.ownList(+id), this.mediaByKey(r.body?.externalKey ?? ''))],
    ['POST', /^\/lists\/(\d+)\/reviews\/(\d+)$/, (_r, id, rid) => {
      const list = this.ownList(+id);
      if (!list.reviewIds.includes(+rid)) list.reviewIds.push(+rid);
      return this.listDto(list);
    }],
    ['DELETE', /^\/lists\/(\d+)\/movies\/(\d+)$/, (_r, id, mid) => {
      const list = this.ownList(+id);
      list.mediaIds = list.mediaIds.filter((m) => m !== +mid);
      list.lastModificationDate = iso();
      return null;
    }],
    ['DELETE', /^\/lists\/(\d+)$/, (_r, id) => {
      const list = this.ownList(+id);
      if (list.listType === 'WATCHLIST') throw new DemoHttpError(400, 'The watchlist cannot be deleted.');
      this.db.lists = this.db.lists.filter((l) => l !== list);
      return null;
    }],
    // notifications
    ['GET', /^\/notifications$/, (r) =>
      this.page(
        this.db.notifications
          .filter((n) => n.userId === this.requireMe().id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map((n) => ({ ...n, actor: n.actorId ? this.userDto(this.userById(n.actorId)!) : undefined })),
        r.params
      )],
    ['GET', /^\/notifications\/unread-count$/, () =>
      this.db.notifications.filter((n) => n.userId === this.requireMe().id && !n.read).length],
    ['PATCH', /^\/notifications\/read-all$/, () => {
      this.db.notifications.filter((n) => n.userId === this.requireMe().id).forEach((n) => (n.read = true));
      return null;
    }],
    ['PATCH', /^\/notifications\/(\d+)\/read$/, (_r, id) => {
      const n = this.db.notifications.find((x) => x.id === +id && x.userId === this.requireMe().id);
      if (n) n.read = true;
      return null;
    }],
    // recommendations
    ['POST', /^\/recommendations$/, this.createRecommendation],
    ['GET', /^\/recommendations\/incoming$/, () =>
      this.db.recs.filter((r) => r.toId === this.requireMe().id).sort(this.newestRec).map((r) => this.recDto(r))],
    ['GET', /^\/recommendations\/outgoing$/, () =>
      this.db.recs.filter((r) => r.fromId === this.requireMe().id).sort(this.newestRec).map((r) => this.recDto(r))],
    ['POST', /^\/recommendations\/(\d+)\/(accept|reject|complete)$/, this.answerRecommendation],
    // stats
    ['GET', /^\/stats$/, () => ({
      userCount: this.db.users.length,
      movieCount: this.db.media.length,
      reviewCount: this.db.reviews.length,
      commentCount: this.db.comments.length,
      reactionCount: this.db.reactions.length,
      recommendationCount: this.db.recs.length,
    })],
  ];

  // ————————————————————————————————————————————————————— auth

  private login(req: DemoRequest) {
    const name = String(req.body?.username ?? '').trim().toLowerCase();
    const user = this.db.users.find((u) => u.username.toLowerCase() === name || u.email.toLowerCase() === name);
    if (!user || user.password !== req.body?.password) {
      throw new DemoHttpError(401, 'Wrong username or password.');
    }
    return this.issueSession(user);
  }

  private register(req: DemoRequest) {
    const username = String(req.body?.username ?? '').trim();
    const email = String(req.body?.email ?? '').trim();
    const password = String(req.body?.password ?? '');
    if (!/^[a-zA-Z0-9_.]{3,20}$/.test(username)) {
      throw new DemoHttpError(400, 'Usernames are 3–20 letters, numbers, dots or underscores.');
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new DemoHttpError(400, 'Enter a valid email address.');
    if (password.length < 8) throw new DemoHttpError(400, 'Passwords need at least 8 characters.');
    if (this.db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      throw new DemoHttpError(409, 'That username is taken.');
    }
    if (this.db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new DemoHttpError(409, 'An account with that email already exists.');
    }
    const user: DUser = {
      id: this.id(), username, email, password, fullName: req.body?.fullName || undefined,
      bio: '', profilePublic: true, points: 0,
    };
    this.db.users.push(user);
    this.watchlistOf(user);
    // Start new people with a populated feed.
    for (const name of ['vera', 'jovana', 'tibor']) {
      const other = this.db.users.find((u) => u.username === name);
      if (other) this.db.follows.push([user.id, other.id]);
    }
    const vera = this.db.users.find((u) => u.username === 'vera');
    if (vera) {
      this.db.follows.push([vera.id, user.id]);
      this.notify(user.id, 'FOLLOW', `${vera.username} started following you`, vera.id);
    }
    return this.issueSession(user);
  }

  private resetPassword(req: DemoRequest) {
    if (String(req.body?.code) !== DEMO_RESET_CODE) {
      throw new DemoHttpError(400, `In demo mode the code is ${DEMO_RESET_CODE}.`);
    }
    const user = this.db.users.find((u) => u.email.toLowerCase() === String(req.body?.email ?? '').toLowerCase());
    if (!user) throw new DemoHttpError(404, 'No account uses that email.');
    if (String(req.body?.newPassword ?? '').length < 8) throw new DemoHttpError(400, 'Passwords need at least 8 characters.');
    user.password = req.body.newPassword;
    return { message: 'Password updated.' };
  }

  private issueSession(user: DUser) {
    const token = `demo.${user.id}.${Math.random().toString(36).slice(2)}`;
    this.db.sessions[token] = user.id;
    this.save();
    return { token, user: this.userDto(user) };
  }

  private requireMe(): DUser {
    if (!this.me) throw new DemoHttpError(401, 'Sign in first.');
    return this.me;
  }

  // ————————————————————————————————————————————————————— catalogue

  private popular(type: MediaType | null) {
    return this.db.media
      .filter((m) => !type || m.type === type)
      .map((m) => ({ m, score: this.scoreOf(m) }))
      .sort((a, b) => b.score - a.score || a.m.title.localeCompare(b.m.title))
      .map(({ m }) => this.mediaDto(m));
  }

  private scoreOf(m: DMedia): number {
    const reviews = this.db.reviews.filter((r) => r.mediaId === m.id);
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / (reviews.length || 1);
    return reviews.length * 3 + avg;
  }

  private search(q: string, type: MediaType | null) {
    const words = q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/\s+/).filter(Boolean);
    const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return this.db.media
      .filter((m) => !type || m.type === type)
      .filter((m) => {
        const hay = fold(`${m.title} ${m.creator} ${m.genre} ${m.year}`);
        return words.every((w) => hay.includes(w));
      })
      .map((m) => this.mediaDto(m));
  }

  private suggestions() {
    const me = this.requireMe();
    const mine = this.db.reviews.filter((r) => r.userId === me.id);
    const seen = new Set(mine.map((r) => r.mediaId));
    const liked = new Set(
      mine.filter((r) => r.rating >= 8).flatMap((r) => this.genresOf(this.mediaById(r.mediaId)))
    );
    return this.db.media
      .filter((m) => !seen.has(m.id))
      .map((m) => ({ m, match: this.genresOf(m).filter((g) => liked.has(g)).length }))
      .filter(({ match }) => match > 0 || liked.size === 0)
      .sort((a, b) => b.match - a.match || this.scoreOf(b.m) - this.scoreOf(a.m))
      .slice(0, 10)
      .map(({ m }) => this.mediaDto(m));
  }

  // ————————————————————————————————————————————————————— reviews

  private feed(req: DemoRequest) {
    const me = this.requireMe();
    const followed = new Set(this.db.follows.filter(([a]) => a === me.id).map(([, b]) => b));
    followed.add(me.id);
    let items = this.reviewsWhere((r) => followed.has(r.userId));
    if (items.length === 0) items = this.reviewsWhere(() => true);
    return this.page(items.map((r) => this.reviewDto(r)), req.params);
  }

  private createReview(req: DemoRequest) {
    const me = this.requireMe();
    const b = req.body ?? {};
    const media = b.tmdbId
      ? this.mediaWhere((m) => m.tmdbId === +b.tmdbId)
      : this.mediaByKey(String(b.externalKey ?? ''));
    const rating = Math.round(Number(b.rating));
    if (!(rating >= 1 && rating <= 10)) throw new DemoHttpError(400, 'Pick a rating first.');
    const review: DReview = {
      id: this.id(), userId: me.id, mediaId: media.id, rating,
      text: b.text ? String(b.text).slice(0, 4000) : undefined,
      dateWatched: b.dateWatched || dateOnly(),
      seenBefore: this.db.reviews.some((r) => r.userId === me.id && r.mediaId === media.id) || !!b.seenBefore,
      spoiler: !!b.spoiler, reviewTime: iso(), lastUpdated: iso(),
    };
    this.db.reviews.push(review);
    // Take it off the watchlist once logged.
    const wl = this.watchlistOf(me);
    wl.mediaIds = wl.mediaIds.filter((id) => id !== media.id);
    this.simulateReaction(review);
    return this.reviewDto(review);
  }

  /** A followed comrade likes the new review a few seconds later, so notifications feel alive. */
  private simulateReaction(review: DReview): void {
    const fans = this.db.follows.filter(([, b]) => b === review.userId).map(([a]) => a);
    const fanId = fans[Math.floor(Math.random() * fans.length)];
    if (!fanId) return;
    setTimeout(() => {
      if (!this.db.reviews.includes(review)) return;
      if (this.db.reactions.some((x) => x.target === 'review' && x.targetId === review.id && x.userId === fanId)) return;
      this.db.reactions.push({ target: 'review', targetId: review.id, userId: fanId, type: 'LIKE' });
      const fan = this.userById(fanId)!;
      this.notify(review.userId, 'LIKE', `${fan.username} liked your review of ${this.mediaById(review.mediaId).title}`, fanId, review.id);
      this.save();
      this.onActivity();
    }, 6000);
  }

  private updateReview(req: DemoRequest, id: string) {
    const review = this.ownReview(+id);
    const b = req.body ?? {};
    if (b.rating != null) review.rating = Math.min(10, Math.max(1, Math.round(Number(b.rating))));
    if (b.text !== undefined) review.text = b.text || undefined;
    if (b.dateWatched) review.dateWatched = b.dateWatched;
    if (b.spoiler !== undefined) review.spoiler = !!b.spoiler;
    review.lastUpdated = iso();
    return this.reviewDto(review);
  }

  private deleteReview(_req: DemoRequest, id: string) {
    const review = this.ownReview(+id);
    this.db.reviews = this.db.reviews.filter((r) => r !== review);
    this.db.comments = this.db.comments.filter((c) => c.reviewId !== review.id);
    this.db.reactions = this.db.reactions.filter((x) => !(x.target === 'review' && x.targetId === review.id));
    this.db.lists.forEach((l) => (l.reviewIds = l.reviewIds.filter((r) => r !== review.id)));
    return null;
  }

  private addComment(req: DemoRequest, id: string) {
    const me = this.requireMe();
    const review = this.reviewById(+id);
    const text = String(req.body?.text ?? '').trim();
    if (!text) throw new DemoHttpError(400, 'Write something first.');
    const comment: DComment = { id: this.id(), reviewId: review.id, userId: me.id, text: text.slice(0, 1000), createdAt: iso() };
    this.db.comments.push(comment);
    if (review.userId !== me.id) {
      this.notify(review.userId, 'COMMENT', `${me.username} commented on your review of ${this.mediaById(review.mediaId).title}`, me.id, review.id);
    }
    return this.commentDto(comment);
  }

  private deleteComment(_req: DemoRequest, id: string) {
    const me = this.requireMe();
    const comment = this.db.comments.find((c) => c.id === +id);
    if (!comment) throw new DemoHttpError(404, 'Comment not found.');
    const review = this.reviewById(comment.reviewId);
    if (comment.userId !== me.id && review.userId !== me.id) throw new DemoHttpError(403, 'Not your comment.');
    this.db.comments = this.db.comments.filter((c) => c !== comment);
    return null;
  }

  private toggleReaction(req: DemoRequest, target: string, id: string) {
    const me = this.requireMe();
    const type = String(req.body?.reactionType ?? 'LIKE');
    const existing = this.db.reactions.find(
      (x) => x.target === target && x.targetId === +id && x.userId === me.id && x.type === type
    );
    if (existing) {
      this.db.reactions = this.db.reactions.filter((x) => x !== existing);
    } else {
      this.db.reactions.push({ target, targetId: +id, userId: me.id, type });
      if (target === 'review') {
        const review = this.reviewById(+id);
        if (review.userId !== me.id) {
          this.notify(review.userId, 'LIKE', `${me.username} liked your review of ${this.mediaById(review.mediaId).title}`, me.id, review.id);
        }
      }
    }
    return this.reactionSummary(target, +id);
  }

  private reactionSummary(target: string, id: number) {
    const all = this.db.reactions.filter((x) => x.target === target && x.targetId === id);
    const types = [...new Set(['LIKE', ...all.map((x) => x.type)])];
    return types.map((type) => ({
      type,
      count: all.filter((x) => x.type === type).length,
      reactedByCurrentUser: !!this.me && all.some((x) => x.type === type && x.userId === this.me!.id),
    }));
  }

  // ————————————————————————————————————————————————————— users and taste

  private searchUsers(q: string) {
    const needle = q.trim().toLowerCase();
    return this.db.users
      .filter((u) => !needle || u.username.toLowerCase().includes(needle) || (u.fullName ?? '').toLowerCase().includes(needle))
      .map((u) => this.userDto(u));
  }

  private updateMe(req: DemoRequest) {
    const me = this.requireMe();
    const b = req.body ?? {};
    if (b.fullName !== undefined) me.fullName = String(b.fullName).slice(0, 80) || undefined;
    if (b.bio !== undefined) me.bio = String(b.bio).slice(0, 280);
    if (b.avatarUrl !== undefined) me.avatarUrl = String(b.avatarUrl).trim() || undefined;
    if (b.profilePublic !== undefined) me.profilePublic = !!b.profilePublic;
    return this.userDto(me);
  }

  private tasteProfile(user: DUser) {
    const reviews = this.db.reviews.filter((r) => r.userId === user.id);
    return {
      ratedCount: reviews.length,
      averageRating: reviews.length ? round1(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length / 2) : 0,
      genres: this.shares(reviews.flatMap((r) => this.genresOf(this.mediaById(r.mediaId)))).slice(0, 6),
      mediaTypes: this.shares(reviews.map((r) => this.mediaById(r.mediaId).type)),
    };
  }

  private compatibility(user: DUser) {
    const me = this.requireMe();
    const mine = new Map(this.db.reviews.filter((r) => r.userId === me.id).map((r) => [r.mediaId, r.rating]));
    const shared = this.db.reviews.filter((r) => r.userId === user.id && mine.has(r.mediaId));
    if (!shared.length) {
      // Fall back to genre overlap so the badge is meaningful early on.
      const a = new Set([...mine.keys()].flatMap((id) => this.genresOf(this.mediaById(id))));
      const b = new Set(this.db.reviews.filter((r) => r.userId === user.id).flatMap((r) => this.genresOf(this.mediaById(r.mediaId))));
      const union = new Set([...a, ...b]);
      const inter = [...a].filter((g) => b.has(g)).length;
      return { sharedCount: 0, percent: union.size && a.size ? Math.round((inter / union.size) * 100) : null };
    }
    const diff = shared.reduce((s, r) => s + Math.abs(r.rating - mine.get(r.mediaId)!), 0) / shared.length;
    return { sharedCount: shared.length, percent: Math.round(100 - diff * 10) };
  }

  private diaryStats(user: DUser) {
    const year = new Date().getFullYear();
    const reviews = this.db.reviews.filter(
      (r) => r.userId === user.id && (r.dateWatched ?? r.reviewTime).startsWith(String(year))
    );
    const distribution = [0, 0, 0, 0, 0];
    reviews.forEach((r) => distribution[Math.min(4, Math.max(0, Math.ceil(r.rating / 2) - 1))]++);
    const genres = this.shares(reviews.flatMap((r) => this.genresOf(this.mediaById(r.mediaId))));
    return {
      year,
      yearCount: reviews.length,
      yearAverage: reviews.length ? round1(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length / 2) : 0,
      topGenre: genres[0]?.name ?? null,
      distribution,
      mediaTypes: this.shares(reviews.map((r) => this.mediaById(r.mediaId).type)),
    };
  }

  private shares(values: string[]) {
    const counts = new Map<string, number>();
    values.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
    const total = values.length || 1;
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count, percentage: Math.round((count / total) * 100) }));
  }

  // ————————————————————————————————————————————————————— follow

  private follow(_req: DemoRequest, username: string) {
    const me = this.requireMe();
    const target = this.userByName(username);
    if (target.id === me.id) throw new DemoHttpError(400, 'You cannot follow yourself.');
    if (this.isFollowing(me.id, target.id)) return null;
    if (target.profilePublic) {
      this.db.follows.push([me.id, target.id]);
      this.notify(target.id, 'FOLLOW', `${me.username} started following you`, me.id);
    } else if (!this.db.requests.some((q) => q.senderId === me.id && q.receiverId === target.id)) {
      const request: DRequest = { id: this.id(), senderId: me.id, receiverId: target.id, at: iso() };
      this.db.requests.push(request);
      this.notify(target.id, 'FOLLOW_REQUEST', `${me.username} wants to follow you`, me.id, request.id);
      // Private demo people accept after a moment.
      setTimeout(() => {
        if (!this.db.requests.includes(request)) return;
        this.db.requests = this.db.requests.filter((q) => q !== request);
        this.db.follows.push([me.id, target.id]);
        this.notify(me.id, 'FOLLOW', `${target.username} accepted your follow request`, target.id);
        this.save();
        this.onActivity();
      }, 8000);
    }
    return null;
  }

  private unfollow(_req: DemoRequest, username: string) {
    const me = this.requireMe();
    const target = this.userByName(username);
    this.db.follows = this.db.follows.filter(([a, b]) => !(a === me.id && b === target.id));
    this.db.requests = this.db.requests.filter((q) => !(q.senderId === me.id && q.receiverId === target.id));
    return null;
  }

  private answerRequest(id: number, accept: boolean) {
    const me = this.requireMe();
    const request = this.db.requests.find((q) => q.id === id && q.receiverId === me.id);
    if (!request) throw new DemoHttpError(404, 'Request not found.');
    this.db.requests = this.db.requests.filter((q) => q !== request);
    this.db.notifications = this.db.notifications.filter((n) => !(n.type === 'FOLLOW_REQUEST' && n.referenceId === id));
    if (accept) {
      this.db.follows.push([request.senderId, me.id]);
      this.notify(request.senderId, 'FOLLOW', `${me.username} accepted your follow request`, me.id);
    }
    return null;
  }

  // ————————————————————————————————————————————————————— lists

  private diary() {
    const me = this.requireMe();
    const reviews = this.db.reviews
      .filter((r) => r.userId === me.id)
      .sort((a, b) => (b.dateWatched ?? b.reviewTime).localeCompare(a.dateWatched ?? a.reviewTime));
    return {
      id: -1, name: 'Diary', listType: 'DIARY', privateList: false, numberOfElements: reviews.length,
      owner: this.userDto(me), movies: [], reviews: reviews.map((r) => this.reviewDto(r)),
    };
  }

  private createList(req: DemoRequest) {
    const me = this.requireMe();
    const name = String(req.body?.name ?? '').trim();
    if (!name) throw new DemoHttpError(400, 'Give the list a name.');
    const list: DList = {
      id: this.id(), ownerId: me.id, name: name.slice(0, 60), listType: 'CUSTOM',
      privateList: !!req.body?.privateList, mediaIds: [], reviewIds: [], creationDate: iso(), lastModificationDate: iso(),
    };
    this.db.lists.push(list);
    return this.listDto(list);
  }

  private addToList(list: DList, media: DMedia) {
    if (!list.mediaIds.includes(media.id)) list.mediaIds.unshift(media.id);
    list.lastModificationDate = iso();
    return this.listDto(list);
  }

  private ownList(id: number, mustOwn = true): DList {
    const list = this.db.lists.find((l) => l.id === id);
    if (!list) throw new DemoHttpError(404, 'List not found.');
    const me = this.requireMe();
    if (list.ownerId !== me.id && (mustOwn || list.privateList)) throw new DemoHttpError(403, 'Not your list.');
    return list;
  }

  private watchlistOf(user: DUser): DList {
    let list = this.db.lists.find((l) => l.ownerId === user.id && l.listType === 'WATCHLIST');
    if (!list) {
      list = {
        id: this.id(), ownerId: user.id, name: 'Watchlist', listType: 'WATCHLIST', privateList: true,
        mediaIds: [], reviewIds: [], creationDate: iso(), lastModificationDate: iso(),
      };
      this.db.lists.push(list);
    }
    return list;
  }

  // ————————————————————————————————————————————————————— recommendations

  private createRecommendation(req: DemoRequest) {
    const me = this.requireMe();
    const b = req.body ?? {};
    const to = this.userByName(String(b.toUsername ?? '').trim());
    if (to.id === me.id) throw new DemoHttpError(400, 'Recommend it to someone else.');
    const media = b.tmdbId ? this.mediaWhere((m) => m.tmdbId === +b.tmdbId) : this.mediaByKey(String(b.externalKey ?? ''));
    const rec: DRec = {
      id: this.id(), fromId: me.id, toId: to.id, mediaId: media.id, status: 'PENDING', creationTime: iso(),
      days: Math.min(90, Math.max(1, Number(b.challengeDurationDays) || 7)),
      points: Math.min(100, Math.max(0, Number(b.challengePoints) || 10)),
    };
    this.db.recs.push(rec);
    this.notify(to.id, 'RECOMMENDATION', `${me.username} challenged you to ${media.title}`, me.id, rec.id);
    return this.recDto(rec);
  }

  private answerRecommendation(_req: DemoRequest, id: string, action: string) {
    const me = this.requireMe();
    const rec = this.db.recs.find((r) => r.id === +id);
    if (!rec) throw new DemoHttpError(404, 'Recommendation not found.');
    if (rec.toId !== me.id) throw new DemoHttpError(403, 'Only the person challenged can answer.');
    if (action === 'accept' && rec.status === 'PENDING') rec.status = 'ACCEPTED';
    else if (action === 'reject' && rec.status === 'PENDING') rec.status = 'REJECTED';
    else if (action === 'complete' && rec.status === 'ACCEPTED') {
      rec.status = 'COMPLETED';
      me.points += rec.points;
    } else throw new DemoHttpError(400, 'That challenge has already been answered.');
    const verb = { accept: 'accepted', reject: 'declined', complete: 'completed' }[action];
    this.notify(rec.fromId, 'RECOMMENDATION', `${me.username} ${verb} your challenge: ${this.mediaById(rec.mediaId).title}`, me.id, rec.id);
    return this.recDto(rec);
  }

  private readonly newestRec = (a: DRec, b: DRec) => b.creationTime.localeCompare(a.creationTime);

  // ————————————————————————————————————————————————————— DTOs

  private userDto(u: DUser) {
    const me = this.me;
    return {
      id: u.id,
      username: u.username,
      email: me?.id === u.id ? u.email : '',
      fullName: u.fullName,
      bio: u.bio,
      avatarUrl: u.avatarUrl,
      profilePublic: u.profilePublic,
      gainedChallengePoints: u.points,
      followerCount: this.db.follows.filter(([, b]) => b === u.id).length,
      followingCount: this.db.follows.filter(([a]) => a === u.id).length,
      following: !!me && this.isFollowing(me.id, u.id),
      followRequested: !!me && this.db.requests.some((q) => q.senderId === me.id && q.receiverId === u.id),
    };
  }

  private mediaDto(m: DMedia) {
    const reviews = this.db.reviews.filter((r) => r.mediaId === m.id);
    return {
      id: m.id,
      tmdbId: m.tmdbId,
      mediaType: m.type,
      externalKey: `demo:${m.slug}`,
      creator: m.creator,
      title: m.title,
      description: m.description,
      genre: m.genre,
      year: m.year,
      network: m.network,
      seasonCount: m.seasonCount,
      trackCount: m.tracks?.length,
      imdbRating: reviews.length >= 2 ? round1(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : undefined,
      reviewCount: reviews.length,
    };
  }

  private reviewDto(r: DReview) {
    return {
      id: r.id,
      rating: r.rating,
      text: r.text,
      movie: this.mediaDto(this.mediaById(r.mediaId)),
      author: this.userDto(this.userById(r.userId)!),
      dateWatched: r.dateWatched,
      seenBefore: r.seenBefore,
      spoiler: r.spoiler,
      reviewTime: r.reviewTime,
      lastUpdated: r.lastUpdated,
      commentCount: this.db.comments.filter((c) => c.reviewId === r.id).length,
      reactions: this.reactionSummary('review', r.id),
    };
  }

  private commentDto(c: DComment) {
    return { id: c.id, text: c.text, reviewId: c.reviewId, user: this.userDto(this.userById(c.userId)!), createdAt: c.createdAt };
  }

  private listDto(l: DList) {
    return {
      id: l.id,
      name: l.name,
      listType: l.listType,
      privateList: l.privateList,
      numberOfElements: l.mediaIds.length,
      creationDate: l.creationDate,
      lastModificationDate: l.lastModificationDate,
      owner: this.userDto(this.userById(l.ownerId)!),
      movies: l.mediaIds.map((id) => this.db.media.find((m) => m.id === id)).filter((m): m is DMedia => !!m).map((m) => this.mediaDto(m)),
      reviews: l.reviewIds.map((id) => this.db.reviews.find((r) => r.id === id)).filter((r): r is DReview => !!r).map((r) => this.reviewDto(r)),
    };
  }

  private recDto(r: DRec) {
    return {
      id: r.id,
      fromUser: this.userDto(this.userById(r.fromId)!),
      toUser: this.userDto(this.userById(r.toId)!),
      movie: this.mediaDto(this.mediaById(r.mediaId)),
      status: r.status,
      creationTime: r.creationTime,
      challengeDurationDays: r.days,
      endTime: new Date(new Date(r.creationTime).getTime() + r.days * DAY).toISOString(),
      challengePoints: r.points,
    };
  }

  private page<T>(items: T[], params: URLSearchParams) {
    const page = Math.max(0, Number(params.get('page') ?? 0));
    const size = Math.max(1, Number(params.get('size') ?? 20));
    return {
      content: items.slice(page * size, page * size + size),
      page,
      size,
      totalElements: items.length,
      totalPages: Math.ceil(items.length / size),
    };
  }

  // ————————————————————————————————————————————————————— lookups

  private id(): number {
    return this.db.nextId++;
  }

  private userById(id: number | undefined): DUser | undefined {
    return this.db.users.find((u) => u.id === id);
  }

  private userByName(name: string): DUser {
    const user = this.db.users.find((u) => u.username.toLowerCase() === name.toLowerCase());
    if (!user) throw new DemoHttpError(404, `Nobody called ${name} here.`);
    return user;
  }

  private mediaById(id: number): DMedia {
    return this.mediaWhere((m) => m.id === id);
  }

  private mediaWhere(fn: (m: DMedia) => boolean): DMedia {
    const media = this.db.media.find(fn);
    if (!media) throw new DemoHttpError(404, 'Title not found.');
    return media;
  }

  private mediaByKey(key: string): DMedia {
    const slug = key.replace(/^demo:/, '');
    return this.mediaWhere((m) => m.slug === slug || String(m.tmdbId) === slug);
  }

  private reviewById(id: number): DReview {
    const review = this.db.reviews.find((r) => r.id === id);
    if (!review) throw new DemoHttpError(404, 'Review not found.');
    return review;
  }

  private ownReview(id: number): DReview {
    const review = this.reviewById(id);
    if (review.userId !== this.requireMe().id) throw new DemoHttpError(403, 'Not your review.');
    return review;
  }

  private reviewsWhere(fn: (r: DReview) => boolean): DReview[] {
    return this.db.reviews.filter(fn).sort((a, b) => b.reviewTime.localeCompare(a.reviewTime));
  }

  private genresOf(m: DMedia): string[] {
    return m.genre.split(',').map((g) => g.trim()).filter(Boolean);
  }

  private isFollowing(a: number, b: number): boolean {
    return this.db.follows.some(([x, y]) => x === a && y === b);
  }

  private notify(userId: number, type: string, message: string, actorId?: number, referenceId?: number): void {
    this.db.notifications.push({ id: this.id(), userId, type, message, read: false, createdAt: iso(), actorId, referenceId });
  }

  private save(): void {
    storage.setJson(DB_KEY, this.db);
  }

  // ————————————————————————————————————————————————————— seed

  private seed(): DB {
    let next = 1;
    const db: DB = {
      version: DB_VERSION, nextId: 0, users: [], media: [], reviews: [], comments: [], reactions: [],
      lists: [], follows: [], requests: [], notifications: [], recs: [], sessions: {},
    };
    for (const u of SEED_USERS) {
      db.users.push({
        id: next++, username: u.username, email: `${u.username}@demo.criticomrade.app`, password: DEMO_PASSWORD,
        fullName: u.fullName, bio: u.bio, profilePublic: u.profilePublic, points: 0,
      });
    }
    let tmdb = 900001;
    for (const m of SEED_MEDIA) {
      db.media.push({ ...m, id: next++, tmdbId: m.type === 'FILM' ? tmdb++ : undefined });
    }
    const user = (name: string) => db.users.find((u) => u.username === name)!;
    const media = (slug: string) => db.media.find((m) => m.slug === slug)!;
    const review = (author: string, slug: string) =>
      db.reviews.find((r) => r.userId === user(author).id && r.mediaId === media(slug).id)!;

    for (const [author, slug, rating, text, days, spoiler] of SEED_REVIEWS) {
      const at = days * DAY + (days * 7919) % (8 * 3_600_000);
      db.reviews.push({
        id: next++, userId: user(author).id, mediaId: media(slug).id, rating, text,
        dateWatched: dateOnly(at + DAY), seenBefore: false, spoiler: !!spoiler, reviewTime: iso(at), lastUpdated: iso(at),
      });
    }
    for (const [author, reviewAuthor, slug, text, minutes] of SEED_COMMENTS) {
      const r = review(reviewAuthor, slug);
      db.comments.push({
        id: next++, reviewId: r.id, userId: user(author).id, text,
        createdAt: new Date(new Date(r.reviewTime).getTime() + minutes * 60_000).toISOString(),
      });
    }
    for (const [liker, reviewAuthor, slug] of SEED_LIKES) {
      db.reactions.push({ target: 'review', targetId: review(reviewAuthor, slug).id, userId: user(liker).id, type: 'LIKE' });
    }
    for (const [a, b] of SEED_FOLLOWS) db.follows.push([user(a).id, user(b).id]);

    const comrade = user('demo');
    db.lists.push({
      id: next++, ownerId: comrade.id, name: 'Watchlist', listType: 'WATCHLIST', privateList: true,
      mediaIds: SEED_WATCHLIST.map((s) => media(s).id), reviewIds: [], creationDate: iso(60 * DAY), lastModificationDate: iso(2 * DAY),
    });
    SEED_LISTS.forEach((l, i) =>
      db.lists.push({
        id: next++, ownerId: comrade.id, name: l.name, listType: 'CUSTOM', privateList: l.privateList,
        mediaIds: l.slugs.map((s) => media(s).id), reviewIds: [], creationDate: iso((40 - i * 10) * DAY), lastModificationDate: iso((5 + i) * DAY),
      })
    );
    for (const name of ['vera', 'tibor', 'jovana', 'felix', 'amara']) {
      const u = user(name);
      db.lists.push({
        id: next++, ownerId: u.id, name: 'Watchlist', listType: 'WATCHLIST', privateList: true,
        mediaIds: [], reviewIds: [], creationDate: iso(90 * DAY), lastModificationDate: iso(90 * DAY),
      });
    }

    const amara = user('amara');
    const requestId = next++;
    db.requests.push({ id: requestId, senderId: amara.id, receiverId: comrade.id, at: iso(3 * 3_600_000) });

    const rec = (from: string, to: string, slug: string, status: DRec['status'], days: number, points: number, ago: number) => {
      const r: DRec = { id: next++, fromId: user(from).id, toId: user(to).id, mediaId: media(slug).id, status, creationTime: iso(ago * DAY), days, points };
      db.recs.push(r);
      return r;
    };
    const veraRec = rec('vera', 'demo', 'werckmeister-harmonies', 'PENDING', 14, 30, 1);
    rec('jovana', 'demo', 'blue', 'ACCEPTED', 7, 15, 4);
    rec('demo', 'amara', 'paris-texas', 'PENDING', 10, 20, 2);
    rec('demo', 'felix', 'solaris', 'COMPLETED', 30, 25, 40);
    user('felix').points = 25;
    comrade.points = 40;

    const note = (type: string, message: string, actor: string, ref: number | undefined, hoursAgo: number, read: boolean) =>
      db.notifications.push({
        id: next++, userId: comrade.id, type, message, read, createdAt: iso(hoursAgo * 3_600_000), actorId: user(actor).id, referenceId: ref,
      });
    note('FOLLOW_REQUEST', 'amara wants to follow you', 'amara', requestId, 3, false);
    note('RECOMMENDATION', 'vera challenged you to Werckmeister Harmonies', 'vera', veraRec.id, 20, false);
    note('COMMENT', 'jovana commented on your review of Parasite', 'jovana', review('demo', 'parasite').id, 30, false);
    note('LIKE', 'tibor liked your review of Spirited Away', 'tibor', review('demo', 'spirited-away').id, 72, true);
    note('FOLLOW', 'felix started following you', 'felix', undefined, 120, true);

    db.nextId = next;
    return db;
  }
}

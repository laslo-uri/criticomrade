import { MediaType } from '../models/media-item.model';

/**
 * Seed data for the in-browser demo backend.
 * Titles, creators and years are real; descriptions and reviews are written for this demo.
 */

export interface SeedMedia {
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

export const SEED_MEDIA: SeedMedia[] = [
  // —— Films ——
  {
    slug: 'stalker', type: 'FILM', title: 'Stalker', creator: 'Andrei Tarkovsky', year: '1979', genre: 'Sci-Fi, Drama',
    description: 'A guide leads a writer and a professor into the Zone, a guarded wasteland where one room is said to grant your deepest wish.',
    cast: ['Alexander Kaidanovsky', 'Anatoly Solonitsyn', 'Nikolai Grinko', 'Alisa Freindlich'],
  },
  {
    slug: 'parasite', type: 'FILM', title: 'Parasite', creator: 'Bong Joon-ho', year: '2019', genre: 'Thriller, Comedy',
    description: 'A broke family talks its way, one job at a time, into the household of the wealthy Parks.',
    cast: ['Song Kang-ho', 'Lee Sun-kyun', 'Cho Yeo-jeong', 'Choi Woo-shik', 'Park So-dam'],
  },
  {
    slug: 'in-the-mood-for-love', type: 'FILM', title: 'In the Mood for Love', creator: 'Wong Kar-wai', year: '2000', genre: 'Romance, Drama',
    description: 'Hong Kong, 1962. Two neighbours learn their spouses are having an affair and drift into something they refuse to name.',
    cast: ['Tony Leung Chiu-wai', 'Maggie Cheung'],
  },
  {
    slug: 'spirited-away', type: 'FILM', title: 'Spirited Away', creator: 'Hayao Miyazaki', year: '2001', genre: 'Animation, Fantasy',
    description: 'A sulky ten-year-old wanders into a bathhouse for spirits and has to work her way back to her parents.',
  },
  {
    slug: 'mad-max-fury-road', type: 'FILM', title: 'Mad Max: Fury Road', creator: 'George Miller', year: '2015', genre: 'Action',
    description: 'Two hours of chase across a desert, with a war rig, five escaped wives and a lot of chrome.',
    cast: ['Tom Hardy', 'Charlize Theron', 'Nicholas Hoult'],
  },
  {
    slug: 'portrait-of-a-lady-on-fire', type: 'FILM', title: 'Portrait of a Lady on Fire', creator: 'Céline Sciamma', year: '2019', genre: 'Romance, Drama',
    description: 'A painter is hired to secretly paint a bride-to-be who refuses to sit for her portrait.',
    cast: ['Noémie Merlant', 'Adèle Haenel'],
  },
  {
    slug: 'paris-texas', type: 'FILM', title: 'Paris, Texas', creator: 'Wim Wenders', year: '1984', genre: 'Drama',
    description: 'A man walks out of the desert after four years and tries to put his family back together.',
    cast: ['Harry Dean Stanton', 'Nastassja Kinski', 'Dean Stockwell'],
  },
  {
    slug: 'arrival', type: 'FILM', title: 'Arrival', creator: 'Denis Villeneuve', year: '2016', genre: 'Sci-Fi, Drama',
    description: 'A linguist is asked to talk to visitors whose language rearranges how she experiences time.',
    cast: ['Amy Adams', 'Jeremy Renner', 'Forest Whitaker'],
  },
  {
    slug: 'seven-samurai', type: 'FILM', title: 'Seven Samurai', creator: 'Akira Kurosawa', year: '1954', genre: 'Action, Drama',
    description: 'A village of farmers hires seven out-of-work samurai to defend the harvest from bandits.',
    cast: ['Toshiro Mifune', 'Takashi Shimura'],
  },
  {
    slug: 'everything-everywhere', type: 'FILM', title: 'Everything Everywhere All at Once', creator: 'Daniel Kwan, Daniel Scheinert', year: '2022', genre: 'Sci-Fi, Comedy',
    description: 'A laundromat owner in the middle of a tax audit is told she has to save the multiverse.',
    cast: ['Michelle Yeoh', 'Ke Huy Quan', 'Stephanie Hsu', 'Jamie Lee Curtis'],
  },
  {
    slug: 'the-battle-of-algiers', type: 'FILM', title: 'The Battle of Algiers', creator: 'Gillo Pontecorvo', year: '1966', genre: 'War, Drama',
    description: 'The Algerian struggle for independence, staged so closely to newsreel that it still feels like footage.',
  },
  {
    slug: 'perfect-days', type: 'FILM', title: 'Perfect Days', creator: 'Wim Wenders', year: '2023', genre: 'Drama',
    description: 'A Tokyo toilet cleaner keeps a quiet routine of cassettes, paperbacks and photographs of trees.',
    cast: ['Koji Yakusho'],
  },
  {
    slug: 'past-lives', type: 'FILM', title: 'Past Lives', creator: 'Celine Song', year: '2023', genre: 'Romance, Drama',
    description: 'Two childhood friends from Seoul meet again in New York, twenty-four years and one marriage later.',
    cast: ['Greta Lee', 'Teo Yoo', 'John Magaro'],
  },
  {
    slug: 'werckmeister-harmonies', type: 'FILM', title: 'Werckmeister Harmonies', creator: 'Béla Tarr', year: '2000', genre: 'Drama',
    description: 'A travelling circus brings a stuffed whale to a frozen Hungarian town, and the town starts to come apart.',
  },
  {
    slug: 'run-lola-run', type: 'FILM', title: 'Run Lola Run', creator: 'Tom Tykwer', year: '1998', genre: 'Thriller, Action',
    description: 'Lola has twenty minutes to find 100,000 marks. She gets three tries.',
    cast: ['Franka Potente', 'Moritz Bleibtreu'],
  },
  {
    slug: 'underground', type: 'FILM', title: 'Underground', creator: 'Emir Kusturica', year: '1995', genre: 'Comedy, War',
    description: 'Fifty years of Yugoslav history, told through a cellar full of people who think the war never ended.',
  },
  // —— Shows ——
  {
    slug: 'severance', type: 'SHOW', title: 'Severance', creator: 'Dan Erickson', year: '2022', genre: 'Sci-Fi, Thriller', network: 'Apple TV+',
    description: 'Office workers have their memories split between work and home. The work selves would like a word.',
  },
  {
    slug: 'the-bear', type: 'SHOW', title: 'The Bear', creator: 'Christopher Storer', year: '2022', genre: 'Comedy, Drama', network: 'FX',
    description: 'A fine-dining chef comes home to run his late brother’s sandwich shop in Chicago.',
  },
  {
    slug: 'twin-peaks', type: 'SHOW', title: 'Twin Peaks', creator: 'David Lynch, Mark Frost', year: '1990', genre: 'Mystery, Drama', network: 'ABC',
    description: 'An FBI agent investigates the murder of a homecoming queen in a town full of damn fine coffee and secrets.',
  },
  {
    slug: 'chernobyl', type: 'SHOW', title: 'Chernobyl', creator: 'Craig Mazin', year: '2019', genre: 'Drama, History', network: 'HBO', seasonCount: 1,
    description: 'The 1986 disaster and the people who cleaned it up while the state insisted nothing had happened.',
  },
  {
    slug: 'better-call-saul', type: 'SHOW', title: 'Better Call Saul', creator: 'Vince Gilligan, Peter Gould', year: '2015', genre: 'Crime, Drama', network: 'AMC', seasonCount: 6,
    description: 'Small-time lawyer Jimmy McGill becomes Saul Goodman, one bad decision at a time.',
  },
  {
    slug: 'fleabag', type: 'SHOW', title: 'Fleabag', creator: 'Phoebe Waller-Bridge', year: '2016', genre: 'Comedy, Drama', network: 'BBC Three', seasonCount: 2,
    description: 'A woman in London runs a failing café and keeps talking to us instead of her family.',
  },
  {
    slug: 'dark', type: 'SHOW', title: 'Dark', creator: 'Baran bo Odar, Jantje Friese', year: '2017', genre: 'Sci-Fi, Mystery', network: 'Netflix', seasonCount: 3,
    description: 'A missing boy in a German town opens a family mystery that spans four generations and several timelines.',
  },
  {
    slug: 'the-wire', type: 'SHOW', title: 'The Wire', creator: 'David Simon', year: '2002', genre: 'Crime, Drama', network: 'HBO', seasonCount: 5,
    description: 'Baltimore, one institution per season: the street, the docks, city hall, the schools and the paper.',
  },
  // —— Books ——
  {
    slug: 'the-dispossessed', type: 'BOOK', title: 'The Dispossessed', creator: 'Ursula K. Le Guin', year: '1974', genre: 'Sci-Fi',
    description: 'A physicist leaves his anarchist moon for the rich planet next door and finds neither world is the utopia it claims.',
  },
  {
    slug: 'satantango', type: 'BOOK', title: 'Satantango', creator: 'László Krasznahorkai', year: '1985', genre: 'Literary fiction',
    description: 'In a rain-soaked Hungarian collective farm, the villagers hear that a man they thought dead is coming back.',
  },
  {
    slug: 'the-master-and-margarita', type: 'BOOK', title: 'The Master and Margarita', creator: 'Mikhail Bulgakov', year: '1967', genre: 'Fantasy, Satire',
    description: 'The Devil visits Soviet Moscow with a talking cat, and the literary establishment does not come out of it well.',
  },
  {
    slug: 'never-let-me-go', type: 'BOOK', title: 'Never Let Me Go', creator: 'Kazuo Ishiguro', year: '2005', genre: 'Literary fiction',
    description: 'Three friends look back on an English boarding school that was preparing them for something nobody said out loud.',
  },
  {
    slug: 'the-bridge-on-the-drina', type: 'BOOK', title: 'The Bridge on the Drina', creator: 'Ivo Andrić', year: '1945', genre: 'Historical fiction',
    description: 'Four centuries of life in Višegrad, told through the stone bridge everyone in town crosses.',
  },
  {
    slug: 'piranesi', type: 'BOOK', title: 'Piranesi', creator: 'Susanna Clarke', year: '2020', genre: 'Fantasy',
    description: 'A man lives alone in an endless house of statues and tides, and keeps very careful notes.',
  },
  {
    slug: 'solaris', type: 'BOOK', title: 'Solaris', creator: 'Stanisław Lem', year: '1961', genre: 'Sci-Fi',
    description: 'Scientists orbiting an ocean planet start receiving visitors made from their own memories.',
  },
  {
    slug: 'the-remains-of-the-day', type: 'BOOK', title: 'The Remains of the Day', creator: 'Kazuo Ishiguro', year: '1989', genre: 'Literary fiction',
    description: 'An English butler takes a motoring trip and slowly admits what his loyalty has cost him.',
  },
  // —— Albums ——
  {
    slug: 'kid-a', type: 'ALBUM', title: 'Kid A', creator: 'Radiohead', year: '2000', genre: 'Electronic, Rock',
    description: 'The band that made OK Computer swapped guitars for synths and drum machines and confused everyone, gloriously.',
    tracks: ['Everything in Its Right Place', 'Kid A', 'The National Anthem', 'How to Disappear Completely', 'Treefingers', 'Optimistic', 'In Limbo', 'Idioteque', 'Morning Bell', 'Motion Picture Soundtrack'],
  },
  {
    slug: 'in-rainbows', type: 'ALBUM', title: 'In Rainbows', creator: 'Radiohead', year: '2007', genre: 'Rock',
    description: 'Released pay-what-you-want and somehow the warmest record they ever made.',
    tracks: ['15 Step', 'Bodysnatchers', 'Nude', 'Weird Fishes/Arpeggi', 'All I Need', 'Faust Arp', 'Reckoner', 'House of Cards', 'Jigsaw Falling into Place', 'Videotape'],
  },
  {
    slug: 'blue', type: 'ALBUM', title: 'Blue', creator: 'Joni Mitchell', year: '1971', genre: 'Folk',
    description: 'Ten songs written with the defences down. The blueprint for every confessional record since.',
    tracks: ['All I Want', 'My Old Man', 'Little Green', 'Carey', 'Blue', 'California', 'This Flight Tonight', 'River', 'A Case of You', 'The Last Time I Saw Richard'],
  },
  {
    slug: 'to-pimp-a-butterfly', type: 'ALBUM', title: 'To Pimp a Butterfly', creator: 'Kendrick Lamar', year: '2015', genre: 'Hip-hop, Jazz',
    description: 'Funk, jazz and spoken word wrapped around a long conversation about fame, guilt and Black America.',
  },
  {
    slug: 'homogenic', type: 'ALBUM', title: 'Homogenic', creator: 'Björk', year: '1997', genre: 'Electronic',
    description: 'String sections and volcanic beats, written as a portrait of Iceland.',
  },
  {
    slug: 'remain-in-light', type: 'ALBUM', title: 'Remain in Light', creator: 'Talking Heads', year: '1980', genre: 'New wave, Funk',
    description: 'Afrobeat polyrhythms meet David Byrne’s anxious preacher. Still sounds like nothing else.',
  },
  {
    slug: 'blonde', type: 'ALBUM', title: 'Blonde', creator: 'Frank Ocean', year: '2016', genre: 'R&B',
    description: 'Hazy, unhurried songs that keep pulling the floor out from under their own hooks.',
  },
  {
    slug: 'selected-ambient-works', type: 'ALBUM', title: 'Selected Ambient Works 85–92', creator: 'Aphex Twin', year: '1992', genre: 'Electronic, Ambient',
    description: 'Teenage bedroom recordings that turned out to be a template for a whole genre.',
  },
];

export interface SeedUser {
  username: string;
  fullName: string;
  bio: string;
  profilePublic: boolean;
}

export const DEMO_PASSWORD = 'criticomrade';
export const DEMO_USERNAME = 'demo';
export const DEMO_RESET_CODE = '123456';

export const SEED_USERS: SeedUser[] = [
  { username: 'demo', fullName: 'Demo Comrade', bio: 'Trying out CritiComrade. Everything I log here stays in this browser.', profilePublic: true },
  { username: 'vera', fullName: 'Vera Lindqvist', bio: 'Slow cinema, long books, cold coffee.', profilePublic: true },
  { username: 'tibor', fullName: 'Tibor Nagy', bio: 'Budapest. Reads Krasznahorkai on the tram, unironically.', profilePublic: true },
  { username: 'jovana', fullName: 'Jovana Petrović', bio: 'Records first, films second. Novi Sad.', profilePublic: true },
  { username: 'felix', fullName: 'Felix Brandt', bio: 'Science fiction or nothing. Berlin.', profilePublic: true },
  { username: 'amara', fullName: 'Amara Okafor', bio: 'Prestige TV defender. Will argue about season finales.', profilePublic: false },
];

/** [author, title slug, rating out of 10, text, days ago, spoiler?] */
export const SEED_REVIEWS: [string, string, number, string, number, boolean?][] = [
  ['vera', 'stalker', 10, 'Three men walk into a field and it is somehow the most tense thing I have seen all year. The switch from sepia to colour still gets me.', 2],
  ['felix', 'stalker', 7, 'Beautiful, but I wanted more Zone and fewer monologues. The dog was the best performance.', 3],
  ['vera', 'werckmeister-harmonies', 9, 'The opening tavern scene is the whole film in ten minutes. Bring patience, leave changed.', 9],
  ['vera', 'perfect-days', 9, 'Nothing happens and I cried twice.', 20],
  ['vera', 'satantango', 8, 'Sentences that go on for pages, like rain that will not stop. Worth every one of them.', 34],
  ['vera', 'in-the-mood-for-love', 10, 'Every corridor, every cheongsam, every glance that almost happens. Perfect.', 51],
  ['vera', 'portrait-of-a-lady-on-fire', 9, 'The final shot. That is the review.', 63],
  ['vera', 'past-lives', 8, 'A film about the people we did not become. Gentle and very precise.', 80],
  ['tibor', 'the-master-and-margarita', 10, 'Satan visits Moscow and the bureaucrats come off worse. Funnier than I remembered.', 4],
  ['tibor', 'satantango', 10, 'Home turf. The dance chapter is untouchable.', 15],
  ['tibor', 'solaris', 8, 'Lem writes the ocean better than most writers manage people.', 27],
  ['tibor', 'underground', 8, 'Loud, sprawling and exhausting, and I would not cut a minute.', 41],
  ['tibor', 'piranesi', 7, 'Lovely and slight. A house you want to keep walking around in.', 58],
  ['tibor', 'seven-samurai', 9, 'Three and a half hours that feel like ninety minutes. The rain battle is cinema.', 70],
  ['jovana', 'kid-a', 10, 'Still sounds like the future arrived early and nobody told it.', 1],
  ['jovana', 'blue', 10, 'A Case of You ruins me every single time.', 12],
  ['jovana', 'to-pimp-a-butterfly', 9, 'Dense, angry, jazzy, generous. My album of the decade.', 22],
  ['jovana', 'homogenic', 9, 'Strings and beats fighting on a glacier.', 38],
  ['jovana', 'selected-ambient-works', 8, 'Perfect for writing. Or for not writing.', 47],
  ['jovana', 'in-rainbows', 9, 'Weird Fishes into All I Need is the best one-two of the century.', 66],
  ['jovana', 'paris-texas', 9, 'Ry Cooder’s slide guitar is a character in this film.', 88],
  ['felix', 'arrival', 9, 'The best film about linguistics that will also make you call your mother.', 6],
  ['felix', 'dark', 9, 'Draw a family tree before episode four. Trust me.', 18],
  ['felix', 'the-dispossessed', 10, 'The most honest book about utopia I know: it shows you the bill.', 31],
  ['felix', 'everything-everywhere', 8, 'Ten out of ten concept, eight out of ten execution. Hot dog fingers forever.', 44],
  ['felix', 'severance', 9, 'A workplace comedy that turns into a horror film while you are not looking.', 57],
  ['felix', 'mad-max-fury-road', 9, 'An action film edited like a symphony.', 73],
  ['amara', 'the-wire', 10, 'Every season adds an institution and somehow it all still fits.', 5],
  ['amara', 'better-call-saul', 10, 'Better than Breaking Bad and I will die on this hill.', 14],
  ['amara', 'fleabag', 9, 'The confession scene in season two. Enough said.', 25],
  ['amara', 'chernobyl', 9, 'Quietly the most frightening thing I have watched.', 36],
  ['amara', 'the-bear', 7, 'Season one was lightning. After that it is more of a slow simmer.', 49],
  ['amara', 'parasite', 10, 'The stairs. The rain. The basement. Bong never wastes a frame.', 61],
  ['amara', 'twin-peaks', 8, 'Uneven, strange and I would follow Cooper anywhere.', 77],
  ['demo', 'parasite', 9, 'Started as a comedy and ended with me staring at the ceiling.', 8],
  ['demo', 'spirited-away', 10, 'Watched it again as an adult. No-Face hits differently now.', 26],
  ['demo', 'never-let-me-go', 8, 'Gentle on the surface and devastating underneath.', 45],
];

/** [author, reviewAuthor, title slug, text, minutes after the review] */
export const SEED_COMMENTS: [string, string, string, string, number][] = [
  ['vera', 'felix', 'stalker', 'Fewer monologues?! The monologues are the Zone.', 90],
  ['felix', 'felix', 'stalker', 'Fair. But you have to admit the dog steals it.', 140],
  ['tibor', 'felix', 'stalker', 'Read the novel, Roadside Picnic. Then come back to this.', 300],
  ['jovana', 'demo', 'parasite', 'The peach scene. I still think about it.', 60],
  ['tibor', 'jovana', 'kid-a', 'Idioteque at 3am is a religious experience.', 45],
  ['amara', 'vera', 'in-the-mood-for-love', 'Adding to my watchlist purely because of this review.', 200],
];

/** [liker, reviewAuthor, title slug] */
export const SEED_LIKES: [string, string, string][] = [
  ['tibor', 'vera', 'stalker'], ['jovana', 'vera', 'stalker'], ['demo', 'vera', 'stalker'], ['amara', 'vera', 'stalker'],
  ['vera', 'felix', 'stalker'],
  ['vera', 'tibor', 'the-master-and-margarita'], ['felix', 'tibor', 'the-master-and-margarita'],
  ['vera', 'jovana', 'kid-a'], ['tibor', 'jovana', 'kid-a'], ['felix', 'jovana', 'kid-a'],
  ['demo', 'jovana', 'blue'], ['vera', 'jovana', 'blue'],
  ['amara', 'felix', 'arrival'], ['vera', 'felix', 'arrival'],
  ['felix', 'amara', 'the-wire'], ['jovana', 'amara', 'the-wire'],
  ['jovana', 'demo', 'parasite'], ['tibor', 'demo', 'spirited-away'], ['vera', 'demo', 'spirited-away'],
  ['tibor', 'vera', 'werckmeister-harmonies'], ['felix', 'felix', 'the-dispossessed'],
];

/** [follower, followee] */
export const SEED_FOLLOWS: [string, string][] = [
  ['demo', 'vera'], ['demo', 'tibor'], ['demo', 'jovana'],
  ['felix', 'demo'], ['vera', 'demo'],
  ['vera', 'felix'], ['vera', 'tibor'], ['tibor', 'vera'], ['jovana', 'vera'],
  ['amara', 'jovana'], ['felix', 'amara'], ['jovana', 'felix'], ['tibor', 'jovana'],
];

export const SEED_WATCHLIST = ['werckmeister-harmonies', 'stalker', 'severance', 'the-dispossessed', 'remain-in-light', 'seven-samurai'];

export const SEED_LISTS: { name: string; privateList: boolean; slugs: string[] }[] = [
  { name: 'Rainy Sunday', privateList: false, slugs: ['in-the-mood-for-love', 'paris-texas', 'perfect-days', 'blue', 'piranesi'] },
  { name: 'Made in the Eastern Bloc', privateList: false, slugs: ['stalker', 'satantango', 'underground', 'solaris', 'the-bridge-on-the-drina', 'the-master-and-margarita'] },
  { name: 'To argue about with Felix', privateList: true, slugs: ['everything-everywhere', 'dark', 'arrival'] },
];

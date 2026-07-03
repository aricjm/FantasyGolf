import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Please set DATABASE_URL in your .env file to seed.');
  process.exit(1);
}

const sql = neon(databaseUrl);
const db = drizzle(sql, { schema });

const golfersToSeed = [
  // Top 20 World Rank Golfers in PGA
  { id: 1, name: 'Scottie Scheffler', rank: 1, country: 'USA', type: 'top20' },
  { id: 2, name: 'Rory McIlroy', rank: 2, country: 'Northern Ireland', type: 'top20' },
  { id: 3, name: 'Cameron Young', rank: 3, country: 'USA', type: 'top20' },
  { id: 4, name: 'Matt Fitzpatrick', rank: 4, country: 'England', type: 'top20' },
  { id: 5, name: 'Russell Henley', rank: 5, country: 'USA', type: 'top20' },
  { id: 6, name: 'Collin Morikawa', rank: 6, country: 'USA', type: 'top20' },
  { id: 7, name: 'Tommy Fleetwood', rank: 7, country: 'England', type: 'top20' },
  { id: 8, name: 'Justin Rose', rank: 8, country: 'England', type: 'top20' },
  { id: 9, name: 'Wyndham Clark', rank: 9, country: 'USA', type: 'top20' },
  { id: 10, name: 'J.J. Spaun', rank: 10, country: 'USA', type: 'top20' },
  { id: 11, name: 'Viktor Hovland', rank: 11, country: 'Norway', type: 'top20' },
  { id: 12, name: 'Xander Schauffele', rank: 12, country: 'USA', type: 'top20' },
  { id: 13, name: 'Chris Gotterup', rank: 13, country: 'USA', type: 'top20' },
  { id: 14, name: 'Sam Burns', rank: 14, country: 'USA', type: 'top20' },
  { id: 15, name: 'Ben Griffin', rank: 15, country: 'USA', type: 'top20' },
  { id: 16, name: 'Justin Thomas', rank: 16, country: 'USA', type: 'top20' },
  { id: 17, name: 'Aaron Rai', rank: 17, country: 'England', type: 'top20' },
  { id: 18, name: 'Ludvig Åberg', rank: 18, country: 'Sweden', type: 'top20' },
  { id: 19, name: 'Robert MacIntyre', rank: 19, country: 'Scotland', type: 'top20' },
  { id: 20, name: 'Si Woo Kim', rank: 20, country: 'South Korea', type: 'top20' },

  // #21-#125 World Rank Golfers in PGA
  { id: 21, name: 'Sepp Straka', rank: 21, country: 'Austria', type: 'field' },
  { id: 22, name: 'Alex Noren', rank: 22, country: 'Sweden', type: 'field' },
  { id: 23, name: 'Akshay Bhatia', rank: 23, country: 'USA', type: 'field' },
  { id: 24, name: 'Jacob Bridgeman', rank: 24, country: 'USA', type: 'field' },
  { id: 25, name: 'Ryan Gerard', rank: 25, country: 'USA', type: 'field' },
  { id: 26, name: 'Harris English', rank: 26, country: 'USA', type: 'field' },
  { id: 27, name: 'Hideki Matsuyama', rank: 27, country: 'Japan', type: 'field' },
  { id: 28, name: 'J.T. Poston', rank: 28, country: 'USA', type: 'field' },
  { id: 29, name: 'Kurt Kitayama', rank: 29, country: 'USA', type: 'field' },
  { id: 30, name: 'Nicolai Højgaard', rank: 30, country: 'Denmark', type: 'field' },
  { id: 31, name: 'Patrick Cantlay', rank: 31, country: 'USA', type: 'field' },
  { id: 32, name: 'Maverick McNealy', rank: 32, country: 'USA', type: 'field' },
  { id: 33, name: 'Keegan Bradley', rank: 33, country: 'USA', type: 'field' },
  { id: 34, name: 'Min Woo Lee', rank: 34, country: 'Australia', type: 'field' },
  { id: 35, name: 'Bud Cauley', rank: 35, country: 'USA', type: 'field' },
  { id: 36, name: 'Gary Woodland', rank: 36, country: 'USA', type: 'field' },
  { id: 37, name: 'Rickie Fowler', rank: 37, country: 'USA', type: 'field' },
  { id: 38, name: 'Alex Smalley', rank: 38, country: 'USA', type: 'field' },
  { id: 39, name: 'Jake Knapp', rank: 39, country: 'USA', type: 'field' },
  { id: 40, name: 'Shane Lowry', rank: 40, country: 'Ireland', type: 'field' },
  { id: 41, name: 'Sam Stevens', rank: 41, country: 'USA', type: 'field' },
  { id: 42, name: 'Daniel Berger', rank: 42, country: 'USA', type: 'field' },
  { id: 43, name: 'Michael Kim', rank: 43, country: 'USA', type: 'field' },
  { id: 44, name: 'Jason Day', rank: 44, country: 'Australia', type: 'field' },
  { id: 45, name: 'Corey Conners', rank: 45, country: 'Canada', type: 'field' },
  { id: 46, name: 'Nico Echavarria', rank: 46, country: 'Colombia', type: 'field' },
  { id: 47, name: 'Jordan Spieth', rank: 47, country: 'USA', type: 'field' },
  { id: 48, name: 'Adam Scott', rank: 48, country: 'Australia', type: 'field' },
  { id: 49, name: 'Ryan Fox', rank: 49, country: 'New Zealand', type: 'field' },
  { id: 50, name: 'Matt McCarty', rank: 50, country: 'USA', type: 'field' },
  { id: 51, name: 'Pierceson Coody', rank: 51, country: 'USA', type: 'field' },
  { id: 52, name: 'Michael Brennan', rank: 52, country: 'USA', type: 'field' },
  { id: 53, name: 'Brian Harman', rank: 53, country: 'USA', type: 'field' },
  { id: 54, name: 'Ryo Hisatsune', rank: 54, country: 'Japan', type: 'field' },
  { id: 55, name: 'Andrew Novak', rank: 55, country: 'USA', type: 'field' },
  { id: 56, name: 'Tom Kim', rank: 56, country: 'South Korea', type: 'field' },
  { id: 57, name: 'Nick Taylor', rank: 57, country: 'Canada', type: 'field' },
  { id: 58, name: 'Keith Mitchell', rank: 58, country: 'USA', type: 'field' },
  { id: 59, name: 'Eric Cole', rank: 59, country: 'USA', type: 'field' },
  { id: 60, name: 'Matt Wallace', rank: 60, country: 'England', type: 'field' },
  { id: 61, name: 'Sami Välimäki', rank: 61, country: 'Finland', type: 'field' },
  { id: 62, name: 'Harry Hall', rank: 62, country: 'England', type: 'field' },
  { id: 63, name: 'Max Greyserman', rank: 63, country: 'USA', type: 'field' },
  { id: 64, name: 'Aldrich Potgieter', rank: 64, country: 'South Africa', type: 'field' },
  { id: 65, name: 'Thomas Detry', rank: 65, country: 'Belgium', type: 'field' },
  { id: 66, name: 'Sahith Theegala', rank: 66, country: 'USA', type: 'field' },
  { id: 67, name: 'Johnny Keefer', rank: 67, country: 'USA', type: 'field' },
  { id: 68, name: 'Sungjae Im', rank: 68, country: 'South Korea', type: 'field' },
  { id: 69, name: 'Matti Schmid', rank: 69, country: 'Germany', type: 'field' },
  { id: 70, name: 'Michael Thorbjornsen', rank: 70, country: 'USA', type: 'field' },
  { id: 71, name: 'Rasmus Højgaard', rank: 71, country: 'Denmark', type: 'field' },
  { id: 72, name: 'Patrick Rodgers', rank: 72, country: 'USA', type: 'field' },
  { id: 73, name: 'Andrew Putnam', rank: 73, country: 'USA', type: 'field' },
  { id: 74, name: 'Mac Meissner', rank: 74, country: 'USA', type: 'field' },
  { id: 75, name: 'Rico Hoey', rank: 75, country: 'Philippines', type: 'field' },
  { id: 76, name: 'Taylor Pendrith', rank: 76, country: 'Canada', type: 'field' },
  { id: 77, name: 'Max McGreevy', rank: 77, country: 'USA', type: 'field' },
  { id: 78, name: 'Stephan Jaeger', rank: 78, country: 'Germany', type: 'field' },
  { id: 79, name: 'Ricky Castillo', rank: 79, country: 'USA', type: 'field' },
  { id: 80, name: 'Christiaan Bezuidenhout', rank: 80, country: 'South Africa', type: 'field' },
  { id: 81, name: 'Denny McCarthy', rank: 81, country: 'USA', type: 'field' },
  { id: 82, name: 'Garrick Higgo', rank: 82, country: 'South Africa', type: 'field' },
  { id: 83, name: 'Blades Brown', rank: 83, country: 'USA', type: 'field' },
  { id: 84, name: 'Chris Kirk', rank: 84, country: 'USA', type: 'field' },
  { id: 85, name: 'David Lipsky', rank: 85, country: 'USA', type: 'field' },
  { id: 86, name: 'Emiliano Grillo', rank: 86, country: 'Argentina', type: 'field' },
  { id: 87, name: 'Tom Hoge', rank: 87, country: 'USA', type: 'field' },
  { id: 88, name: 'Max Homa', rank: 88, country: 'USA', type: 'field' },
  { id: 89, name: 'Tony Finau', rank: 89, country: 'USA', type: 'field' },
  { id: 90, name: 'Lucas Glover', rank: 90, country: 'USA', type: 'field' },
  { id: 91, name: 'Josele Ballester', rank: 91, country: 'Spain', type: 'field' },
  { id: 92, name: 'Jackson Suber', rank: 92, country: 'USA', type: 'field' },
  { id: 93, name: 'Mark Hubbard', rank: 93, country: 'USA', type: 'field' },
  { id: 94, name: 'Brian Campbell', rank: 94, country: 'USA', type: 'field' },
  { id: 95, name: 'William Mouw', rank: 95, country: 'USA', type: 'field' },
  { id: 96, name: 'Kevin Yu', rank: 96, country: 'Chinese Taipei', type: 'field' },
  { id: 97, name: 'Thorbjørn Olesen', rank: 97, country: 'Denmark', type: 'field' },
  { id: 98, name: 'Kevin Roy', rank: 98, country: 'USA', type: 'field' },
  { id: 99, name: 'Taylor Moore', rank: 99, country: 'USA', type: 'field' },
  { id: 100, name: 'S.H. Kim', rank: 100, country: 'South Korea', type: 'field' },
  { id: 101, name: 'Mackenzie Hughes', rank: 101, country: 'Canada', type: 'field' },
  { id: 102, name: 'Davis Thompson', rank: 102, country: 'USA', type: 'field' },
  { id: 103, name: 'Billy Horschel', rank: 103, country: 'USA', type: 'field' },
  { id: 104, name: 'Lee Hodges', rank: 104, country: 'USA', type: 'field' },
  { id: 105, name: 'Jhonattan Vegas', rank: 105, country: 'Venezuela', type: 'field' },
  { id: 106, name: 'Beau Hossler', rank: 106, country: 'USA', type: 'field' },
  { id: 107, name: 'Vince Whaley', rank: 107, country: 'USA', type: 'field' },
  { id: 108, name: 'Davis Riley', rank: 108, country: 'USA', type: 'field' },
  { id: 109, name: 'Adrien Dumont de Chassart', rank: 109, country: 'Belgium', type: 'field' },
  { id: 110, name: 'Ben Kohles', rank: 110, country: 'USA', type: 'field' },
  { id: 111, name: 'Adam Schenk', rank: 111, country: 'USA', type: 'field' },
  { id: 112, name: 'Chad Ramey', rank: 112, country: 'USA', type: 'field' },
  { id: 113, name: 'Chandler Phillips', rank: 113, country: 'USA', type: 'field' },
  { id: 114, name: 'Doug Ghim', rank: 114, country: 'USA', type: 'field' },
  { id: 115, name: 'Carson Young', rank: 115, country: 'USA', type: 'field' },
  { id: 116, name: 'Joe Highsmith', rank: 116, country: 'USA', type: 'field' },
  { id: 117, name: 'Austin Eckroat', rank: 117, country: 'USA', type: 'field' },
  { id: 118, name: 'Matt Kuchar', rank: 118, country: 'USA', type: 'field' },
  { id: 119, name: 'Erik van Rooyen', rank: 119, country: 'South Africa', type: 'field' },
  { id: 120, name: 'Byeong Hun An', rank: 120, country: 'South Korea', type: 'field' },
  { id: 121, name: 'Zac Blair', rank: 121, country: 'USA', type: 'field' },
  { id: 122, name: 'Alistair Docherty', rank: 122, country: 'USA', type: 'field' },
  { id: 123, name: 'Neal Shipley', rank: 123, country: 'USA', type: 'field' },
  { id: 124, name: 'Karl Vilips', rank: 124, country: 'Australia', type: 'field' },
  { id: 125, name: 'Séamus Power', rank: 125, country: 'Ireland', type: 'field' },

  // LIV Golfers (Major selections) - Assigned custom IDs to prevent collisions
  { id: 211, name: 'Jon Rahm', rank: 11, country: 'Spain', type: 'liv' },
  { id: 221, name: 'Tyrrell Hatton', rank: 21, country: 'England', type: 'liv' }
];

const tournamentsToSeed = [
  // 4 Majors 2027
  { id: 'masters-2027', name: 'The Masters', type: 'major', startDate: new Date('2027-04-08T08:00:00Z'), status: 'pending' },
  { id: 'pga-champ-2027', name: 'PGA Championship', type: 'major', startDate: new Date('2027-05-20T08:00:00Z'), status: 'pending' },
  { id: 'us-open-2027', name: 'U.S. Open', type: 'major', startDate: new Date('2027-06-17T08:00:00Z'), status: 'pending' },
  { id: 'open-champ-2027', name: 'The Open Championship', type: 'major', startDate: new Date('2027-07-15T08:00:00Z'), status: 'pending' },

  // 20 Regular Tournaments 2027
  { id: 'sentry-2027', name: 'The Sentry', type: 'regular', startDate: new Date('2027-01-28T08:00:00Z'), status: 'pending' },
  { id: 'farmers-2027', name: 'Farmers Insurance Open (Torrey Pines)', type: 'regular', startDate: new Date('2027-01-28T08:00:00Z'), status: 'pending' },
  { id: 'pebble-beach-2027', name: 'AT&T Pebble Beach Pro-Am', type: 'regular', startDate: new Date('2027-02-04T08:00:00Z'), status: 'pending' },
  { id: 'phoenix-open-2027', name: 'WM Phoenix Open', type: 'regular', startDate: new Date('2027-02-11T08:00:00Z'), status: 'pending' },
  { id: 'genesis-inv-2027', name: 'The Genesis Invitational', type: 'regular', startDate: new Date('2027-02-18T08:00:00Z'), status: 'pending' },
  { id: 'cadillac-2027', name: 'Cadillac Championship', type: 'regular', startDate: new Date('2027-03-04T08:00:00Z'), status: 'pending' },
  { id: 'players-2027', name: 'The Players Championship', type: 'regular', startDate: new Date('2027-03-11T08:00:00Z'), status: 'pending' },
  { id: 'palmer-inv-2027', name: 'Arnold Palmer Invitational', type: 'regular', startDate: new Date('2027-03-18T08:00:00Z'), status: 'pending' },
  { id: 'texas-open-2027', name: 'Valero Texas Open', type: 'regular', startDate: new Date('2027-04-01T08:00:00Z'), status: 'pending' },
  { id: 'rbc-heritage-2027', name: 'RBC Heritage', type: 'regular', startDate: new Date('2027-04-15T08:00:00Z'), status: 'pending' },
  { id: 'valspar-2027', name: 'Valspar Championship', type: 'regular', startDate: new Date('2027-05-06T08:00:00Z'), status: 'pending' },
  { id: 'truist-2027', name: 'Truist Championship', type: 'regular', startDate: new Date('2027-05-13T08:00:00Z'), status: 'pending' },
  { id: 'memorial-2027', name: 'Memorial Tournament', type: 'regular', startDate: new Date('2027-06-03T08:00:00Z'), status: 'pending' },
  { id: 'travelers-2027', name: 'Travelers Championship', type: 'regular', startDate: new Date('2027-06-24T08:00:00Z'), status: 'pending' },
  { id: 'john-deere-2027', name: 'John Deere Classic', type: 'regular', startDate: new Date('2027-07-01T08:00:00Z'), status: 'pending' },
  { id: 'scottish-open-2027', name: 'Genesis Scottish Open', type: 'regular', startDate: new Date('2027-07-08T08:00:00Z'), status: 'pending' },
  { id: 'rocket-classic-2027', name: 'Rocket Classic', type: 'regular', startDate: new Date('2027-07-29T08:00:00Z'), status: 'pending' },
  { id: 'st-jude-2027', name: 'FedEx St. Jude Championship', type: 'regular', startDate: new Date('2027-08-12T08:00:00Z'), status: 'pending' },
  { id: 'bmw-2027', name: 'BMW Championship', type: 'regular', startDate: new Date('2027-08-19T08:00:00Z'), status: 'pending' },
  { id: 'tour-champ-2027', name: 'Tour Championship', type: 'regular', startDate: new Date('2027-08-26T08:00:00Z'), status: 'pending' }
];

async function seed() {
  console.log('Seeding golfers...');
  for (const golfer of golfersToSeed) {
    await db.insert(schema.golfers)
      .values(golfer)
      .onConflictDoNothing({ target: schema.golfers.id });
  }
  console.log(`Successfully seeded ${golfersToSeed.length} golfers.`);

  console.log('Seeding tournaments...');
  for (const tourney of tournamentsToSeed) {
    await db.insert(schema.tournaments)
      .values(tourney)
      .onConflictDoNothing({ target: schema.tournaments.id });
  }
  console.log(`Successfully seeded ${tournamentsToSeed.length} tournaments.`);

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});

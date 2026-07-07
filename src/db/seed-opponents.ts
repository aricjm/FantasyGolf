import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from './index';
import * as schema from './schema';
import { eq } from 'drizzle-orm';

async function seedOpponents() {
  console.log('Seeding mock opponents...');
  
  // 1. Password hash for all mock opponents
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const mockOpponents = [
    {
      name: 'David Duval',
      email: 'david@example.com',
      passwordHash,
      teamName: "Duval's Driving Range",
      teamAbbr: 'DDR',
      logoUrl: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=100&auto=format&fit=crop&q=60',
      role: 'user',
    },
    {
      name: 'Brooks Koepka Fan',
      email: 'brooks@example.com',
      passwordHash,
      teamName: 'Smash GC Fans',
      teamAbbr: 'SASH',
      logoUrl: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=100&auto=format&fit=crop&q=60',
      role: 'user',
    },
    {
      name: 'Jordan Spieth Fan',
      email: 'jordan@example.com',
      passwordHash,
      teamName: 'Golden Bell CC',
      teamAbbr: 'GBCC',
      logoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&auto=format&fit=crop&q=60',
      role: 'user',
    },
    {
      name: 'Viktor Hovland Fan',
      email: 'viktor@example.com',
      passwordHash,
      teamName: 'Norway Ninjas',
      teamAbbr: 'NINJ',
      logoUrl: '/images/team_logos/bear.png',
      role: 'user',
    },
    {
      name: 'Rory McIlroy Fan',
      email: 'rory@example.com',
      passwordHash,
      teamName: 'Royal Portrush FC',
      teamAbbr: 'RPFC',
      logoUrl: '/images/team_logos/eagle.png',
      role: 'user',
    },
    {
      name: 'Scottie Scheffler Fan',
      email: 'scottie@example.com',
      passwordHash,
      teamName: 'Lone Star Links',
      teamAbbr: 'LSL',
      logoUrl: '/images/team_logos/wolf.png',
      role: 'user',
    },
    {
      name: 'Xander Schauffele Fan',
      email: 'xander@example.com',
      passwordHash,
      teamName: 'Olympic Club GC',
      teamAbbr: 'OCGC',
      logoUrl: '/images/team_logos/shark.png',
      role: 'user',
    },
    {
      name: 'Collin Morikawa Fan',
      email: 'collin@example.com',
      passwordHash,
      teamName: 'Bay Area Irons',
      teamAbbr: 'BAI',
      logoUrl: '/images/team_logos/tiger.png',
      role: 'user',
    },
  ];

  const insertedUsers: any[] = [];
  
  for (const opponent of mockOpponents) {
    // Check if user already exists
    const [existing] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, opponent.email))
      .limit(1);
      
    if (existing) {
      console.log(`User ${opponent.email} already exists.`);
      insertedUsers.push(existing);
    } else {
      const [inserted] = await db.insert(schema.users).values(opponent).returning();
      console.log(`Created user ${inserted.name} with ID ${inserted.id}`);
      insertedUsers.push(inserted);
    }
  }

  // 2. Fetch all rosters to see who is already claimed
  const allRostered = await db.select().from(schema.rosters);
  const claimedGolferIds = new Set(allRostered.map(r => r.golferId));
  
  // 3. Fetch all field golfers that can be claimed (rank 21 to 125, type 'field')
  const fieldGolfers = await db
    .select()
    .from(schema.golfers)
    .where(eq(schema.golfers.type, 'field'))
    .orderBy(schema.golfers.rank);
    
  let golferIndex = 0;
  
  // 4. Assign 6 unrostered field golfers to each mock opponent
  for (const user of insertedUsers) {
    // Check if this opponent already has a roster populated
    const userRoster = allRostered.filter(r => r.userId === user.id);
    if (userRoster.length > 0) {
      console.log(`Opponent ${user.name} already has ${userRoster.length} golfers on their roster.`);
      continue;
    }
    
    console.log(`Assigning golfers to ${user.name}...`);
    let assignedCount = 0;
    
    while (assignedCount < 6 && golferIndex < fieldGolfers.length) {
      const golfer = fieldGolfers[golferIndex];
      golferIndex++;
      
      if (!claimedGolferIds.has(golfer.id)) {
        await db.insert(schema.rosters).values({
          userId: user.id,
          golferId: golfer.id,
          acquiredVia: 'draft',
        });
        claimedGolferIds.add(golfer.id);
        assignedCount++;
        console.log(`  Assigned ${golfer.name} (#${golfer.rank})`);
      }
    }
  }
  
  console.log('Finished seeding mock opponents and rosters successfully.');
  process.exit(0);
}

seedOpponents().catch(err => {
  console.error('Error seeding opponents:', err);
  process.exit(1);
});

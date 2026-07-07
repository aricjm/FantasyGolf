import 'dotenv/config';
import { db } from './index';
import { users } from './schema';
import { eq } from 'drizzle-orm';

async function makeAdmin() {
  console.log('Making aricjm@gmail.com an admin...');

  const result = await db
    .update(users)
    .set({ role: 'admin' })
    .where(eq(users.email, 'aricjm@gmail.com'))
    .returning();

  console.log('Updated user:', result);
  process.exit(0);
}

makeAdmin().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});

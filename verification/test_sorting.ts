import { createContextInner } from '../src/server/trpc/context';
import { appRouter } from '../src/server/trpc/router/_app';

async function main() {
  const ctx = await createContextInner({ session: null });
  const caller = appRouter.createCaller(ctx);

  // Need to get a user first
  const users = await caller.user.getAll();
  if (users.length === 0) {
    console.log("No users found");
    return;
  }
  const user = users[0];

  if (user) {
    const syllabus = await caller.user.getSyllabus({ id: user.id });
    console.log("Syllabus Orders:", syllabus.map(s => s.order));
  }
}

main().catch(console.error);

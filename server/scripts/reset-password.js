// Set a new password for an existing account. Run from server/:
//   npm run reset-password -- <username or email>
// Asks for the new password in the terminal; it is never passed on the command line.

import readline from 'node:readline';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';

const identifier = process.argv[2]?.trim().toLowerCase();
if (!identifier) {
  console.error('Usage: npm run reset-password -- <username or email>');
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not set (put it in server/.env)');
  process.exit(1);
}

/** Reads a line without echoing it to the screen. */
function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => {
      if (s.includes(question)) rl.output.write(s);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15_000 });
try {
  const query = identifier.includes('@') ? { email: identifier } : { username: identifier };
  const user = await User.findOne(query);
  if (!user) {
    console.error(`No account with ${identifier.includes('@') ? 'email' : 'username'} "${identifier}"`);
    process.exitCode = 1;
  } else {
    const password = await askHidden(`New password for ${user.username} (${user.email}): `);
    const confirm = await askHidden('Type it again: ');
    if (password !== confirm) {
      console.error('Passwords don’t match. Nothing changed.');
      process.exitCode = 1;
    } else if (password.length < 8 || password.length > 128) {
      console.error('Password needs 8–128 characters. Nothing changed.');
      process.exitCode = 1;
    } else {
      user.passwordHash = await bcrypt.hash(password, 12);
      await user.save();
      console.log(`Password updated for ${user.username}. Log in with "${user.username}" or "${user.email}".`);
    }
  }
} finally {
  await mongoose.disconnect();
}

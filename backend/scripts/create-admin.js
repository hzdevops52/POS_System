import 'dotenv/config';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../src/models/user.model.js';

async function askHidden(question) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    throw new Error('Hidden password input requires an interactive terminal.');
  }

  return new Promise((resolve, reject) => {
    let answer = '';
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();

    const cleanup = () => {
      stdin.removeListener('data', onData);
      stdin.setRawMode(false);
      stdout.write('\n');
    };

    const onData = chunk => {
      for (const char of chunk.toString()) {
        if (char === '\u0003') {
          cleanup();
          reject(new Error('Setup cancelled.'));
          return;
        }

        if (char === '\r' || char === '\n') {
          cleanup();
          resolve(answer);
          return;
        }

        if (char === '\u007f' || char === '\b') {
          answer = answer.slice(0, -1);
        } else if (char >= ' ' && answer.length < 200) {
          answer += char;
        }
      }
    };

    stdin.on('data', onData);
  });
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing from backend/.env.');
  }

  const rl = readline.createInterface({ input: stdin, output: stdout });
  let name;
  let email;

  try {
    name = (await rl.question('Administrator name: ')).trim();
    email = (await rl.question('Administrator email: ')).trim().toLowerCase();
  } finally {
    rl.close();
  }

  const password = await askHidden('Administrator password (input hidden): ');
  const confirmation = await askHidden('Confirm password (input hidden): ');

  if (name.length < 2 || name.length > 100) {
    throw new Error('Name must contain 2–100 characters.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Enter a valid email address.');
  }

  if (password.length < 12 || password.length > 200) {
    throw new Error('Password must contain 12–200 characters.');
  }

  if (password !== confirmation) {
    throw new Error('Passwords do not match.');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  try {
    if (await User.exists({ role: 'admin' })) {
      throw new Error('An administrator already exists. Bootstrap refused.');
    }

    await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'admin',
      status: 'active'
    });

    console.log(`Administrator created for ${email}.`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(error => {
  console.error(`Admin setup failed: ${error.message}`);
  process.exitCode = 1;
});

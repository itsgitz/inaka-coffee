import { pbkdf2Sync, randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
import path from "node:path";
import { password as passwordPrompt } from "@inquirer/prompts";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 100_000;
const VERSION = Buffer.from([0x00, 0x01]);
const HEADER_LENGTH = 2 + SALT_LENGTH + IV_LENGTH + TAG_LENGTH; // 46 bytes

const PROJECT_ROOT = path.resolve(
  new URL(".", import.meta.url).pathname,
  "..",
);

function printUsage(): void {
  console.log(`
Usage: bun run scripts/env-encoder.ts <encode|decode> [options]

Commands:
  encode    Encrypt a .env file to .env.enc
  decode    Decrypt a .env.enc file back to .env

Options:
  --app <name>       App directory under apps/ (required)
  --variant <name>   Env file name (default: .env)
  --help             Show this help message

Password is prompted interactively, or set ENV_ENCODER_PASSWORD env var.

Examples:
  bun run scripts/env-encoder.ts encode --app landing
  bun run scripts/env-encoder.ts decode --app cms --variant .env.staging
  ENV_ENCODER_PASSWORD=secret bun run env:encode -- --app landing
`);
}

interface ParsedArgs {
  command: "encode" | "decode";
  app: string;
  variant: string;
}

function parseArgs(argv: string[]): ParsedArgs | null {
  if (argv.length === 0 || argv.includes("--help")) {
    printUsage();
    return null;
  }

  const command = argv[0];
  if (command !== "encode" && command !== "decode") {
    console.error(`Error: Unknown command "${command}". Use "encode" or "decode".`);
    printUsage();
    return null;
  }

  const flags = argv.slice(1);
  const flagMap = new Map<string, string>();

  for (let i = 0; i < flags.length; i += 2) {
    const key = flags[i];
    const value = flags[i + 1];
    if (!key?.startsWith("--") || value === undefined) {
      console.error(`Error: Invalid argument "${key}".`);
      printUsage();
      return null;
    }
    flagMap.set(key.slice(2), value);
  }

  const app = flagMap.get("app");
  if (!app) {
    console.error("Error: --app is required.");
    printUsage();
    return null;
  }

  const variant = flagMap.get("variant") ?? ".env";

  return { command, app, variant };
}

async function getPassword(command: "encode" | "decode"): Promise<string> {
  const envPassword = process.env.ENV_ENCODER_PASSWORD;
  if (envPassword) {
    return envPassword;
  }

  const password = await passwordPrompt({
    message: "Enter encryption password:",
    mask: "*",
  });

  if (command === "encode") {
    const confirm = await passwordPrompt({
      message: "Confirm password:",
      mask: "*",
    });

    if (password !== confirm) {
      throw new Error("Passwords do not match.");
    }
  }

  return password;
}

function deriveKey(password: string, salt: Buffer): Buffer {
  return pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, "sha256");
}

async function encrypt(inputPath: string, outputPath: string, password: string): Promise<void> {
  const file = Bun.file(inputPath);
  if (!(await file.exists())) {
    throw new Error(`File not found: ${inputPath}`);
  }

  const plaintext = Buffer.from(await file.arrayBuffer());

  // Check if file appears to already be encrypted
  if (plaintext.length >= 2 && plaintext[0] === 0x00 && plaintext[1] === 0x01) {
    console.warn(`Warning: ${inputPath} appears to already be encrypted. Proceeding anyway.`);
  }

  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = deriveKey(password, salt);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const binary = Buffer.concat([VERSION, salt, iv, authTag, encrypted]);
  await Bun.write(outputPath, binary.toString("base64"));

  console.log(`Encrypted: ${inputPath} -> ${outputPath}`);
}

async function decrypt(inputPath: string, outputPath: string, password: string): Promise<void> {
  const file = Bun.file(inputPath);
  if (!(await file.exists())) {
    throw new Error(`Encrypted file not found: ${inputPath}`);
  }

  const data = Buffer.from(await file.text(), "base64");

  if (data.length < HEADER_LENGTH) {
    throw new Error("Invalid encrypted file: too small.");
  }

  const version = data.subarray(0, 2);
  if (version[0] !== 0x00 || version[1] !== 0x01) {
    throw new Error(`Unsupported file format version: ${version[0]}.${version[1]}`);
  }

  const salt = data.subarray(2, 2 + SALT_LENGTH);
  const iv = data.subarray(2 + SALT_LENGTH, 2 + SALT_LENGTH + IV_LENGTH);
  const authTag = data.subarray(2 + SALT_LENGTH + IV_LENGTH, HEADER_LENGTH);
  const ciphertext = data.subarray(HEADER_LENGTH);

  const key = deriveKey(password, salt);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    if (await Bun.file(outputPath).exists()) {
      console.warn(`Warning: Overwriting existing file: ${outputPath}`);
    }

    await Bun.write(outputPath, decrypted);
    console.log(`Decrypted: ${inputPath} -> ${outputPath}`);
  } catch {
    throw new Error("Wrong password or corrupted file.");
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (!args) {
    process.exit(1);
  }

  const envPath = path.join(PROJECT_ROOT, "apps", args.app, args.variant);
  const encPath = `${envPath}.enc`;
  const password = await getPassword(args.command);

  if (args.command === "encode") {
    await encrypt(envPath, encPath, password);
  } else {
    await decrypt(encPath, envPath, password);
  }
}

main().catch((err: Error) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});

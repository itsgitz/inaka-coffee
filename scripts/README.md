# Scripts

## env-encoder.ts

Encrypts and decrypts `.env` files using **AES-256-GCM** with PBKDF2 key derivation. Encrypted files can be safely committed to git and stored as GitHub Actions Secrets.

### Usage

```bash
# Encrypt
bun run scripts/env-encoder.ts encode --app <app> [--variant <file>]

# Decrypt
bun run scripts/env-encoder.ts decode --app <app> [--variant <file>]

# Shorthand via package.json
bun run env:encode -- --app <app> [--variant <file>]
bun run env:decode -- --app <app> [--variant <file>]
```

**Arguments:**

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `--app` | yes | — | App directory under `apps/` (e.g. `landing`, `cms`) |
| `--variant` | no | `.env` | Env file name (e.g. `.env.staging`, `.env.production`) |

**Password input:** prompted interactively with masked input. Set `ENV_ENCODER_PASSWORD` env var to skip the prompt (for CI/CD).

On `encode`, the password must be confirmed. On `decode`, it is entered once.

### Examples

```bash
# Encrypt landing app's .env → .env.enc
bun run env:encode -- --app landing

# Encrypt a specific variant
bun run env:encode -- --app cms --variant .env.staging

# Decrypt (restores .env from .env.enc)
bun run env:decode -- --app landing

# Non-interactive (CI/CD)
ENV_ENCODER_PASSWORD="$SECRET" bun run env:decode -- --app landing
ENV_ENCODER_PASSWORD="$SECRET" bun run env:decode -- --app cms
```

### Output

The encrypted file is written alongside the source with a `.enc` suffix:

| Source | Encrypted output |
|--------|-----------------|
| `apps/landing/.env` | `apps/landing/.env.enc` |
| `apps/cms/.env` | `apps/cms/.env.enc` |
| `apps/cms/.env.staging` | `apps/cms/.env.staging.enc` |

`.env.enc` files are **not** ignored by `.gitignore` and can be committed to the repository.

### GitHub Actions Secrets workflow

1. Encrypt your `.env` files locally and commit the `.enc` files:
   ```bash
   bun run env:encode -- --app landing
   bun run env:encode -- --app cms
   git add apps/landing/.env.enc apps/cms/.env.enc
   git commit -m "chore: add encrypted env files"
   ```

2. Store the encryption password in GitHub Actions Secrets:
   - Go to **Settings → Secrets and variables → Actions**
   - Add secret: `ENV_ENCODER_PASSWORD` = your encryption password

3. In your workflow, decode before build/deploy:
   ```yaml
   - name: Decode env files
     env:
       ENV_ENCODER_PASSWORD: ${{ secrets.ENV_ENCODER_PASSWORD }}
     run: |
       ENV_ENCODER_PASSWORD="$ENV_ENCODER_PASSWORD" bun run env:decode -- --app landing
       ENV_ENCODER_PASSWORD="$ENV_ENCODER_PASSWORD" bun run env:decode -- --app cms
   ```

### Encryption details

- **Algorithm:** AES-256-GCM (authenticated encryption)
- **Key derivation:** PBKDF2, 100,000 iterations, SHA-256
- **Encrypted file format:** base64-encoded text containing `[version 2B][salt 16B][iv 12B][authTag 16B][ciphertext]`
- Output is plain text — safe to copy into GitHub Actions Secrets or any text field
- Each encryption uses a random salt and IV — the same password produces different ciphertext every time
- Wrong password or tampered file is detected via GCM authentication tag

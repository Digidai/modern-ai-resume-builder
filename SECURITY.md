# Security Policy

## Supported Versions

We support the latest commit on the default branch. If you are using an older
build, please upgrade before reporting issues.

## Reporting a Vulnerability

Please report security issues via GitHub Security Advisories. If you are unable
to use Security Advisories, open a GitHub issue with minimal details and we will
follow up.

We aim to acknowledge reports within 7 days.

## Sensitive Data

Do not post API keys, personal data, or private resume content in public issues.

## AI Key Handling

- Never expose service keys in client-side `VITE_*` variables.
- For Cloudflare deployments, store `GEMINI_API_KEY` as a Worker secret (`wrangler secret put GEMINI_API_KEY`).
- Use a dedicated session signing secret for AI tokens (`wrangler secret put GEMINI_SIGNING_SECRET`).
- Keep `RATE_LIMITER` Durable Object binding enabled in `wrangler.jsonc` for cross-instance AI throttling.
- AI session requests require a Worker-issued client attestation token (`x-ai-client-token`) and signed cookies.
- AI proxy requests require both `x-ai-session-token` and a unique `x-ai-request-id` to reduce replay risk.
- Keep browser CSP/security headers enabled at the Worker layer to reduce script injection risk.

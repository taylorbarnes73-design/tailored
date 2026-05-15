# Tailored by Taylor

Tailored by Taylor is a Vite + React frontend served by a Node/Express app.

## Local development

```bash
corepack pnpm install
corepack pnpm dev
```

## Production build

```bash
corepack pnpm build
corepack pnpm start
```

## Deployment

GitHub Actions is configured to deploy the app to AWS Lightsail using a container workflow.

See `docs/aws-lightsail-godaddy.md` for the AWS and GoDaddy setup steps.

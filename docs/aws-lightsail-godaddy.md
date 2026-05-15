# AWS + GoDaddy setup

This app is a Vite frontend plus a Node/Express server, so it needs container hosting instead of static-site hosting.

## 1. Put the real app under Git

Right now, the deployable app is in this folder:

`/Users/taylorbarnes/Downloads/tailored-by-taylor`

But the only existing `.git` directory is nested here:

`/Users/taylorbarnes/Downloads/tailored-by-taylor/tailored`

Before GitHub Actions can deploy the app, make sure the top-level app folder is the repository root.

## 2. Create a GitHub OIDC deploy role in AWS

Create an IAM role that trusts GitHub Actions through OIDC and grants access to:

- `lightsail:GetContainerServices`
- `lightsail:CreateContainerService`
- `lightsail:PushContainerImage`
- `lightsail:CreateContainerServiceDeployment`

Attach it to your repo through the GitHub variable `AWS_ROLE_ARN`.

## 3. Add GitHub repository variables

Add these repository variables:

- `AWS_REGION`
- `AWS_ROLE_ARN`
- `LIGHTSAIL_SERVICE_NAME`
- `LIGHTSAIL_POWER`
- `LIGHTSAIL_SCALE`
- `VITE_APP_ID`
- `VITE_OAUTH_PORTAL_URL`
- `VITE_FRONTEND_FORGE_API_URL`
- `VITE_ANALYTICS_ENDPOINT`
- `VITE_ANALYTICS_WEBSITE_ID`

## 4. Add GitHub repository secrets

Add these repository secrets:

- `DATABASE_URL`
- `JWT_SECRET`
- `OAUTH_SERVER_URL`
- `OWNER_OPEN_ID`
- `BUILT_IN_FORGE_API_URL`
- `BUILT_IN_FORGE_API_KEY`
- `VITE_FRONTEND_FORGE_API_KEY`

## 5. First deploy

Push to `main` or manually run the `Deploy to AWS Lightsail` workflow.

The workflow will:

- create the Lightsail container service if it does not already exist
- build the Docker image
- push it to Lightsail
- create a new deployment

## 6. Connect your domain

As of May 14, 2026, AWS App Runner is no longer open to new customers, so this setup uses Lightsail instead.

In Lightsail:

1. Open your container service.
2. Go to `Custom domains`.
3. Create or attach the certificate for your domain.
4. Copy the validation CNAME records.

In GoDaddy:

1. Add the validation CNAME records exactly as Lightsail shows them.
2. Wait until the certificate status becomes `Valid`.

After that, choose one of these DNS paths:

### Option A: Keep GoDaddy DNS

- Point `www` to the Lightsail target with the CNAME assignment shown in Lightsail.
- Forward the root domain to `https://www.yourdomain.com` with a `301`.

This is the simplest option when you want to keep the domain registered and managed in GoDaddy.

### Option B: Move DNS to AWS

- Keep the domain registered at GoDaddy.
- Change the domain nameservers to use AWS DNS instead.
- Then manage the apex domain and `www` directly from AWS.

This is the cleaner long-term option if you want the root domain handled natively inside AWS.

## 7. Verify after DNS

Check:

- `https://<lightsail-default-domain>`
- `https://www.yourdomain.com`
- the root domain redirect
- login flow
- any map or analytics integrations that depend on `VITE_*` values

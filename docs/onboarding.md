# Onboarding Guide

This guide walks a new developer from a fresh clone to a working local setup for Vendor Tracker.

## Prerequisites

- Node.js 20 or newer
- npm
- AWS CLI configured with credentials that can deploy CDK stacks
- AWS CDK CLI available through `npx cdk` or a global install

Check your local tools:

```bash
node --version
npm --version
aws sts get-caller-identity
npx cdk --version
```

## Repository Layout

- `backend/`: CDK app, Lambda handlers, and backend tests
- `frontend/`: Next.js app, Amplify configuration, and vendor UI
- `docs/`: architecture and onboarding documentation

## First-Time Setup

Install dependencies in both apps:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Frontend Environment Variables

The frontend expects a local `frontend/.env.local` file. Start from the example file:

```bash
cd frontend
cp .env.example .env.local
```

Set these values in `frontend/.env.local`:

- `NEXT_PUBLIC_API_URL`: the deployed API Gateway base URL
- `NEXT_PUBLIC_USER_POOL_ID`: the Cognito user pool ID
- `NEXT_PUBLIC_USER_POOL_CLIENT_ID`: the Cognito app client ID

These values should come from your deployed backend stack outputs after `cdk deploy`.

## Backend Workflow

The backend is defined with AWS CDK in TypeScript. From the `backend/` directory, the main commands are:

```bash
npm run build
npm run test
npx cdk synth
npx cdk deploy
```

Recommended flow:

1. Run `npm run test` to validate Lambda and stack behavior first.
2. Run `npm run build` to compile the TypeScript backend.
3. Run `npx cdk synth` to confirm the CloudFormation template is generated correctly.
4. Run `npx cdk deploy` to create or update AWS resources and capture the stack outputs.

If this is the first CDK deployment in the target AWS account and region, you may also need to bootstrap the environment:

```bash
npx cdk bootstrap
```

## Frontend Workflow

From the `frontend/` directory:

```bash
npm run dev
npm run build
npm run lint
```

Recommended flow:

1. Make sure `frontend/.env.local` is populated with deployed values.
2. Run `npm run dev` for local development.
3. Run `npm run lint` before committing frontend changes.
4. Run `npm run build` to generate the static export in `frontend/out` and verify the production build still succeeds.
5. If you want those frontend changes live in AWS, run `npx cdk deploy` from `backend/` after the frontend build so CDK can upload the new `frontend/out` files to S3 and invalidate CloudFront.

## Typical Development Loop

1. Pull the latest changes and install dependencies if package files changed.
2. Make backend changes in `backend/` and run `npm run test` plus `npm run build`.
3. If infrastructure changed, run `npx cdk synth` and deploy when needed.
4. Update `frontend/.env.local` if stack outputs changed.
5. Make frontend changes in `frontend/` and run `npm run lint` plus `npm run build`.
6. Run `npx cdk deploy` from `backend/` when you want to publish new frontend build files or backend infrastructure changes to AWS.

## Notes

- The checked-in `.env.example` file is safe to share and documents required frontend values.
- Real environment values should stay in untracked local files such as `frontend/.env.local`.
- The backend Lambda environment variable `VENDOR_TABLE_NAME` is set by CDK during deployment rather than by a local `.env` file.
- `npx cdk synth` generates the CloudFormation template locally so you can inspect what CDK is going to deploy before making AWS changes.
- Frontend production deploys depend on the generated `frontend/out` directory because the CDK stack uploads that folder to S3 with `BucketDeployment`.

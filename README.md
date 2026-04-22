# Vendor Tracker

Vendor Tracker is a small full-stack application for managing vendor records. It uses a Next.js frontend with Cognito-backed authentication and an AWS serverless backend defined with CDK.

## Architecture

| Layer | Service | What it does |
| --- | --- | --- |
| Frontend | Next.js + CloudFront | React UI served globally over HTTPS |
| Auth | Amazon Cognito + Amplify | User sign-up, login, and JWT token management |
| API | API Gateway | Routes HTTP requests and validates auth tokens |
| Logic | AWS Lambda | Creates, reads, and deletes vendors on demand |
| Database | DynamoDB | Stores vendor records with no idle cost |
| Storage | S3 | Holds the built frontend files |
| Infrastructure | AWS CDK | Defines and deploys the cloud resources as code |

See [docs/architecture.md](docs/architecture.md) for the architecture diagram.

## Project Structure

```text
vendor-tracker/
  backend/   AWS CDK app, Lambda handlers, tests, and infrastructure code
  frontend/  Next.js app, Amplify setup, vendor UI, and API client
```

## Backend

The backend CDK stack creates:

- A DynamoDB table keyed by `vendorId`
- Three Lambda functions for creating, listing, and deleting vendors
- An API Gateway REST API protected by a Cognito authorizer
- A Cognito user pool and app client
- An S3 bucket and CloudFront distribution for the static frontend build
- CDK outputs for the API endpoint, Cognito IDs, and CloudFront URL

Useful commands:

```bash
cd backend
npm run build
npm run test
npx cdk synth
npx cdk deploy
```

## Frontend

The frontend is a Next.js app that uses Amplify Auth and calls the protected API with the signed-in user's JWT.

Required local environment variables:

```bash
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_USER_POOL_ID=
NEXT_PUBLIC_USER_POOL_CLIENT_ID=
```

Useful commands:

```bash
cd frontend
npm run dev
npm run build
npm run lint
```

## Git Hygiene

The root `.gitignore` is the single ignore file for the repository. It excludes dependency folders, local environment files, Next.js build output, CDK output, logs, and generated backend TypeScript artifacts.

## Improvement Opportunities

- Document the "why" behind the stack choices. Add an architecture decision record or short design notes explaining why this project uses Next.js, Cognito, API Gateway, Lambda, DynamoDB, S3, CloudFront, and CDK instead of alternatives.
- Add code standards for new developers. Cover TypeScript conventions, file organization, Lambda handler patterns, API response shapes, error handling, testing expectations, naming conventions, and when comments are useful.
- Create an onboarding guide. Include local setup from a fresh clone, required AWS/Node tooling, environment variables, how to run the frontend and backend checks, and the expected development workflow.
- Tighten production security settings. Restrict API CORS origins, review Cognito sign-up behavior, revisit destructive DynamoDB/S3 removal policies, and replace broad development defaults before production use.
- Improve API validation. Validate request bodies before writing to DynamoDB and return consistent `400` responses for invalid input.
- Add broader test coverage. Include failure-path Lambda tests, CDK assertions for IAM least privilege, and frontend tests for authentication and vendor flows.
- Add deployment documentation. Describe how to build the frontend, deploy the CDK stack, capture stack outputs, and configure frontend environment values.
- Add portfolio presentation assets. Include screenshots, an architecture diagram, and a short case-study section that explains the problem, solution, tradeoffs, and what was learned.
- Add CI checks. Run backend tests, frontend linting, and TypeScript checks automatically on pull requests before merging.
- Add environment examples. Keep real `.env` files private, but maintain `.env.example` files so new developers can see required configuration without exposing deployed values.
- Add observability notes. Document the CloudWatch logs to check for each Lambda and the operational signals that matter when debugging API failures.
- Polish the frontend experience. Improve loading, empty, validation, and error states so the app feels complete during a portfolio demo.

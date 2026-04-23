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

## Technology Stack

| Technology | Role | Why it was chosen | Alternatives considered | Why they were not a good fit here |
| --- | --- | --- | --- | --- |
| Next.js | Frontend framework | Gives the project a familiar React-based app structure, fast local development, and a straightforward path to a static deployment for a portfolio-scale CRUD app. | Vite + React, plain React SPA | Those would also work, but Next.js provides a cleaner opinionated structure and easier deployment conventions without adding much complexity at this project size. |
| Amazon Cognito | Authentication | Offloads sign-up, sign-in, and token management to a managed AWS service so the app does not need a custom auth system. | Auth0, custom JWT auth service | Auth0 would add another vendor outside the AWS stack, and a custom auth service would create more security and maintenance work than this project needs. |
| AWS Amplify Auth | Frontend auth integration | Simplifies connecting the Next.js frontend to Cognito and handling authenticated sessions in the browser. | Direct Cognito SDK usage, custom auth wrapper | Those approaches give more control, but they require more setup and more auth plumbing for a project where the main goal is demonstrating the end-to-end product flow. |
| API Gateway | HTTP API layer | Provides a clean public entry point for the backend, integrates well with Cognito authorizers, and keeps request routing separate from Lambda logic. | Application Load Balancer, direct Lambda URLs | Those options can work, but API Gateway is a more natural fit for a small authenticated REST API and needs less custom wiring around authorization and routing. |
| AWS Lambda | Backend compute | Fits the small set of vendor CRUD operations well and avoids running an always-on server for low or unpredictable traffic. | ECS/Fargate, EC2, long-running Express server | Those approaches are better when the app needs persistent servers or more operational control, which would add unnecessary cost and infrastructure overhead here. |
| DynamoDB | Data store | Works well for simple vendor records keyed by `vendorId`, stays operationally light, and avoids relational database overhead for this use case. | PostgreSQL, MySQL, Aurora Serverless | A relational database would be reasonable for more complex querying and relationships, but this project only needs simple record storage and benefits more from DynamoDB's low-ops model. |
| Amazon S3 | Static asset hosting | Stores the built frontend cheaply and reliably as static files. | Vercel, Netlify, EC2-hosted frontend | Vercel and Netlify are strong frontend platforms, but S3 keeps hosting inside the same AWS footprint and better matches the goal of showing an AWS-native deployment. |
| Amazon CloudFront | Content delivery | Puts HTTPS and global caching in front of the frontend so the deployed app is fast and production-shaped. | Direct S3 website hosting, third-party CDN | Direct S3 hosting is simpler but weaker for HTTPS and caching, and a third-party CDN would add another service without a strong benefit for this setup. |
| AWS CDK | Infrastructure as code | Keeps infrastructure versioned in TypeScript, makes the stack reproducible, and lets application and infrastructure changes evolve together in one repo. | Terraform, raw CloudFormation, manual console setup | Terraform is a valid alternative, but CDK fits better when the team is already using TypeScript; raw CloudFormation and manual setup would slow iteration and make the project harder to maintain. |

This stack was chosen to keep the project focused on product behavior instead of server management. It demonstrates a practical AWS serverless architecture, covers authentication end to end, and keeps the deployment model small enough for a personal project while still reflecting real cloud patterns.

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

- [x] ~~Document the "why" behind the stack choices. Add an architecture decision record or short design notes explaining why this project uses Next.js, Cognito, API Gateway, Lambda, DynamoDB, S3, CloudFront, and CDK instead of alternatives.~~
- [ ] Add code standards for new developers. Cover TypeScript conventions, file organization, Lambda handler patterns, API response shapes, error handling, testing expectations, naming conventions, and when comments are useful.
- [ ] Create an onboarding guide. Include local setup from a fresh clone, required AWS/Node tooling, environment variables, how to run the frontend and backend checks, and the expected development workflow.
- [ ] Tighten production security settings. Restrict API CORS origins, review Cognito sign-up behavior, revisit destructive DynamoDB/S3 removal policies, and replace broad development defaults before production use.
- [ ] Improve API validation. Validate request bodies before writing to DynamoDB and return consistent `400` responses for invalid input.
- [ ] Add broader test coverage. Include failure-path Lambda tests, CDK assertions for IAM least privilege, and frontend tests for authentication and vendor flows.
- [ ] Add deployment documentation. Describe how to build the frontend, deploy the CDK stack, capture stack outputs, and configure frontend environment values.
- [ ] Add portfolio presentation assets. Include screenshots, an architecture diagram, and a short case-study section that explains the problem, solution, tradeoffs, and what was learned.
- [ ] Add CI checks. Run backend tests, frontend linting, and TypeScript checks automatically on pull requests before merging.
- [ ] Add environment examples. Keep real `.env` files private, but maintain `.env.example` files so new developers can see required configuration without exposing deployed values.
- [ ] Add observability notes. Document the CloudWatch logs to check for each Lambda and the operational signals that matter when debugging API failures.
- [ ] Polish the frontend experience. Improve loading, empty, validation, and error states so the app feels complete during a portfolio demo.

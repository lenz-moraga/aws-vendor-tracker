# Architecture Diagram

This diagram shows the main runtime flow for Vendor Tracker and the infrastructure layer that provisions it.

```mermaid
flowchart LR
  user["User Browser"]
  app["Next.js Frontend"]
  cloudfront["CloudFront"]
  s3["S3 Static Site Bucket"]
  cognito["Amazon Cognito User Pool"]
  api["API Gateway /vendors"]
  create["Lambda: createVendor"]
  list["Lambda: getVendors"]
  remove["Lambda: deleteVendor"]
  table["DynamoDB VendorTable"]
  cdk["AWS CDK / CloudFormation"]

  user -->|"Open app"| cloudfront
  cloudfront -->|"Serve static files"| s3
  s3 --> app

  app -->|"Sign in / sign up"| cognito
  cognito -->|"JWT token"| app

  app -->|"HTTPS + Authorization Bearer token"| api
  api -->|"Cognito authorizer validates token"| cognito

  api -->|"POST /vendors"| create
  api -->|"GET /vendors"| list
  api -->|"DELETE /vendors"| remove

  create -->|"PutItem"| table
  list -->|"Scan"| table
  remove -->|"DeleteItem"| table

  cdk -.->|"Provisions"| cognito
  cdk -.->|"Provisions"| api
  cdk -.->|"Provisions"| create
  cdk -.->|"Provisions"| list
  cdk -.->|"Provisions"| remove
  cdk -.->|"Provisions"| table
  cdk -.->|"Provisions"| s3
  cdk -.->|"Provisions"| cloudfront
```

## Notes

- CloudFront serves the static frontend files from S3 over HTTPS.
- Cognito handles user sign-up, sign-in, and token issuance.
- API Gateway protects the `/vendors` routes with a Cognito authorizer.
- Lambda functions contain the application logic for creating, reading, and deleting vendors.
- DynamoDB stores vendor records keyed by `vendorId`.
- CDK defines the infrastructure and deploys it through CloudFormation.

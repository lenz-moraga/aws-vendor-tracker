import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as cognito from "aws-cdk-lib/aws-cognito";

import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. DynamoDB Table
    const vendorTable = new dynamodb.Table(this, "VendorTable", {
      partitionKey: {
        // Tells DynamoDB that "vendorId" attribute is the unique identifier for each item in the table.
        name: "vendorId",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // means you only pay for the read/write operations you perform on the table, rather than provisioning a fixed capacity.
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development purposes, set to DESTROY. Change to RETAIN for production.
    });

    // 2. Lambda Functions
    const lambdaEnv = {
      VENDOR_TABLE_NAME: vendorTable.tableName, // Passes the DynamoDB table name to the Lambda functions via environment variables. This allows the Lambdas to know which table to interact with without hardcoding the name.
    };

    const createVendorLambda = new NodejsFunction(this, "CreateVendorLambda", {
      entry: "lambda/createVendor.ts",
      handler: "handler",
      environment: lambdaEnv,
    });
    const getVendorsLambda = new NodejsFunction(this, "GetVendorsLambda", {
      entry: "lambda/getVendors.ts",
      handler: "handler",
      environment: lambdaEnv,
    });
    const deleteVendorLambda = new NodejsFunction(this, "DeleteVendorLambda", {
      entry: "lambda/deleteVendor.ts",
      handler: "handler",
      environment: lambdaEnv,
    });
    // NodejsFunction is a special CDK construct that automatically bundles your Lambda code and all its dependencies into a single file using esbuild before uploading it to AWS. This is why we installed esbuild. It simplifies the deployment process and ensures that all necessary code is included in the Lambda package without you having to manually manage dependencies or bundling. 
    
    // The entry property specifies the path to your Lambda function's source code, and the handler property specifies the exported function that AWS Lambda should invoke when the function is executed. The environment property allows you to pass environment variables to the Lambda function.

    // Always use NodejsFunction instead of the basic lambda.Function construct. The basic version requires you to manually manage bundling, which causes "Module not found" errors at runtime

    // 3. Permissions
    vendorTable.grantReadWriteData(createVendorLambda);
    vendorTable.grantReadData(getVendorsLambda);
    vendorTable.grantReadWriteData(deleteVendorLambda);

    // In AWS, no resource can communicate with any other resource by default. A Lambda function has no access to DynamoDB, S3, or anything else unless you explicitly grant it.

    // This is called the Least Privilege principle: each piece of your system gets exactly the permissions it needs, and nothing more. grantReadWriteData lets a Lambda write and delete items. grantReadData lets a Lambda read items. Using separate grants for each function means the getVendors Lambda can never accidentally delete data.

    // 4. Cognito User Pool
    const userPool = new cognito.UserPool(this, "VendorUserPool", {
      selfSignUpEnabled: true, // allows users to sign up themselves. In a production app, you might want to disable this and create users manually or through an admin interface for better control.
      signInAliases: {
        email: true, // allows users to sign in using their email address. This is a common and user-friendly option.
      },
      autoVerify: {
        email: true, // automatically verifies users' email addresses when they sign up. This helps ensure that the email provided is valid and belongs to the user.
      },
      userVerification: { emailStyle: cognito.VerificationEmailStyle.CODE }, // sends a verification code to the user's email for account verification. This is a standard and secure method for verifying user accounts.
    });

    userPool.addDomain("VendorUserPoolDomain", {
      cognitoDomain: {
        domainPrefix: `vendor-tracker-${this.account}`, // sets up a unique domain for the Cognito Hosted UI, which is used for user authentication. The domain prefix must be globally unique across all Cognito user pools, so we append the AWS account ID to ensure uniqueness. In a production app, you would want to use a custom domain that matches your frontend domain for a more seamless user experience.
      },
    });

    const userPoolClient = userPool.addClient("VendorAppClient"); // creates an app client for the user pool, which is used by the frontend to interact with Cognito for authentication. The app client allows the frontend to sign up, sign in, and manage users in the Cognito user pool.

    // 5. API Gateway + Authorizer
    const api = new apigateway.RestApi(this, "VendorApi", {
      restApiName: "Vendor Service",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS, // allows requests from any origin. In a production app, you would want to restrict this to your frontend domain for security reasons.
        allowMethods: apigateway.Cors.ALL_METHODS, // allows all HTTP methods (GET, POST, DELETE, etc.) for CORS preflight requests. You can specify only the methods you need for better security.
        allowHeaders: ["Content-Type", "Authorization"], // specifies which headers are allowed in CORS requests. This is important for allowing the frontend to send JSON data and authentication tokens.
      },
    });

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      "VendorAuthorizer",
      {
        cognitoUserPools: [userPool],
      },
    ); // creates a new API Gateway authorizer that uses the Cognito user pool for authentication. This means that any API endpoint protected by this authorizer will require a valid JWT token from the Cognito user pool to access.

    const authOptions = {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    }; // defines the authorization options for API Gateway methods. This tells API Gateway to use the Cognito authorizer we just created for any methods that use these options.

    const vendors = api.root.addResource("vendors"); // creates a new resource at the path /vendors
    vendors.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createVendorLambda),
      authOptions,
    ); // integrates the createVendor Lambda with the POST method on the /vendors resource. This means that when a POST request is made to /vendors, the createVendor Lambda will be invoked.
    vendors.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getVendorsLambda),
      authOptions,
    );
    vendors.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(deleteVendorLambda),
      authOptions,
    );

    // 6. S3 Bucket (Frontend Files)
    const siteBucket = new s3.Bucket(this, "VendorSiteBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // blocks all public access to the bucket for security. The frontend will be served through CloudFront, which will handle access to the files.
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development purposes, set to DESTROY. Change to RETAIN for production.
      autoDeleteObjects: true, // Automatically deletes all objects in the bucket when the bucket itself is deleted. This is useful for development to avoid leaving behind orphaned files, but be cautious with this setting in production.
    });

    // 7. CloudFront Distribution (HTTPS + CDN)
    const distribution = new cloudfront.Distribution(this, "SiteDistribution", {
      defaultBehavior: {
        origin: new origins.S3Origin(siteBucket), // sets the S3 bucket as the origin for the CloudFront distribution. This means that CloudFront will serve the files stored in the S3 bucket.
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS, // ensures that all requests to the frontend are served over HTTPS for security.
      },
      defaultRootObject: "index.html", // specifies that index.html should be served when a user accesses the root URL of the distribution. This is important for single-page applications like our frontend.
      errorResponses: [
        {
          // Redirects all 404 errors to index.html, which allows the frontend routing to handle the request. This is necessary for client-side routing in a single-page application, where the frontend needs to handle different paths without the server returning a 404 error.
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
      ],
    });

    // 8. Deploy Frontend Files to S3
    new s3deploy.BucketDeployment(this, "DeployWebsite", {
      sources: [s3deploy.Source.asset("../frontend/out")], // specifies the local directory containing the frontend build files. Adjust the path as needed based on your project structure.
      destinationBucket: siteBucket, // sets the S3 bucket as the destination for the deployment. This means that the frontend files will be uploaded to the S3 bucket.
      distribution, // invalidates the CloudFront distribution to ensure that the new files are served immediately. This is important for cache management.
      distributionPaths: ["/*"], // specifies that all paths in the CloudFront distribution should be invalidated after deployment, ensuring that users get the latest version of the frontend files.
    });

    // 9. Outputs
    new cdk.CfnOutput(this, "ApiEndpoint", {
      value: api.url ?? "Something went wrong with the deploy",
    }); // outputs the API endpoint URL after deployment, so you can easily find it and use it in your frontend app to make API requests.
    new cdk.CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
    }); // outputs the Cognito User Pool ID after deployment, which can be useful for debugging or if you need to reference it in other parts of your infrastructure. The frontend app doesn't need this value directly since it will use the User Pool Client ID for authentication, but it's still helpful to have it as an output.
    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
    }); // outputs the Cognito User Pool Client ID after deployment, which is used by the frontend app to authenticate users.
    new cdk.CfnOutput(this, "CloudFrontURL", {
      value: `https://${distribution.distributionDomainName}`,
    }); // outputs the CloudFront distribution URL after deployment, which is the URL you can use to access your frontend app. This is especially useful if you want to test the frontend before setting up a custom domain.
  }
}

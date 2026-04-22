import { describe, jest, test } from "@jest/globals";
import * as cdk from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { BackendStack } from "../lib/backend-stack";

jest.mock("aws-cdk-lib/aws-lambda-nodejs", () => {
  const lambda =
    jest.requireActual<typeof import("aws-cdk-lib/aws-lambda")>(
      "aws-cdk-lib/aws-lambda",
    );

  return {
    NodejsFunction: class NodejsFunction extends lambda.Function {
      constructor(scope: any, id: string, props: Record<string, any>) {
        super(scope, id, {
          runtime: lambda.Runtime.NODEJS_20_X,
          handler: props.handler,
          code: lambda.Code.fromInline("exports.handler = async () => {};"),
          environment: props.environment,
        });
      }
    },
  };
});

describe("BackendStack", () => {
  const synthesizeTemplate = () => {
    const app = new cdk.App();
    const stack = new BackendStack(app, "TestBackendStack");
    return Template.fromStack(stack);
  };

  test("creates a pay-per-request DynamoDB vendor table", () => {
    const template = synthesizeTemplate();

    template.resourceCountIs("AWS::DynamoDB::Table", 1);
    template.hasResourceProperties("AWS::DynamoDB::Table", {
      BillingMode: "PAY_PER_REQUEST",
      KeySchema: [
        {
          AttributeName: "vendorId",
          KeyType: "HASH",
        },
      ],
      AttributeDefinitions: [
        {
          AttributeName: "vendorId",
          AttributeType: "S",
        },
      ],
    });
  });

  test("creates Lambda functions wired to the vendor table name", () => {
    const template = synthesizeTemplate();

    template.resourcePropertiesCountIs(
      "AWS::Lambda::Function",
      {
        Environment: {
          Variables: {
            VENDOR_TABLE_NAME: Match.anyValue(),
          },
        },
      },
      3,
    );
  });

  test("protects vendor API methods with Cognito authorization", () => {
    const template = synthesizeTemplate();

    template.resourceCountIs("AWS::ApiGateway::Authorizer", 1);
    template.resourcePropertiesCountIs(
      "AWS::ApiGateway::Method",
      {
        AuthorizationType: "COGNITO_USER_POOLS",
      },
      3,
    );
  });

  test("configures Cognito email sign-in and self-service verification", () => {
    const template = synthesizeTemplate();

    template.hasResourceProperties("AWS::Cognito::UserPool", {
      AutoVerifiedAttributes: ["email"],
      UsernameAttributes: ["email"],
      VerificationMessageTemplate: {
        DefaultEmailOption: "CONFIRM_WITH_CODE",
      },
    });
    template.resourceCountIs("AWS::Cognito::UserPoolClient", 1);
  });

  test("serves frontend assets from a private S3 bucket through CloudFront", () => {
    const template = synthesizeTemplate();

    template.hasResourceProperties("AWS::S3::Bucket", {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
    template.hasResourceProperties("AWS::CloudFront::Distribution", {
      DistributionConfig: {
        DefaultRootObject: "index.html",
      },
    });
  });
});

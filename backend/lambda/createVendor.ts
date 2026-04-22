import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "node:crypto";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  try {
    const body = JSON.parse(event.body);

    const item = {
      vendorId: randomUUID(),
      name: body.name,
      category: body.category,
      contactEmail: body.contactEmail,
      createdAt: new Date().toISOString(),
    };

    await ddbDocClient.send(
      new PutCommand({
        TableName: process.env.VENDOR_TABLE_NAME!, // reads the DynamoDB table name from an environment variable. We'll set this value in the CDK stack. This avoids hardcoding the table name inside your Lambda code.
        Item: item,
      }),
    );

    return {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Origin": "*", // since we will use Cognito for authentication, we can allow all origins for simplicity. In a production app, you would want to restrict this to your frontend domain.
        "Access-Control-Allow-Methods": "OPTIONS, POST, GET, DELETE",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      body: JSON.stringify({
        message: "Vendor created successfully",
        vendorId: item.vendorId,
      }),
    };
  } catch (error) {
    console.error("Error creating vendor:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: "Failed to create vendor" }),
    };
  }
};

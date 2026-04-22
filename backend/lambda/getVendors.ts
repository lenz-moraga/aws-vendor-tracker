import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler = async () => {
  try {
    const response = await ddbDocClient.send(
      // ScanCommand reads every item in the table and returns them as an array.
      new ScanCommand({
        TableName: process.env.VENDOR_TABLE_NAME!,
      }),
      // In a production app with millions of rows, you would use a more targeted QueryCommand to avoid reading the entire table on every request.
    );

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(response.Items ?? []),
    };
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: "Failed to fetch vendors" }),
    };
  }
};

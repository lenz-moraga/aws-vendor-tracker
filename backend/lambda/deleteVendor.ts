import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
    try {
        const body = JSON.parse(event.body);
        const { vendorId } = body;

        if(!vendorId) {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
                body: JSON.stringify({ message: "vendorId is required" }),
            };
        }

        await ddbDocClient.send(
            new DeleteCommand({ 
                // for this example we're using the DeleteCommand to remove an item from the DynamoDB table based on the vendorId provided in the request body. 

                // in a production environment, you will want a soft delete mechanism, to prevent accidental data loss. For this mvp project, we'll keep it simple and allow direct deletion.
                TableName: process.env.VENDOR_TABLE_NAME!,
                Key: { vendorId },
            }),
        );

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "OPTIONS, POST, GET, DELETE",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
            body: JSON.stringify({ message: "Vendor deleted successfully" }),
        };
    } catch (error) {
        console.error("Error deleting vendor:", error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ message: "Failed to delete vendor" }),
        };
    }
};

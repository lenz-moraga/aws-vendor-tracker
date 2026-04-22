import { beforeEach, describe, expect, jest, test } from "@jest/globals";

const mockSend = jest.fn<(command: unknown) => Promise<unknown>>();

jest.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: jest.fn(),
}));

jest.mock("@aws-sdk/lib-dynamodb", () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({
      send: mockSend,
    })),
  },
  DeleteCommand: jest.fn((input) => ({ input, type: "DeleteCommand" })),
  PutCommand: jest.fn((input) => ({ input, type: "PutCommand" })),
  ScanCommand: jest.fn((input) => ({ input, type: "ScanCommand" })),
}));

jest.mock("node:crypto", () => ({
  randomUUID: jest.fn(() => "vendor-123"),
}));

import { handler as createVendor } from "../lambda/createVendor";
import { handler as deleteVendor } from "../lambda/deleteVendor";
import { handler as getVendors } from "../lambda/getVendors";

describe("vendor Lambda handlers", () => {
  beforeEach(() => {
    mockSend.mockReset();
    process.env.VENDOR_TABLE_NAME = "VendorTable";
  });

  test("createVendor stores a vendor and returns the generated id", async () => {
    mockSend.mockResolvedValueOnce({});

    const response = await createVendor({
      body: JSON.stringify({
        name: "Acme",
        category: "SaaS",
        contactEmail: "ops@example.com",
      }),
    });

    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body)).toEqual({
      message: "Vendor created successfully",
      vendorId: "vendor-123",
    });
    expect(mockSend).toHaveBeenCalledWith({
      input: {
        TableName: "VendorTable",
        Item: expect.objectContaining({
          vendorId: "vendor-123",
          name: "Acme",
          category: "SaaS",
          contactEmail: "ops@example.com",
          createdAt: expect.any(String),
        }),
      },
      type: "PutCommand",
    });
  });

  test("getVendors returns the stored vendors", async () => {
    const vendors = [
      {
        vendorId: "vendor-123",
        name: "Acme",
        category: "SaaS",
        contactEmail: "ops@example.com",
      },
    ];
    mockSend.mockResolvedValueOnce({ Items: vendors });

    const response = await getVendors();

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(vendors);
    expect(mockSend).toHaveBeenCalledWith({
      input: {
        TableName: "VendorTable",
      },
      type: "ScanCommand",
    });
  });

  test("deleteVendor requires a vendor id", async () => {
    const response = await deleteVendor({
      body: JSON.stringify({}),
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      message: "vendorId is required",
    });
    expect(mockSend).not.toHaveBeenCalled();
  });

  test("deleteVendor removes the requested vendor", async () => {
    mockSend.mockResolvedValueOnce({});

    const response = await deleteVendor({
      body: JSON.stringify({ vendorId: "vendor-123" }),
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      message: "Vendor deleted successfully",
    });
    expect(mockSend).toHaveBeenCalledWith({
      input: {
        TableName: "VendorTable",
        Key: {
          vendorId: "vendor-123",
        },
      },
      type: "DeleteCommand",
    });
  });
});

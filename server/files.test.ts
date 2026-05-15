import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the storage module
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({
    key: "user-1/general/test123.png",
    url: "https://cdn.example.com/user-1/general/test123.png",
  }),
}));

// Mock the db module
vi.mock("./db", () => ({
  createUserFile: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    fileKey: "user-1/general/test123.png",
    url: "https://cdn.example.com/user-1/general/test123.png",
    filename: "test.png",
    mimeType: "image/png",
    size: 1024,
    category: "general",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  getUserFiles: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      fileKey: "user-1/general/test123.png",
      url: "https://cdn.example.com/user-1/general/test123.png",
      filename: "test.png",
      mimeType: "image/png",
      size: 1024,
      category: "general",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getUserFileById: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    fileKey: "user-1/general/test123.png",
    url: "https://cdn.example.com/user-1/general/test123.png",
    filename: "test.png",
    mimeType: "image/png",
    size: 1024,
    category: "general",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  deleteUserFile: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-openid",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("files.upload", () => {
  it("uploads a file and returns the record", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Small base64-encoded PNG (1x1 pixel)
    const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const result = await caller.files.upload({
      filename: "test.png",
      mimeType: "image/png",
      data: base64Data,
      category: "general",
    });

    expect(result).toBeDefined();
    expect(result!.id).toBe(1);
    expect(result!.filename).toBe("test.png");
    expect(result!.mimeType).toBe("image/png");
    expect(result!.url).toContain("https://");
  });

  it("rejects unauthenticated upload attempts", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.files.upload({
        filename: "test.png",
        mimeType: "image/png",
        data: "dGVzdA==",
        category: "general",
      })
    ).rejects.toThrow();
  });
});

describe("files.list", () => {
  it("returns files for the authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.files.list({});

    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe("test.png");
  });

  it("rejects unauthenticated list attempts", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.files.list({})).rejects.toThrow();
  });
});

describe("files.get", () => {
  it("returns a single file by id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.files.get({ id: 1 });

    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(result.filename).toBe("test.png");
  });
});

describe("files.delete", () => {
  it("deletes a file and returns success", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.files.delete({ id: 1 });

    expect(result).toEqual({ success: true, deletedId: 1 });
  });
});

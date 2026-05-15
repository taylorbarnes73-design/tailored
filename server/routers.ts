import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  createUserFile,
  getUserFiles,
  getUserFileById,
  deleteUserFile,
} from "./db";
import { storagePut, storageGet } from "./storage";
import { generateStyleBrief, resolveRetailerImage } from "./style";
import { z } from "zod";
import { nanoid } from "nanoid";

const styleCatalogItemSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  brand: z.string().min(1),
  brandId: z.string().optional(),
  category: z.string().min(1),
  fit: z.number(),
  risk: z.string().min(1),
  bestSize: z.string().optional(),
  fabric: z.string().optional(),
  sizingNote: z.string().optional(),
  badge: z.string().optional(),
  trending: z.boolean().optional(),
  url: z.string().url().optional(),
  image: z.string().url().optional(),
  price: z.number().optional(),
  color: z.string().optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  files: router({
    /** Upload a file: accepts base64-encoded file data, stores in S3, saves metadata to DB */
    upload: protectedProcedure
      .input(
        z.object({
          filename: z.string().min(1).max(255),
          mimeType: z.string().min(1).max(128),
          /** Base64-encoded file content */
          data: z.string().min(1),
          category: z
            .enum(["body-scan", "profile-photo", "measurement", "general"])
            .default("general"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        const buffer = Buffer.from(input.data, "base64");
        const size = buffer.length;

        // 10MB max file size
        if (size > 10 * 1024 * 1024) {
          throw new Error("File size exceeds 10MB limit");
        }

        // Build a unique S3 key to prevent enumeration
        const ext = input.filename.split(".").pop() || "bin";
        const fileKey = `user-${userId}/${input.category}/${nanoid(12)}.${ext}`;

        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        // Save metadata to database
        const record = await createUserFile({
          userId,
          fileKey,
          url,
          filename: input.filename,
          mimeType: input.mimeType,
          size,
          category: input.category,
        });

        return record;
      }),

    /** List files for the authenticated user, optionally filtered by category */
    list: protectedProcedure
      .input(
        z
          .object({
            category: z
              .enum(["body-scan", "profile-photo", "measurement", "general"])
              .optional(),
          })
          .optional()
      )
      .query(async ({ ctx, input }) => {
        return getUserFiles(ctx.user.id, input?.category);
      }),

    /** Get a single file by ID (must belong to the authenticated user) */
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const file = await getUserFileById(input.id, ctx.user.id);
        if (!file) {
          throw new Error("File not found");
        }
        return file;
      }),

    /** Get a fresh presigned download URL for a file */
    getDownloadUrl: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const file = await getUserFileById(input.id, ctx.user.id);
        if (!file) {
          throw new Error("File not found");
        }
        const { url } = await storageGet(file.fileKey);
        return { url, filename: file.filename, mimeType: file.mimeType };
      }),

    /** Delete a file by ID (must belong to the authenticated user) */
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const file = await getUserFileById(input.id, ctx.user.id);
        if (!file) {
          throw new Error("File not found");
        }
        await deleteUserFile(input.id, ctx.user.id);
        return { success: true, deletedId: input.id };
      }),
  }),

  style: router({
    generateBrief: publicProcedure
      .input(
        z.object({
          body: z.object({
            bust: z.number(),
            waist: z.number(),
            hips: z.number(),
            shoulder: z.number().optional(),
            inseam: z.number().optional(),
          }),
          occasion: z.string().min(1),
          goal: z.string().min(1),
          palette: z.string().min(1),
          dressCode: z.string().min(1),
          notes: z.string().max(400).optional(),
          candidates: z.array(styleCatalogItemSchema).min(3).max(24),
        })
      )
      .mutation(async ({ input }) => {
        return generateStyleBrief(input);
      }),

    resolveProductImage: publicProcedure
      .input(
        z.object({
          url: z.string().url(),
          name: z.string().optional(),
          brand: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        return resolveRetailerImage(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;

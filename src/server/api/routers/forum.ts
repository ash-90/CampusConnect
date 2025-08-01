import { z } from "zod";

import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "~/server/api/trpc";
import { TagType } from "@prisma/client";

export const forumRouter = createTRPCRouter({
    getAllForums: protectedProcedure.query(async ({ ctx }) => {
        const forums = await ctx.db.forum.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        course: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return forums;
    }),

    // Search Forum by title
    searchForumByTitle: protectedProcedure
        .input(z.object({ query: z.string() }))
        .query(async ({ ctx, input }) => {
            const { query } = input;

            const forums = await ctx.db.forum.findMany({
                where: {
                    title: { contains: query, mode: 'insensitive' }
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                            course: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
            });

            return forums;
        }),

    // Get forum by tags
    getForumByTags: protectedProcedure
        .input(z.object({ tags: z.array(z.nativeEnum(TagType)) }))
        .query(async ({ ctx, input }) => {
            const { tags } = input;

            const forums = await ctx.db.forum.findMany({
                where: {
                    tag: { in: tags }
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                            course: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            return forums;
        }),

    // Search forum by tags and title
    searchForumByTagsAndTitle: protectedProcedure
        .input(z.object({
            query: z.string(),
            tags: z.array(z.nativeEnum(TagType)).optional()
        }))
        .query(async ({ ctx, input }) => {
            const { query, tags } = input;

            const forums = await ctx.db.forum.findMany({
                where: {
                    AND: [
                        { title: { contains: query, mode: 'insensitive' } },
                        tags && tags.length > 0 ? { tag: { in: tags } } : {}
                    ]
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                            course: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
            });

            return forums;
        }),

    // Create Forum
    createForum: protectedProcedure
        .input(z.object({
            title: z.string().min(1),
            tag: z.nativeEnum(TagType),
            deadline: z.date(),
        }))
        .mutation(async ({ ctx, input }) => {
            const forum = await ctx.db.forum.create({
                data: {
                    title: input.title,
                    tag: input.tag,
                    deadline: input.deadline,
                    userId: ctx.session.user.id,
                    likes: 0,
                    shares: 0,
                },
            });

            return forum;
        }),

    // Delete Forum
    deleteForum: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // Check if user owns the forum
            const forum = await ctx.db.forum.findFirst({
                where: {
                    id: input.id,
                    userId: ctx.session.user.id,
                },
            });

            if (!forum) {
                throw new Error("Forum not found or you don't have permission to delete it");
            }

            await ctx.db.forum.delete({
                where: { id: input.id },
            });

            return { success: true };
        }),

    // Edit Forum
    editForum: protectedProcedure
        .input(z.object({
            id: z.string(),
            title: z.string().min(1).optional(),
            tag: z.nativeEnum(TagType).optional(),
            deadline: z.date().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { id, ...updateData } = input;

            // Check if user owns the forum
            const forum = await ctx.db.forum.findFirst({
                where: {
                    id: id,
                    userId: ctx.session.user.id,
                },
            });

            if (!forum) {
                throw new Error("Forum not found or you don't have permission to edit it");
            }

            const updatedForum = await ctx.db.forum.update({
                where: { id: id },
                data: updateData,
            });

            return updatedForum;
        }),

    // Like Forum
    likeForum: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const forum = await ctx.db.forum.update({
                where: { id: input.id },
                data: {
                    likes: { increment: 1 },
                },
            });

            return forum;
        }),

    // Share Forum Count
    shareForum: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const forum = await ctx.db.forum.update({
                where: { id: input.id },
                data: {
                    shares: { increment: 1 },
                },
            });

            return forum;
        }),
});
import { z } from "zod";

import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "~/server/api/trpc";

export const moduleRouter = createTRPCRouter({
     search: publicProcedure
    .input(z.object({
      query: z.string().min(2),
    }))
    .query(async ({ input, ctx }) => {
      return await ctx.db.modules.findMany({
        where: {
          OR: [
            {
              name: {
                contains: input.query,
                mode: 'insensitive',
              },
            },
            {
              classId: {
                contains: input.query,
                mode: 'insensitive',
              },
            },
          ],
        },
        take: 10, // Limit results
      });
    }),

    getAllModules: protectedProcedure.query(async ({ ctx }) => {
        const modules = await ctx.db.modules.findMany({
            orderBy: { name: "asc" },
        });

        return modules;
    }),

    // Get modules for current user
    getUserModules: protectedProcedure.query(async ({ ctx }) => {
        const userModules = await ctx.db.modulesOnUsers.findMany({
            where: { userId: ctx.session.user.id },
            include: {
                module: true,
            },
        });

        return userModules.map(um => um.module);
    }),

    // Create Module
    createModule: protectedProcedure
        .input(z.object({
            name: z.string().min(1),
            classId: z.string().min(1),
            prof: z.string().min(1),
        }))
        .mutation(async ({ ctx, input }) => {
            // Check if module with classId already exists
            const existingModule = await ctx.db.modules.findUnique({
                where: { classId: input.classId },
            });

            if (existingModule) {
                throw new Error("Module with this class ID already exists");
            }

            const mod = await ctx.db.modules.create({
                data: input,
            });

            return mod;
        }),

    // Add Module to User (Create User Module relationship)
    addModuleToUser: protectedProcedure
        .input(z.object({ moduleId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // Check if relationship already exists
            const existingRelation = await ctx.db.modulesOnUsers.findUnique({
                where: {
                    userId_moduleId: {
                        userId: ctx.session.user.id,
                        moduleId: input.moduleId,
                    },
                },
            });

            if (existingRelation) {
                throw new Error("User is already enrolled in this module");
            }

            const userModule = await ctx.db.modulesOnUsers.create({
                data: {
                    userId: ctx.session.user.id,
                    moduleId: input.moduleId,
                },
                include: {
                    module: true,
                },
            });

            return userModule;
        }),

    // Remove Module from User
    removeModuleFromUser: protectedProcedure
        .input(z.object({ moduleId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const deletedRelation = await ctx.db.modulesOnUsers.delete({
                where: {
                    userId_moduleId: {
                        userId: ctx.session.user.id,
                        moduleId: input.moduleId,
                    },
                },
            });

            return { success: true, deletedRelation };
        }),

    // Add multiple modules to user at once
    addMultipleModulesToUser: protectedProcedure
        .input(z.object({ moduleIds: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            const { moduleIds } = input;
            const userId = ctx.session.user.id;

            // Check for existing relationships
            const existingRelations = await ctx.db.modulesOnUsers.findMany({
                where: {
                    userId: userId,
                    moduleId: { in: moduleIds },
                },
            });

            const existingModuleIds = existingRelations.map(r => r.moduleId);
            const newModuleIds = moduleIds.filter(id => !existingModuleIds.includes(id));

            if (newModuleIds.length === 0) {
                throw new Error("User is already enrolled in all specified modules");
            }

            // Create new relationships
            const newRelations = await ctx.db.modulesOnUsers.createMany({
                data: newModuleIds.map(moduleId => ({
                    userId: userId,
                    moduleId: moduleId,
                })),
            });

            return {
                created: newRelations.count,
                skipped: existingModuleIds.length,
                message: `Added ${newRelations.count} modules, skipped ${existingModuleIds.length} existing enrollments`,
            };
        }),

    // Search modules by name or classId
    searchModules: protectedProcedure
        .input(z.object({ query: z.string() }))
        .query(async ({ ctx, input }) => {
            const { query } = input;

            const modules = await ctx.db.modules.findMany({
                where: {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { classId: { contains: query, mode: 'insensitive' } },
                        { prof: { contains: query, mode: 'insensitive' } },
                    ]
                },
                orderBy: { name: 'asc' },
                take: 10,
            });

            return modules;
        }),

    // Get module by ID with enrolled users count
    getModuleById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const mod = await ctx.db.modules.findUnique({
                where: { id: input.id },
                include: {
                    User: {
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
                    },
                },
            });

            if (!mod) {
                throw new Error("Module not found");
            }

            return {
                ...mod,
                enrolledUsersCount: mod.User.length,
                enrolledUsers: mod.User.map(u => u.user),
            };
        }),
});

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { z } from "zod";

import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "~/server/api/trpc";


import { Course } from "@prisma/client";
import { TRPCError } from "@trpc/server";

const skillSchema = z.object({
  skillName: z.string().min(1).transform((s) => s.trim()),
  type: z.string().optional().transform((t) => t?.trim()).nullable(),
});

const skillArraySchema = z
  .array(skillSchema)
  .superRefine((arr, ctx) => {
    const seen = new Set<string>();
    arr.forEach((s, i) => {
      const lower = s.skillName.toLowerCase();
      if (seen.has(lower)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate skillName "${s.skillName}"`,
          path: [i, "skillName"],
        });
      } else {
        seen.add(lower);
      }
    });
  })
  .optional();
  
export const userRouter = createTRPCRouter({

    didUserFinishWelcome: protectedProcedure    .query(async ({ ctx}) => {

      if (!ctx.session.user){ 
       throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const user = await ctx.db.user.findUnique({

        where: { id: ctx.session?.user.id },
      select:{ 
        id: true,
        enrollmentYear: true
      }
      });

      if (!user?.enrollmentYear ) { 
        return null
      }
      return user;
    }),
    getUser: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
        include: {
          Modules: {
            include: {
              module: true,
            },
          },
          Forum: true,
        },
      });

      return user;
    }),

  // Get current user
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        Modules: {
          include: {
            module: true,
          },
        },
        Forum: true,
      },
    });

    return user;
  }),

  // Create User
  create: publicProcedure
  .input(z.object({
    name: z.string().min(1).optional(),
    enrollmentYear: z.number().int().min(1900).max(2030).optional(),
    course: z.nativeEnum(Course).optional(),
    modules: z.array(z.object({
      id: z.string(),
      name: z.string(),
      classId: z.string(),
      prof: z.string(),
      isNew: z.boolean().optional(),
    })).optional(),
    project: z.string().optional(),
    interests: z.string().optional(),
    hardSkills: skillArraySchema,
  softSkills: skillArraySchema
  }))
  .mutation(async ({ input, ctx }) => {

    console.log(">>>INPUT RECEIVED", input)
    const userId = ctx.session?.user.id;
    if (!userId) throw new Error("Not authenticated");

    const data: any = {};

    if (input.name !== undefined && input.name !== "") data.name = input.name;
    if (input.enrollmentYear !== undefined) data.enrollmentYear = input.enrollmentYear;
    if (input.course !== undefined) data.course = input.course;
    if (input.project !== undefined) {
      data.project = input.project === "" ? null : input.project;
    }
    if (input.interests !== undefined) {
      data.interest = input.interests === "" ? null : input.interests;
    }
      if (input.hardSkills && input.hardSkills.length > 0) {
        data.hardSkills = input.hardSkills;
      }
      if (input.softSkills && input.softSkills.length > 0) {
        data.softSkills = input.softSkills;
      }


    if (input.modules && input.modules.length > 0) {
      // First, clear existing module connections for this user
      await ctx.db.modulesOnUsers.deleteMany({
        where: { userId },
      });

      // Process each module: create if doesn't exist, then connect to user
      for (const moduleInput of input.modules) {
        // Check if this is a new module (client-generated ID starting with "new-")
        const isNewModule = moduleInput.id.startsWith("new-") || moduleInput.isNew;
        
        let moduleId: string;

        if (isNewModule) {
          // For new modules, use upsert to avoid duplicates based on classId
          const mod = await ctx.db.modules.upsert({
            where: { classId: moduleInput.classId },
            update: {
              name: moduleInput.name,
              prof: moduleInput.prof,
            },
            create: {
              name: moduleInput.name,
              classId: moduleInput.classId,
              prof: moduleInput.prof,
            },
          });
          moduleId = mod.id;
        } else {
          // For existing modules, just use the provided ID
          moduleId = moduleInput.id;
        }

        // Create the connection between user and module
        await ctx.db.modulesOnUsers.create({
          data: {
            userId,
            moduleId,
          },
        });
      }
    }

    const user = await ctx.db.user.update({
      where: { id: userId },
      data,
      include: {
        Modules: {
          include: {
            module: true,
          },
        },
      },
    });

    return user;
  }),
//   createUser: publicProcedure
//     .input(z.object({
//       name: z.string().min(1),
//       email: z.string().email(),
//       pwdHash: z.string(),
//       enrollmentYear: z.number(),
//       course: z.nativeEnum(Course),
//       intro: z.string().default(""),
//       hardSkills: z.any().default({}),
//       softSkills: z.any().default({}),
//       project: z.any().default({}),
//       interest: z.any().default({}),
//       socialMedia: z.any().default({}),
//     }))
//     .mutation(async ({ ctx, input }) => {
//       const user = await ctx.db.user.create({
//         data: input,
//       });

//       return user;
//     }),

  // Edit User (full profile update)
  editUser: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      enrollmentYear: z.number().optional(),
      course: z.nativeEnum(Course).optional(),
      imageURL: z.string().optional(),
      bannerURL: z.string().optional(),
      intro: z.string().optional(),
      hardSkills: z.any().optional(),
      softSkills: z.any().optional(),
      project: z.any().optional(),
      interest: z.any().optional(),
      socialMedia: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: input,
      });

      return user;
    }),

  // Edit User Information (basic info)
  editUserInformation: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      enrollmentYear: z.number().optional(),
      course: z.nativeEnum(Course).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: input,
      });

      return user;
    }),

  // Edit User Hard Skills
  editUserHardSkills: protectedProcedure
    .input(z.object({ hardSkills: z.any() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { hardSkills: input.hardSkills },
      });

      return user;
    }),

  // Edit User Soft Skills
  editUserSoftSkills: protectedProcedure
    .input(z.object({ softSkills: z.any() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { softSkills: input.softSkills },
      });

      return user;
    }),

  // Edit User Introduction
  editUserIntroduction: protectedProcedure
    .input(z.object({ intro: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { intro: input.intro },
      });

      return user;
    }),

  // Edit User Banner
  editUserBanner: protectedProcedure
    .input(z.object({ bannerURL: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { bannerURL: input.bannerURL },
      });

      return user;
    }),

  // Edit User Project
  editUserProject: protectedProcedure
    .input(z.object({ project: z.any() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { project: input.project },
      });

      return user;
    }),

  // Get User for OG (Open Graph - minimal data for social sharing)
  getUserForOG: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          course: true,
          image: true,
          intro: true,
        },
      });

      return user;
    }),

  // Get User for Card (card display - selected fields)
  getUserForCard: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          course: true,
          enrollmentYear: true,
          image: true,
          intro: true,
          hardSkills: true,
          softSkills: true,
          interest: true,
        },
      });

      return user;
    }),

  // Recommend Users with Same Modules
  recommendUsersSameMod: protectedProcedure.query(async ({ ctx }) => {
    // Get current user's modules
    const currentUserModules = await ctx.db.modulesOnUsers.findMany({
      where: { userId: ctx.session.user.id },
      select: { moduleId: true },
    });

    const moduleIds = currentUserModules.map(m => m.moduleId);

    if (moduleIds.length === 0) {
      return [];
    }

    // Find users who share at least one module
    const usersWithSameModules = await ctx.db.user.findMany({
      where: {
        AND: [
          { id: { not: ctx.session.user.id } }, // Exclude current user
          {
            Modules: {
              some: {
                moduleId: { in: moduleIds }
              }
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        course: true,
        enrollmentYear: true,
        image: true,
        intro: true,
        Modules: {
          include: {
            module: {
              select: {
                id: true,
                name: true,
                classId: true,
              }
            }
          }
        }
      },
      take: 10, // Limit recommendations
    });

    // Sort by number of shared modules (optional enhancement)
    const usersWithSharedCount = usersWithSameModules.map(user => {
      const sharedModules = user.Modules.filter(userModule => 
        moduleIds.includes(userModule.moduleId)
      );
      return {
        ...user,
        sharedModulesCount: sharedModules.length,
        sharedModules: sharedModules.map(m => m.module),
      };
    });

    // Sort by most shared modules first
    usersWithSharedCount.sort((a, b) => b.sharedModulesCount - a.sharedModulesCount);

    return usersWithSharedCount;
  }), 

});
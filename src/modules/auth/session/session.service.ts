import { ForbiddenException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../prisma/prisma.service';

/**
 * # Session Manager Service!
 *
 * ## Description
 *
 * This service is responsible for managing the user's session.
 *
 * ## Methods
 *
 * ### createSessionAndOverride
 *
 * This method is responsible for creating a new session and overriding the old one.
 *
 * ### updateSession
 *
 * This method is responsible for updating the user's session.
 *
 * ### deleteSession
 *
 * This method is responsible for deleting the user's session.
 *
 * ### findSessionByUser
 *
 * This method is responsible for finding the user's session.
 *
 * ## Dependencies
 *
 * ### PrismaService
 *
 * This service is responsible for managing the database.
 *
 * ## Exceptions
 *
 * ### user_not_found
 *
 * This exception is thrown when the user is not found.
 *
 * ### session_not_updated
 *
 * This exception is thrown when the session is not updated.
 *
 * ### session_not_deleted
 *
 * This exception is thrown when the session is not deleted.
 *
 * ### session_not_found
 *
 * This exception is thrown when the session is not found.
 *
 * ## Links
 *
 * @module SessionManager
 * @version 1.0.0
 * @category SessionManager
 * @see {@link createSessionAndOverride}
 * @see {@link updateSession}
 * @see {@link deleteSession}
 * @see {@link findSessionByUser}
 */

@Injectable()
export class SessionManagerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new session for a user and override existing sessions if the user has more than two
   * sessions.
   *
   * @param userId - The ID of the user.
   * @param token - The token for the new session.
   * @returns The created session.
   * @throws Error if the user is not found.
   */

  async createSessionAndOverride(userId: string, token: string) {
    return await this.prisma.$transaction(async ctx => {
      const user = await ctx.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          sessions: true,
        },
      });

      if (!user) throw new Error('user_not_found');

      if (user.sessions.length > 2) {
        await ctx.session.delete({
          where: {
            id: user.sessions[0].id,
          },
        });
      }

      const session = await ctx.session.create({
        data: {
          token,
          User: {
            connect: {
              id: userId,
            },
          },
        },
        include: {
          User: true,
        },
      });

      return session;
    });
  }

  /**
   * Update the token for a user session based on the user ID.
   *
   * @param userId - The ID of the user.
   * @param token - The new token for the session.
   * @returns The updated session.
   * @throws Error if the user is not found or the session is not updated.
   */

  async updateSession(userId: string, token: string) {
    return await this.prisma.$transaction(async ctx => {
      const user = await ctx.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          sessions: true,
        },
      });

      if (!user) throw new Error('user_not_found');

      const session = await ctx.session.update({
        where: {
          id: user.sessions[0].id,
        },
        data: {
          token,
        },
      });

      if (!session) throw new Error('session_not_updated');

      return session;
    });
  }

  /**
   * Delete a session for a user based on the user ID.
   *
   * @param userId - The ID of the user.
   * @returns The deleted session.
   * @throws Error if the user is not found or the session is not deleted.
   */

  async deleteSession(userId: string) {
    return await this.prisma.$transaction(async ctx => {
      const user = await ctx.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          sessions: true,
        },
      });

      if (!user) throw new Error('user_not_found');

      const session = await ctx.session.delete({
        where: {
          id: user.sessions[0].id,
        },
      });

      if (!session) throw new Error('session_not_deleted');

      return session;
    });
  }

  /**
   * Find a user session by user ID and token.
   *
   * @param userId - The ID of the user.
   * @param token - The token of the session.
   * @returns The user associated with the session.
   * @throws ForbiddenException if the user is not found.
   * @throws Error if the session is not found.
   */
  async findSessionByUser(userId: string, token: string) {
    return await this.prisma.$transaction(async ctx => {
      const user = await ctx.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          sessions: true,
        },
      });

      if (!user) throw new ForbiddenException('user_not_found');

      const session = user.sessions.find(session => session.token === token);

      if (!session) throw new Error('session_not_found');

      return user;
    });
  }
}

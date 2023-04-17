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
   * # Method: createSessionAndOverride
   *
   * ## Description
   *
   * This function creates a new session for the specified user and overrides any existing sessions
   * if the maximum session limit of 2 has been reached. The function uses the Prisma ORM to perform
   * database operations in a transaction.
   *
   * ## Parameters
   *
   * @param - **userId**(string): The user's id.
   *
   *   - **token**(string): the session token to be created.
   *
   *   ## Return
   * @returns - **session**(Session): A Promise that resolves to a session object containing session
   *   details, including the associated user details.
   *
   *   ## Exceptions
   *
   *   ### user_not_found
   *
   *   This exception is thrown when the user is not found.
   *
   *   ### session_not_found
   *
   *   This exception is thrown when the session is not found.
   *
   *   ## Dependencies
   *
   *   ### PrismaService
   *
   *   This service is responsible for managing the database.
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
   * # Method: updateSession
   *
   * ## Description
   *
   * This is an asynchronous method that updates the session token of a user with a new value. It
   * takes in two parameters: userId, which is a string representing the id of the user, and token,
   * which is a string representing the new session token.
   *
   * The method uses the Prisma ORM to perform database operations in a transaction.
   *
   * ## Parameters
   *
   * @param - **userId**(string): The user's id.
   *
   *   - **token**(string): the session token to be created.
   *
   *   ## Return
   * @returns - **session**(Session): A Promise that resolves to a session object containing session
   *   details, including the associated user details.
   *
   *   ## Exceptions
   *
   *   ### user_not_found
   *
   *   This exception is thrown when the user is not found.
   *
   *   ### session_not_updated
   *
   *   This exception is thrown when the session is not updated.
   *
   *   ## Dependencies
   *
   *   ### PrismaService
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
   * # Method: deleteSession
   *
   * ## Description
   *
   * This is an asynchronous method that deletes the session of a user. It takes in one parameter:
   * userId, which is a string representing the id of the user.
   *
   * The method uses the Prisma ORM to perform database operations in a transaction.
   *
   * ## Parameters
   *
   * @param - **userId**(string): The user's id.
   *
   *   ## Return
   * @returns - **session**(Session): A Promise that resolves to a session object containing session
   *   details, including the associated user details.
   *
   *   ## Exceptions
   *
   *   ### user_not_found
   *
   *   This exception is thrown when the user is not found.
   *
   *   ### session_not_deleted
   *
   *   This exception is thrown when the session is not deleted.
   *
   *   ## Dependencies
   *
   *   ### PrismaService
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
   * # Method: findSessionByUser
   *
   * ## Description
   *
   * This is an asynchronous method that finds a session by user. It takes in two parameters:
   * userId, which is a string representing the id of the user, and token, which is a string
   * representing the session token.
   *
   * The method uses the Prisma ORM to perform database operations in a transaction.
   *
   * ## Parameters
   *
   * @param - **userId**(string): The user's id.
   *
   *   - **token**(string): the session token to be created.
   *
   *   ## Return
   * @returns - **user**(User): A Promise that resolves to a user object containing user details,
   *
   *   Including the associated session details.
   *
   *   ## Exceptions
   *
   *   ### user_not_found
   *
   *   This exception is thrown when the user is not found.
   *
   *   ### session_not_found
   *
   *   This exception is thrown when the session is not found.
   *
   *   ## Dependencies
   *
   *   ### PrismaService
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

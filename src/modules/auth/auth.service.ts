import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { CreateUserDto, LoginUserDto } from './../user/dto';
import { UserService } from './../user/user.service';
import { JWTPayload, LoginStatus, RegistrationStatus } from './interfaces';
import { CacheSystemService } from '../cache-system/cache-system.service';
import { AUTH_TOKEN, REFRESH_TOKEN } from 'src/consts';
import { AuthErrorHandler, CustomErrorException, errorCases } from '../utils';

/**
 * # AuthService
 *
 * ## Description:
 *
 * This service is responsible for the authentication of the user.
 *
 * ## Methods:
 *
 * - `SignUp`: This method is responsible for creating a new user.
 * - `SignIn`: This method is responsible for logging in a user.
 * - `refreshToken`: This method is responsible for refreshing the user's token.
 * - `deleteUserSession`: This method is responsible for deleting the user's session.
 * - `_decodeToken`: This method is responsible for decoding the user's token.
 * - `_createTokens`: This method is responsible for creating the user's tokens.
 *
 * ## Dependencies:
 *
 * - `UserService`: This service is responsible for managing the user.
 *
 * ## Exceptions:
 *
 * - `user_not_created`: This exception is thrown when the user is not created.
 * - `user_not_found`: This exception is thrown when the user is not found.
 *
 * ## Links:
 *
 * @module AuthService
 * @version 1.0.0
 * @category AuthService
 * @see {@link SignUp}
 * @see {@link SignIn}
 * @see {@link refreshToken}
 * @see {@link deleteUserSession}
 * @see {@link _decodeToken}
 * @see {@link _createTokens}
 * @see {@link UserService}
 */

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cache: CacheSystemService,
  ) {
    this.cache._configModel('user', {
      include: {
        role: true,
      },
    });
  }

  /**
   * Sign up a new user with the provided user data.
   *
   * @param userData - The user data for registration.
   * @returns The registration status with the created user data.
   * @throws ForbiddenException if the user creation fails.
   */
  async SignUp(userData: CreateUserDto): Promise<RegistrationStatus> {
    const user = await this.userService.createUser(userData);

    if (!user) {
      throw new ForbiddenException({
        message: 'user_not_created',
        success: false,
      });
    }

    const { password, lastName, bio, image, birthday, ...rest } = user;

    return {
      message: 'user_created',
      data: rest,
      success: true,
    };
  }
  /**
   * Sign in a user with the provided email and password.
   *
   * @param email - The email of the user.
   * @param password - The password of the user.
   * @returns The login status containing access and refresh tokens.
   * @throws ForbiddenException if the user is not found.
   */
  async SignIn({ email, password }: LoginUserDto): Promise<LoginStatus> {
    const user = await this.userService.FindByLogin({ email, password });
    if (!user) {
      throw new ForbiddenException({
        message: 'user_not_found',
        success: false,
      });
    }

    const tokens = await this._createTokens({
      id: user.id,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
    });

    this.cache.setTokentoRedis(`dataUser:${user.email}`, tokens.refreshToken);

    const { id, password: pass, ...rest } = user;

    return {
      message: 'user_logged',
      data: {
        access_token: tokens.authToken,
        refresh_token: tokens.refreshToken,
        rest,
      },
      success: true,
    };
  }

  /**
   * Refreshes the authentication token for a user session.
   *
   * @param userId - The ID of the user.
   * @param token - The current authentication token.
   * @returns The new authentication token.
   */
  async refreshToken(token: string) {
    try {
      const decodedToken = this._decodeToken(token);

      const { email, id } = decodedToken;

      const refreshTokenKey = `dataUser:${email}`;

      const tokens = await this._createTokens({
        id,
        email,
        iat: Math.floor(Date.now() / 1000),
      });

      const storedTokens = await this.cache.getTokenFromRedis(refreshTokenKey);

      if (!Array.isArray(storedTokens))
        throw new CustomErrorException({
          errorCase:
            'Unable to retrieve data from the token storage. Please check the Redis connection.',
          errorType: 'Token',
          status: 400,
        });

      if (!storedTokens.includes(token))
        throw new CustomErrorException({
          errorCase:
            'The token was provided it wasnt found in DB, please make sure you are providing the correct token',
          errorType: 'Token',
          status: 404,
        });

      this.cache.setTokentoRedis(refreshTokenKey, tokens.refreshToken);

      return tokens;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  /**
   * Deletes a user session based on the user ID.
   *
   * @param userId - The ID of the user whose session will be deleted.
   * @returns The deleted user session.
   */

  async deleteUserSession(email: string) {
    const tokenKey = `dataUser:${email}`;

    return await this.cache.cacheInValidation(tokenKey);
  }
  /**
   * Decodes a JWT token and retrieves the payload data.
   *
   * @param token - The JWT token to be decoded.
   * @returns The decoded payload as an object of type `JWTPayload`.
   */
  private _decodeToken(token: string): JWTPayload | null {
    try {
      if (!token) {
        throw new AuthErrorHandler('Token', errorCases.TOKEN_NOT_FOUND, 403);
      }

      return this.jwtService.decode(token) as JWTPayload;
    } catch (error) {
      console.error('Error decoding token:', error);
      throw error;
    }
  }

  /**
   * Generates authentication and refresh tokens based on the given payload.
   *
   * @param payload - The payload containing the data to be included in the tokens.
   * @returns An object containing the authentication and refresh tokens.
   */
  private async _createTokens(payload: JWTPayload) {
    try {
      const [authToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(payload, {
          secret: this.configService.get<string>('SECRET_JWT_KEY'),
          expiresIn: '1h',
        }),
        this.jwtService.signAsync(payload, {
          secret: this.configService.get<string>('REFRESH_JWT_KEY'),
          expiresIn: '7d',
        }),
      ]);

      return { authToken, refreshToken };
    } catch (error) {
      console.error(error);

      throw new CustomErrorException({
        errorType: 'Token',
        errorCase: 'token_creation_failed',
        value: payload.id,
        status: 405,
      });
    }
  }
}

import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { CreateUserDto, LoginUserDto } from './../user/dto';
import { UserService } from './../user/user.service';
import { JWTPayload, LoginStatus, RegistrationStatus } from './interfaces';
import { SessionManagerService } from './session/session.service';

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
    private readonly session: SessionManagerService,
  ) {}

  /**
   * # Method - SignUp
   *
   * ## Description:
   *
   * An asynchronous method that allows a user to sign up by creating a new user account with the
   * provided user data. It returns a Promise that resolves to a RegistrationStatus object, which
   * contains information about the status of the user registration process.
   *
   * ## Parameters:
   *
   * @example
   *   ```typescript
   *   const authService = new AuthService();
   *   const userData = {
   *   username: 'john.doe',
   *   password: 'password123',
   *   lastName: 'Doe',
   *   bio: 'Hello, I am John Doe.',
   *   image: 'profile.jpg',
   *   birthday: '1990-01-01',
   *   // Additional properties for user registration
   *   };
   *   const registrationStatus = await authService.SignUp(userData);
   *
   *   // Access the registration status properties
   *   console.log(registrationStatus.message); // 'user_created'
   *   console.log(registrationStatus.data); // { username: 'john.doe', lastName: 'Doe', bio: 'Hello, I am John Doe.', image: 'profile.jpg', birthday: '1990-01-01' }
   *   console.log(registrationStatus.success); // true
   *   ```
   *
   *
   *   ## Parameters:
   *
   * @param - `userData`: This parameter is responsible for receiving the user's data.
   *
   *   ## Return:
   * @returns - `RegistrationStatus`: This object is responsible for returning the status of the
   *   user's registration.
   *
   *   ## Exceptions:
   * @throws - `user_not_created`: This exception is thrown when the user is not created.
   *
   *   ## Links:
   * @see {@link UserService}
   * @see {@link RegistrationStatus}
   * @see {@link CreateUserDto}
   * @see {@link ForbiddenException}
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

  async SignIn({ email, password }: LoginUserDto): Promise<LoginStatus> {
    const user = await this.userService.FindByLogin({ email, password });

    const tokens = await this._createTokens({ id: user.id, email: user.email });

    await this.session.createSessionAndOverride(user.id, tokens.refreshToken);

    if (!user) {
      throw new ForbiddenException({
        message: 'user_not_found',
        success: false,
      });
    }

    const { id, password: pass, ...rest } = user;

    return {
      message: 'user_logged',
      data: { access_token: tokens.authToken, refresh_token: tokens.refreshToken, rest },
      success: true,
    };
  }

  async refreshToken(userId: string, token: string) {
    const userSession = await this.session.findSessionByUser(userId, token);

    const tokens = await this._createTokens({
      id: userSession.id,
      email: userSession.email,
      /*role: userSession.role,*/
    });

    await this.session.updateSession(userSession.id, tokens.refreshToken);

    return tokens.authToken;
  }

  async deleteUserSession(userId: string) {
    const userSession = await this.session.deleteSession(userId);
    return userSession;
  }

  _decodeToken(token: string) {
    return this.jwtService.decode(token);
  }

  async _createTokens(payload: JWTPayload) {
    const [authToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('SECRET_JWT_KEY'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('REFRESH_JWT_KEY'),
        expiresIn: '7d',
      }),
    ]);

    return { authToken, refreshToken };
  }
}

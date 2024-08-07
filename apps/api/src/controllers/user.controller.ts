import { type NextFunction, type Response, type Request } from 'express';
import usersServices from '@/services/user.services';
import authService from '@/services/auth.service';
import { cookiesOpt } from '@/utils/cookie';

export class UserController {
  async userRegisterEmail(req: Request, res: Response, next: NextFunction) {
    try {
      await usersServices.userRegisterEmail(req);
      res.status(201).send({
        message: 'New user has been registered',
      });
    } catch (error) {
      next(error);
    }
  }

  async tenantRegisterEmail(req: Request, res: Response, next: NextFunction) {
    try {
      await usersServices.tenantRegisterEmail(req);
      res.status(201).send({
        message: 'New user has been registered',
      });
    } catch (error) {
      next(error);
    }
  }

  async sendVerif(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usersServices.sendVerification(req);

      if (result) {
        res.status(200).json({
          isVerified: result.isVerified,
          message: result.message,
          user: result.user,
        });
      } else {
        res.status(400).send({ message: 'Verification failed' });
      }
    } catch (error) {
      next(error);
    }
  }

  async verifyTokenUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.verifyTokenUser(req);

      if (result) {
        res.status(200).json({
          result,
        });
      } else {
        res.status(400).send({ message: 'Verification failed' });
      }
    } catch (error) {
      next(error);
    }
  }

  async userEntryData(req: Request, res: Response, next: NextFunction) {
    try {
      const updatedUser = await usersServices.userEntryData(req);
      res.status(201).send({
        message: 'User data has been updated',
        updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  async resendEmail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await usersServices.resendVerification(req);

      if (result.message === 'Internal server error') {
        res.status(500).send({ message: result.message });
      } else {
        res
          .status(200)
          .send({ message: result.message, email: result.email || '' });
      }
    } catch (error) {
      next(error);
    }
  }

  async userGoogleLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { accessToken, refreshToken } =
        await authService.userGoogleLogin(req);
      res
        .cookie('access_token', accessToken, cookiesOpt)
        .cookie('refresh_token', refreshToken, cookiesOpt)
        .status(200)
        .send({
          message: 'New user has logged in using Google Login',
        });
    } catch (error) {
      next(error);
    }
  }

  async tenantGoogleLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { accessToken, refreshToken } =
        await authService.tenantGoogleLogin(req);
      res
        .cookie('access_token', accessToken, cookiesOpt)
        .cookie('refresh_token', refreshToken, cookiesOpt)
        .status(200)
        .send({
          message: 'New tenant has logged in using Google Login',
        });
    } catch (error) {
      next(error);
    }
  }

  async userLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { accessToken, refreshToken, role } =
        await authService.userLogin(req);

      if (role === 'user') {
        res
          .cookie('access_token', accessToken, cookiesOpt)
          .cookie('refresh_token', refreshToken, cookiesOpt)
          .send({
            message: 'Login as user',
            role: 'user',
            url: '/',
          });
      } else {
        res.status(400).send({
          error: 'Invalid role',
          message: 'Role is invalid',
        });
      }
    } catch (error) {
      console.error('Login error:', error);

      if (error instanceof Error) {
        res.status(400).send({
          error: 'Unauthorized',
          message: error.message,
        });
      } else {
        res.status(500).send({
          error: 'Unknown Error',
          message: 'An unexpected error occurred.',
        });
      }
    }
  }

  async tenantLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { accessToken, refreshToken, role } =
        await authService.tenantLogin(req);

      if (role === 'tenant') {
        res
          .cookie('access_token', accessToken, cookiesOpt)
          .cookie('refresh_token', refreshToken, cookiesOpt)
          .send({
            message: 'Login as tenant',
            role: 'tenant',
            url: '/dashboard',
          });
      } else {
        res.status(400).send({
          error: 'Invalid role',
          message: 'Role is invalid. Please log in with the correct role.',
        });
      }
    } catch (error) {
      console.error('Login error:', error);

      // Directly return the error message from the service
      if (error instanceof Error) {
        res.status(400).send({
          error: 'Unauthorized',
          message: error.message,
        });
      } else {
        res.status(500).send({
          error: 'Unknown Error',
          message: 'An unexpected error occurred.',
        });
      }
    }
  }

  async sendChangePassword(req: Request, res: Response, next: NextFunction) {
    try {
      let result = await authService.sendChangePasswordLink(req);
      if (result) {
        res.status(200).send({ message: result });
      } else {
        res.status(400).send({
          message: 'Your email is not registered, please register first.',
        });
      }
    } catch (error) {
      next(error);
    }
  }

  async verifyChangePass(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.verifyChangePass(req);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  }

  async validateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { access_token, isVerified, role, isRequestingEmailChange } =
        await authService.validate(req);

      res.send({
        message: 'success',
        isVerified,
        role,
        isRequestingEmailChange,
        access_token,
      });
    } catch (error) {
      next(error);
    }
  }

  async editUserProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usersServices.editUserProfile(req);
      res.cookie('access_token', result.token, cookiesOpt);
      res.status(200).json({
        message: 'User profile data has been updated',
        user: result.user,
        token: result.token,
      });
    } catch (error) {
      next(error);
    }
  }

  async reverifyEmail(req: Request, res: Response) {
    try {
      const result = await usersServices.reverifyEmail(req);
      res.cookie('access_token', result.token, cookiesOpt);
      res.status(200).json({
        message: 'User email has been verified',
        token: result.token,
        role: result.role,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === 'Token is required' ||
          error.message === 'Invalid or expired token'
        ) {
          res.status(400).json({ message: error.message });
        } else {
          res.status(500).json({ message: error.message });
        }
      } else {
        res.status(500).json({ message: 'Unknown error occurred' });
      }
    }
  }

  async renderPicUser(req: Request, res: Response, next: NextFunction) {
    try {
      const blob = await usersServices.renderPicUser(req);
      if (!blob) {
        return res.status(404).send('User profile pic not found');
      }
      res.set('Content-Type', 'image/png');
      res.send(blob);
    } catch (error) {
      next(error);
    }
  }

  async getProfileByTenantId(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await usersServices.getProfileByTenantId(req);
      res.status(200).json({
        data,
        message: 'Fetching profile successful',
      });
    } catch (error) {
      next(error);
    }
  }
}

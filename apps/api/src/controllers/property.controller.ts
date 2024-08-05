import { NextFunction, Response, Request } from 'express';
import propertyServices from '@/services/property.services';
import reviewService from '@/services/review.service';

export class PropertyController {
  // async getRoomAvailability(req: Request, res: Response, next: NextFunction) {
  //   const { roomId } = req.query; // Assuming roomId is passed as a query parameter
  //   const { checkIn, checkOut } = req.query; // Assuming checkIn and checkOut are also passed as query parameters

  //   try {
  //     if (!checkIn || !checkOut) {
  //       throw new Error('Both checkIn and checkOut dates are required.');
  //     }

  //     const remainingAvailability = await propertyServices.getRoomAvailability(
  //       roomId as string,
  //       new Date(checkIn as string),
  //       new Date(checkOut as string),
  //     );

  //     res.status(200).json({ remainingAvailability });
  //   } catch (error) {
  //     next(error); // Pass any errors to the error handling middleware
  //   }
  // }

  async searchProperties(req: Request, res: Response, next: NextFunction) {
    const { city, checkIn, checkOut, page = '1', limit = '10' } = req.query;

    try {
      if (!city || !checkIn || !checkOut) {
        throw new Error('City, checkIn, and checkOut are required.');
      }

      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);

      const result = await propertyServices.searchProperties(
        city as string,
        new Date(checkIn as string),
        new Date(checkOut as string),
        pageNumber,
        limitNumber,
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPropertyDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await propertyServices.getPropertyDetail(req);
      return res.send({
        message: 'Fetching property detail',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllPropertyByTenantId(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const data = await propertyServices.getAllPropByTenantId(req);
      return res.send({
        message: 'All Property',
        data,
      });
    } catch (error) {
      console.log('ga ada room');

      next(error);
    }
  }

  async getProfilePropertyByTenantId(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const data = await propertyServices.getProfilePropertyByTenantId(req);
      return res.send({
        message: 'Fetching all properties from tenant id',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPropertyDetailHost(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await propertyServices.getPropertyDetailHost(req);
      return res.send({
        message: 'Fetching property detail',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRoomById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await propertyServices.getRoomByRoomId(req);
      return res.send({
        message: 'All room type',
        data,
      });
    } catch (error) {
      console.log('ga ada room');
      next(error);
    }
  }

  async renderPicProp(req: Request, res: Response, next: NextFunction) {
    try {
      const blob = await propertyServices.renderPicProperty(req);

      if (!blob) {
        return res.status(404).send('Banner not found');
      }

      res.set('Content-Type', 'image/png');
      res.send(blob);
    } catch (error) {
      next(error);
    }
  }

  async createProperty(req: Request, res: Response, next: NextFunction) {
    try {
      await propertyServices.createProperty(req);
      return res.send({
        message: 'New listing has been posted',
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProperty(req: Request, res: Response, next: NextFunction) {
    try {
      await propertyServices.updateProperty(req);
      return res.send({
        message: 'Your listing has been updated',
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProperty(req: Request, res: Response, next: NextFunction) {
    try {
      await propertyServices.deleteProperty(req);
      return res.send({
        message: 'Your listing has been deleted',
      });
    } catch (error) {
      next(error);
    }
  }
}
export default new PropertyController();

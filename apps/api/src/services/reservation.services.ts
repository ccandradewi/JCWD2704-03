import { Request, Response } from 'express';
import { prisma } from '../libs/prisma';
import { generateInvoice } from '@/utils/invoice';
import sharp from 'sharp';
import moment from 'moment-timezone';
import { connect } from 'ngrok';
import { startExpireOrdersCron } from '@/cron/expiredOrder';
import { server } from 'typescript';
import crypto from 'crypto';
import { transporter } from '@/libs/nodemailer';
import path from 'path';
import fs from 'fs';

const midTransClient = require('midtrans-client');
class ReservationService {
  async getAllOrder(req: Request) {
    try {
      const orders = await prisma.order.findMany();
      return orders;
    } catch (error) {
      throw new Error(`Error fetching orders: ${error}`);
    }
  }
  async getOrderByOrderId(req: Request) {
    const { orderId } = req.params;
    const data = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        property: {
          select: {
            id: true,
            tenant_id: true,
            name: true,
            category: true,
            desc: true,
            city: true,
            address: true,
            latitude: true,
            longitude: true,
            pic_name: true,
            Review: true,
            RoomCategory: {
              select: {
                id: true,
                property_id: true,
                type: true,
                guest: true,
                isBreakfast: true,
                isRefunable: true,
                isSmoking: true,
                bed: true,
                deletedAt: true,
                pic_name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            social_id: true,
            first_name: true,
            last_name: true,
            role: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true,
            isRequestingEmailChange: true,
            image_name: true,
            Property: true,
          },
        },
        RoomCategory: {
          select: {
            id: true,
            property_id: true,
            type: true,
            guest: true,
            price: true,
            peak_price: true,
            start_date_peak: true,
            end_date_peak: true,
            isBreakfast: true,
            isRefunable: true,
            isSmoking: true,
            bed: true,
            desc: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
            pic_name: true,
            Room: true,
          },
        },
        OrderRoom: true,
      },
    });
    if (!data) {
      throw new Error('Order not found');
    }

    return data;
  }
  async getOrderByUserId(req: Request) {
    //search tiket
    const { checkInDate, invoiceId } = req.query;
    const checkInDateFilter = checkInDate
      ? new Date(checkInDate as string)
      : undefined;
    const data = await prisma.order.findMany({
      where: {
        user_id: req.user?.id,
        ...(invoiceId && { invoice_id: invoiceId as string }),
        ...(checkInDateFilter && {
          checkIn_date: checkInDateFilter,
        }),
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        property: {
          select: {
            name: true,
            pic_name: true,
            city: true,
            address: true,
            id: true,
          },
        },
        user: {
          select: {
            first_name: true,
          },
        },
        RoomCategory: {
          select: {
            id: true,
            pic_name: true,
            type: true,
            price: true,
            peak_price: true,
            start_date_peak: true,
            end_date_peak: true,
            isBreakfast: true,
            isRefunable: true,
            isSmoking: true,
          },
        },
      },
    });
    return data;
  }
  async getOrderBySellerId(req: Request) {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const offset = (page - 1) * limit;
    const data = await prisma.order.findMany({
      where: {
        property: {
          tenant_id: req.user?.id,
        },
      },
      select: {
        id: true,
        invoice_id: true,
        createdAt: true,
        payment_method: true,
        checkIn_date: true,
        checkOut_date: true,
        status: true,
        payment_date: true,
        payment_proof: true,
        property: {
          select: {
            name: true,
            pic_name: true,
          },
        },
        user: {
          select: {
            first_name: true,
          },
        },
        RoomCategory: {
          select: {
            type: true,
            pic_name: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      skip: offset,
      take: limit,
    });
    const totalOrders = await prisma.order.count({
      where: {
        property: {
          tenant_id: req.user?.id,
        },
      },
    });
    return {
      data,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
    };
  }
  async createOrder(req: Request) {
    const {
      user_id,
      property_id,
      roomCategory_id,
      room_ids, // Array of room IDs
      checkIn_date,
      checkOut_date,
      payment_method = null,
      total_price,
      status = 'pending_payment',
    } = req.body;

    let roomIdsArray = room_ids;
    roomIdsArray = [...new Set(roomIdsArray)];
    console.log('Number of rooms:', roomIdsArray.length);
    console.log('Room IDs:', roomIdsArray);
    const existingOrder = await prisma.order.findFirst({
      where: {
        user_id: user_id,
        property_id: property_id,
        checkIn_date: new Date(checkIn_date),
        checkOut_date: new Date(checkOut_date),
        OrderRoom: {
          some: {
            room_id: {
              in: roomIdsArray,
            },
          },
        },
      },
      include: {
        OrderRoom: true,
      },
    });

    if (existingOrder) {
      throw new Error(
        'Anda sudah memiliki pesanan untuk kamar dan tanggal ini.',
      );
    }

    const room = await prisma.room.findFirst({
      where: { id: roomIdsArray[0] },
      select: {
        roomCategory: true,
      },
    });

    if (!room) {
      throw new Error('Room not found');
    }
    const checkIn = new Date(checkIn_date);
    const checkOut = new Date(checkOut_date);
    const diff = Math.abs(checkOut.getTime() - checkIn.getTime());
    // Calculate the duration in days
    const durationInDays = Math.ceil(diff / (1000 * 3600 * 24));
    console.log(durationInDays);
    if (checkIn > checkOut) {
      console.error('Check-out date must be after check-in date!');
    }

    const order = await prisma.order.create({
      data: {
        user: { connect: { id: user_id } },
        property: { connect: { id: property_id } },
        RoomCategory: { connect: { id: roomCategory_id } },
        checkIn_date: new Date(checkIn_date),
        checkOut_date: new Date(checkOut_date),
        total_price,
        invoice_id: generateInvoice(property_id),
        payment_method,
        status,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    const orderRooms = roomIdsArray.map((room_id: string) => ({
      order_id: order.id,
      room_id,
    }));

    await prisma.orderRoom.createMany({
      data: orderRooms,
    });
    let cronStarted = false;
    if (!cronStarted) {
      startExpireOrdersCron();
      cronStarted = true;
    }

    return order;
  }
  async updateOrder(req: Request) {
    const { orderId } = req.params;
    const { file } = req;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        property: {
          select: {
            name: true,
            city: true,
            address: true,
            id: true,
            pic_name: true,
          },
        },
        OrderRoom: true,
        RoomCategory: {
          select: {
            id: true,
            property_id: true,
            type: true,
            price: true,
            peak_price: true,
            start_date_peak: true,
            end_date_peak: true,
            pic_name: true,
          },
        },
      },
    });
    if (!order) {
      throw new Error('Order Not Found');
    }
    let paymentProofBuffer: Buffer | null = order.payment_proof;
    let status = order.status;
    if (file) {
      paymentProofBuffer = await sharp(file.buffer).png().toBuffer();
      status = 'awaiting_confirmation';
    }
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        payment_date: moment.tz('Asia/Jakarta').format(),
        payment_proof: paymentProofBuffer,
        status: status,
        updatedAt: new Date(),
      },
    });
    console.log('testttt', moment.tz('Asia/Jakarta').format());

    return updatedOrder;
  }
  async createSnapMidtrans(req: Request) {
    const { order_id, total_price } = req.body;
    let snap = new midTransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    });
    const totalPrice = parseInt(total_price);
    const payload = {
      transaction_details: {
        order_id: order_id,
        gross_amount: totalPrice,
      },
    };
    const token = await snap.createTransactionToken(payload);
    if (token) {
      await prisma.order.update({
        where: { id: order_id },
        data: { token_midTrans: token },
      });
      return token;
    }
  }

  async updateStatusBasedOnMidtransResponse(order_id: string, data: any) {
    const hash = crypto
      .createHash('sha512')
      .update(
        `${order_id}${data.status_code}${data.gross_amount}${process.env.MIDTRANS_SERVER_KEY}`,
      )
      .digest('hex');
    if (data.signature_key !== hash) {
      return {
        status: 'error',
        message: 'Invalid Signature key',
      };
    }
    let responseData = null;
    let transactionStatus = data.transaction_status;
    let fraudStatus = data.fraud_status;
    let paymentMethod = data.acquirer;
    console.log('enable payment', data.enabled_payments);
    paymentMethod = data.acquirer === 'airpay shopee' ? 'SHOPEE' : 'GOPAY';
    console.log('isiii data midtrans', data);
    if (transactionStatus == 'capture') {
      if (fraudStatus == 'accept') {
        const transaction = await prisma.order.update({
          where: { id: order_id },
          data: {
            payment_date: moment.tz('Asia/Jakarta').format(),
            status: 'success',
            updatedAt: new Date(),
            payment_method: paymentMethod,
          },
        });
        responseData = transaction;
      }
    } else if (transactionStatus == 'settlement') {
      console.log('masuk settlement');
      const transaction = await prisma.order.update({
        where: { id: order_id },
        data: {
          payment_date: moment.tz('Asia/Jakarta').format(),
          status: 'success',
          updatedAt: new Date(),
          payment_method: paymentMethod,
        },
      });
      const templatePath = path.join(__dirname, '../templates/confirm.html');
      let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');
      const orderDetails = await prisma.order.findUnique({
        where: { id: order_id },
        include: {
          user: {
            select: {
              email: true,
            },
          },
          property: {
            select: {
              name: true,
            },
          },
          RoomCategory: { select: { type: true } },
        },
      });
      if (orderDetails) {
        const userEmail = orderDetails.user.email;
        const propertyName = orderDetails.property.name;
        const roomType = orderDetails.RoomCategory?.type || 'Unknown Room Type';
        const checkInDate = orderDetails.checkIn_date.toLocaleDateString();
        const checkOutDate = orderDetails.checkOut_date.toLocaleDateString();
        const html = htmlTemplate
          .replace(/{propertyName}/g, propertyName)
          .replace(/{checkInDate}/g, checkInDate)
          .replace(/{checkOutDate}/g, checkOutDate)
          .replace(/{roomType}/g, roomType);

        transporter.sendMail({
          from: 'atcasaco@gmail.com',
          to: userEmail,
          subject: 'Booking Confirmation',
          html,
        });
      }
      responseData = transaction;
    } else if (
      transactionStatus == 'cancel' ||
      transactionStatus == 'deny' ||
      transactionStatus == 'expire'
    ) {
      const transaction = await prisma.order.update({
        where: { id: order_id },
        data: {
          payment_date: moment.tz('Asia/Jakarta').format(),
          status: 'cancelled',
          updatedAt: new Date(),
          payment_method: paymentMethod,
        },
      });
      responseData = transaction;
    } else if (transactionStatus == 'pending') {
      const transaction = await prisma.order.update({
        where: { id: order_id },
        data: {
          payment_date: moment.tz('Asia/Jakarta').format(),
          status: 'pending_payment',
          updatedAt: new Date(),
          payment_method: paymentMethod,
        },
      });
      responseData = transaction;
    }
    if (
      transactionStatus.status === 'settlement' ||
      transactionStatus.status === 'capture'
    ) {
      const order = await prisma.order.findUnique({
        where: { id: order_id },
      });
      if (!order) {
        return console.log('order tidak ditemukan');
      }
      const isDataReviewExist = await prisma.review.findFirst({
        where: {
          order_id: order_id,
          property_id: order.property_id,
        },
      });

      if (!isDataReviewExist) {
        await prisma.review.create({
          data: {
            property_id: order.property_id,
            user_id: order.user_id,
            order_id: order_id,
            review: '',
            rating: 0,
          },
        });
      }
    }
    return {
      status: 'success',
      data: responseData,
    };
  }

  // update transaction status
  async transferNotif(req: Request) {
    console.log('transfernotif');
    const { order_id, status, payment_method } = req.body;
    const transactionDetail = await prisma.order.findUnique({
      where: { id: order_id },
    });
    if (transactionDetail) {
      this.updateStatusBasedOnMidtransResponse(
        transactionDetail.id,
        req.body,
      ).then((result) => console.log('transaction notif midtrans', result));
    }
  }
}

export default new ReservationService();

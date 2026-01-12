import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // Configure properly in production
  },
  namespace: '/payment',
})
export class PaymentGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  // Track connected clients by orderCode
  private orderSubscriptions: Map<string, Set<string>> = new Map();

  handleConnection(client: Socket) {
    console.log(`🔌 Client connected: ${client.id}`);

    // Client subscribes to an orderCode
    client.on('subscribe', (payload: any) => {
      const orderCode =
        typeof payload === 'string' ? payload : (payload?.orderCode as string);
      if (!orderCode) return;

      console.log(`📝 Client ${client.id} subscribed to order: ${orderCode}`);
      client.join(`order:${orderCode}`);

      // Track subscription
      if (!this.orderSubscriptions.has(orderCode)) {
        this.orderSubscriptions.set(orderCode, new Set());
      }
      this.orderSubscriptions.get(orderCode).add(client.id);
    });

    // Client unsubscribes from an orderCode
    client.on('unsubscribe', (payload: any) => {
      const orderCode =
        typeof payload === 'string' ? payload : (payload?.orderCode as string);
      if (!orderCode) return;

      console.log(
        `📝 Client ${client.id} unsubscribed from order: ${orderCode}`,
      );
      client.leave(`order:${orderCode}`);
      this.orderSubscriptions.get(orderCode)?.delete(client.id);
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`🔌 Client disconnected: ${client.id}`);

    // Clean up subscriptions
    this.orderSubscriptions.forEach((clients, orderCode) => {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.orderSubscriptions.delete(orderCode);
      }
    });
  }

  /**
   * Emit payment confirmation event to all clients subscribed to an orderCode
   */
  notifyPaymentSuccess(orderCode: string, data: any) {
    console.log(`📢 Emitting payment success for order: ${orderCode}`);
    this.server.to(`order:${orderCode}`).emit('paymentSuccess', {
      orderCode,
      status: 'paid',
      message: 'Payment confirmed successfully',
      ...data,
    });
  }

  /**
   * Emit payment failed event
   */
  notifyPaymentFailed(orderCode: string, error: string) {
    console.log(`📢 Emitting payment failed for order: ${orderCode}`);
    this.server.to(`order:${orderCode}`).emit('paymentFailed', {
      orderCode,
      status: 'failed',
      error,
    });
  }
}

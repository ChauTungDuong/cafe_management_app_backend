import { OrderEntity } from 'src/database/entity/order.entity';
import { Order } from './order.domain';

export class OrderMapper {
  static toDomain(entity: OrderEntity): Order {
    if (!entity) {
      return null;
    }
    const domain = new Order();
    domain.id = entity.id;
    domain.totalAmount = entity.totalAmount;
    domain.ingredientCost = (entity as any).ingredientCost;
    domain.status = entity.status;
    domain.orderCode = entity.orderCode;
    if (entity.createdBy) {
      domain.createdBy = {
        id: entity.createdBy.id,
        name: entity.createdBy.name,
        email: entity.createdBy.email,
      };
    }
    if (entity.taxesAndDiscounts) {
      domain.taxesAndDiscounts = entity.taxesAndDiscounts.map((td) => ({
        id: td.id,
        percent: td.percent,
        name: td.name,
        description: td.description,
        type: td.type,
      }));
    }
    if (entity.table) {
      domain.table = {
        id: entity.table.id,
        name: entity.table.name,
        seat: entity.table.seat,
        status: entity.table.status,
      };
    }
    if (entity.orderItems) {
      domain.orderItems = entity.orderItems.map((item) => ({
        id: item.id,
        amount: item.amount,
        item: {
          id: item.item.id,
          name: item.item.name,
          price: item.item.price,
          status: item.item.status,
        },
      }));
    }

    if (entity.payments) {
      domain.payments = entity.payments.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        method: payment.method,
        qrCode: payment.qrCode,
        createdAt: payment.createdAt,
      }));
    }

    domain.createdAt = entity.createdAt;
    return domain;
  }

  static toEntity(domain: Order): OrderEntity {
    if (!domain) {
      return null;
    }
    const entity = new OrderEntity();
    if (domain.id && typeof domain.id === 'string') {
      entity.id = domain.id;
    }
    entity.status = domain.status;
    entity.orderCode = domain.orderCode;
    // others is set in repository
    return entity;
  }
}

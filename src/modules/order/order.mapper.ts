import { OrderEntity } from 'src/database/entity/order.entity';
import { Order } from './order.domain';
import { OrderItemEntity } from 'src/database/entity/order_item.entity';

export class OrderMapper {
  static toDomain(entity: OrderEntity): Order {
    if (!entity) {
      return null;
    }
    const domain = new Order();
    domain.id = entity.id;
    domain.totalAmount = entity.totalAmount;
    domain.status = entity.status;
    domain.discount = entity.discount;
    domain.orderCode = entity.orderCode;
    if (entity.createdBy) {
      domain.createdBy = {
        id: entity.createdBy.id,
        name: entity.createdBy.name,
        email: entity.createdBy.email,
      };
    }
    if (entity.tax) {
      domain.tax = {
        id: entity.tax.id,
        percent: entity.tax.percent,
        name: entity.tax.name,
        description: entity.tax.description,
      };
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
          amountLeft: item.item.amountLeft,
          status: item.item.status,
        },
      }));

      if (entity.payments) {
        domain.payments = entity.payments.map((payment) => ({
          id: payment.id,
          amount: payment.amount,
          method: payment.method,
        }));
      }
    }
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
    entity.discount = domain.discount;
    entity.orderCode = domain.orderCode;

    // Note: Relationships (createdBy, tax, table, orderItems) should be
    // assigned by Repository/Service layer after fetching actual entities
    // Mapper only handles structure conversion, not data fetching

    return entity;
  }
}

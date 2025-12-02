import { PaymentEntity } from 'src/database/entity/payment.entity';
import { Payment } from './payment.domain';

export class PaymentMapper {
  static toDomain(entity: PaymentEntity): Payment {
    if (!entity) {
      return null;
    }
    const domain = new Payment();
    domain.id = entity.id;
    domain.amount = entity.amount;
    domain.method = entity.method;
    domain.qrCode = entity.qrCode;
    domain.orderCode = entity.order?.orderCode;
    return domain;
  }

  static toEntity(domain: Payment): PaymentEntity {
    if (!domain) {
      return null;
    }
    const entity = new PaymentEntity();
    if (domain.id && typeof domain.id === 'string') {
      entity.id = domain.id;
    }
    entity.amount = domain.amount;
    entity.method = domain.method;
    entity.qrCode = domain.qrCode;
    return entity;
  }
}

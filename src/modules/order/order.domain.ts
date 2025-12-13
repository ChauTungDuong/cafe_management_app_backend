import { Item } from '../item/item.domain';
import { Payment } from '../payment/payment.domain';
import { Table } from '../table/table.domain';
import { Tax } from '../tax/tax.domain';
import { User } from '../users/users.domain';

export class Order {
  id: string;
  totalAmount: number;
  status: OrderStatus;
  orderCode: string;
  createdBy: Partial<User>;
  taxesAndDiscounts?: Partial<Tax>[];
  table: Partial<Table>;
  orderItems: {
    id: string;
    amount: number;
    item: Partial<Item>;
  }[];
  payments: Partial<Payment>[];
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export type OrderStatus = 'pending' | 'paid' | 'cancelled';

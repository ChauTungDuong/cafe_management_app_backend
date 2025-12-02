export class Table {
  id: string;
  name: string;
  seat: number;
  status: 'available' | 'occupied' | 'reserved';
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

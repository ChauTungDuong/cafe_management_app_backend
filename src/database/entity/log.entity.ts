import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('log')
export class LogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  action: string;
}

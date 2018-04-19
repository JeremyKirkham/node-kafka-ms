import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  AfterInsert,
  AfterUpdate
} from "typeorm";
import { ORDER_PUBSUB_TOPIC, pubsub } from '../app';

export const PENDING_STATUS = 'pending';
export const AWAITING_PAYMENT_STATUS = 'awaitingPayment';
export const PAYMENT_SUCCESSFUL_STATUS = 'paymentSuccessful';
export const PAYMENT_FAILED_STATUS = 'paymentFailed';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  uuid: string;

  @Column()
  status: string;

  @AfterInsert()
  publish() {
    pubsub.publish({
      ORDER_PUBSUB_TOPIC,
      orderAdded: {
        uuid: this.uuid,
        status: this.status,
      },
    });
  }
}

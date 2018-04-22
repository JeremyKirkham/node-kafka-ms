import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  AfterInsert,
  AfterUpdate,
} from "typeorm";
import { ORDER_PUBSUB_TOPIC, pubsub } from '../app';
import { STORE_EVENT } from '../consumers';
import { producer } from '../producers';
import { ORDER_TYPE } from '../messages';

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

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @AfterInsert()
  publishAdd() {
    this.graphqlPush("orderAdded");
    try {
      this.status = AWAITING_PAYMENT_STATUS;
      const buff = ORDER_TYPE.toBuffer(this);
      producer.produce(
        STORE_EVENT,
        null,
        buff,
        null,
        Date.now(),
      );
    } catch (e) {
      console.log('Error occurred producing a message');
      console.log(e);
    }
  }

  @AfterUpdate()
  publishUpdate() {
    this.graphqlPush("orderUpdated");
  }

  private graphqlPush(method: string) {
    pubsub.publish({
      ORDER_PUBSUB_TOPIC,
      [method]: this,
    });
  }
}

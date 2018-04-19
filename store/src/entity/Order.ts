import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  AfterInsert,
  AfterUpdate,
} from "typeorm";
import { ORDER_PUBSUB_TOPIC, pubsub } from '../app';
import { STORE_EVENT } from '../consumers';
import { producer } from '../producers';
import { avroType } from '../graphql/schema';

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
  publishAdd() {
    pubsub.publish({
      ORDER_PUBSUB_TOPIC,
      orderAdded: {
        uuid: this.uuid,
        status: this.status,
      },
    });
    try {
      this.status = AWAITING_PAYMENT_STATUS;
      const buff = avroType.toBuffer(this);
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
    pubsub.publish({
      ORDER_PUBSUB_TOPIC,
      orderUpdated: {
        uuid: this.uuid,
        status: this.status,
      },
    });
  }
}

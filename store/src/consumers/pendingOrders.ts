import { createConnection } from "typeorm";
import {
  Order,
  PENDING_STATUS,
  AWAITING_PAYMENT_STATUS
} from "../entity/Order";
import { avroType } from '../graphql/schema';
import { consumer } from './index';

consumer
  .on('data', function(data) {
    console.log('Store Consumer has received data!');
    const decoded = avroType.fromBuffer(data.value);
    if (decoded.status != AWAITING_PAYMENT_STATUS) {
      return;
    }
    createConnection().then(async connection => {
      let order = new Order();
      order.uuid = decoded.uuid;
      order.status = decoded.status;
      let orderRepository = connection.getRepository(Order);
      await orderRepository.save(order);
      await connection.close();
    });
  });

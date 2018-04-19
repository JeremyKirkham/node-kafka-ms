import { createConnection } from "typeorm";
import {
  Order,
  PENDING_STATUS,
  AWAITING_PAYMENT_STATUS
} from "../entity/Order";
import { ORDER_TYPE } from '../messages';
import { consumer } from './index';

consumer
  .on('data', function(data) {
    const decoded = ORDER_TYPE.fromBuffer(data.value);
    if (decoded.status != PENDING_STATUS) {
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

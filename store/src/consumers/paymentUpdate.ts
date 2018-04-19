import { createConnection } from "typeorm";
import {
  Order,
  PAYMENT_SUCCESSFUL_STATUS,
  PAYMENT_FAILED_STATUS,
} from "../entity/Order";
import { ORDER_TYPE } from '../messages';
import { consumer } from './index';

consumer
  .on('data', function(data) {
    const decoded = ORDER_TYPE.fromBuffer(data.value);
    if (decoded.status != PAYMENT_SUCCESSFUL_STATUS && decoded.status != PAYMENT_FAILED_STATUS) {
      return;
    }
    createConnection().then(async connection => {
      let orderRepository = connection.getRepository(Order);
      let order = await orderRepository.findOne({uuid: decoded.uuid});
      order.status = decoded.status;
      await orderRepository.save(order);
      await connection.close();
    });
  });

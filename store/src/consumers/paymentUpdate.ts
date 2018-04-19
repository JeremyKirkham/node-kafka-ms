import { createConnection } from "typeorm";
import {
  Order,
  PAYMENT_SUCCESSFUL_STATUS,
  PAYMENT_FAILED_STATUS,
} from "../entity/Order";
import { avroType } from '../graphql/schema';
import { consumer } from './index';

consumer
  .on('data', function(data) {
    console.log('PaymentUpdate has received data!');
    const decoded = avroType.fromBuffer(data.value);
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

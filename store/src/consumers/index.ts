import * as Kafka from "node-rdkafka";
export const STORE_EVENT = 'storeEvent';
export const PAYMENT_EVENT = 'paymentEvent';
export const consumer = new Kafka.KafkaConsumer({
  'group.id': 'kafka-store',
  'metadata.broker.list': 'kafka:9092',
}, {})
  .on('ready', function() {
    console.log('Store Consumer is ready!');
    consumer.subscribe([STORE_EVENT, PAYMENT_EVENT]);
    consumer.consume();
  });

export * from './pendingOrder';
export * from './paymentUpdate';

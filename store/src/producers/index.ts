import * as Kafka from "node-rdkafka";
export const producer = new Kafka.Producer({
  'metadata.broker.list': 'kafka:9092',
}, {});

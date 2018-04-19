import app from "../app";
import * as Kafka from "node-rdkafka";
import * as avro from "avsc";

const avroType = avro.Type.forSchema({
  type: 'record',
  fields: [
    {name: 'uuid', type: 'string'},
    {name: 'status', type: 'string'}
  ],
});

const producer = new Kafka.Producer({
  'metadata.broker.list': 'kafka:9092',
}, {});
producer.connect({});

const consumer = new Kafka.KafkaConsumer({
  'group.id': 'kafka-payment',
  'metadata.broker.list': 'kafka:9092',
}, {});
consumer.connect({});

enum paymentStatus {
  'paymentFailed',
  'paymentSuccessful',
};

function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function getRandomStatus(): string {
  return paymentStatus[getRandomInt(0, 2)];
}


consumer
  .on('ready', function() {
    console.log('Payment Consumer is ready!');
    consumer.subscribe(['storeEvent']);
    consumer.consume();
  })
  .on('data', function(data) {
    const decoded = avroType.fromBuffer(data.value);
    if (decoded.status != 'awaitingPayment') {
      return;
    }
    decoded.status = getRandomStatus();
    const buff = avroType.toBuffer(decoded);
    setTimeout(function(){
      try {
        producer.produce(
          'paymentEvent',
          null,
          buff,
          null,
          Date.now(),
        );
      } catch (e) {
        console.log('Error occurred producing a message');
        console.log(e);
      }
    }, 5000);
  });

/**
 * Start Express server.
 */
const server = app.listen(app.get("port"), () => {
  console.log(
    "  App is running at http://localhost:%d in %s mode",
    app.get("port"),
    app.get("env")
  );
  console.log("  Press CTRL-C to stop\n");
});

export default server;

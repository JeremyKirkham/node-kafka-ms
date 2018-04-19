import app from "../app";
import * as Kafka from "node-rdkafka";
import * as avro from "avsc";

const avroType2 = avro.Type.forSchema({
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
consumer
  .on('ready', function() {
    console.log('Payment Consumer is ready!');
    consumer.subscribe(['storeEvent']);
    consumer.consume();
  })
  .on('data', function(data) {
    console.log('Payment Consumer has received data!');
    const decoded = avroType2.fromBuffer(data.value);
    if (decoded.status != 'awaitingPayment') {
      return;
    }

    const paymentStatus: string[] = [
      'paymentSuccessful',
      'paymentFailed',
    ];
    decoded.status = paymentStatus[Math.floor(Math.random() * paymentStatus.length)];
    const buff = avroType2.toBuffer(decoded);
    setTimeout(function(){
      try {
        producer.produce(
          'paymentEvent',
          null,
          buff,
          null,
          Date.now(),
        );
        console.log('Payment Producer has produced!');
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

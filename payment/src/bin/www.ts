import app from "../app";
import * as Kafka from "node-rdkafka";

const consumer = new Kafka.KafkaConsumer({
  'group.id': 'kafka',
  'metadata.broker.list': 'kafka:9092',
}, {});
consumer.connect({});
consumer
  .on('ready', function() {
    console.log('Consumer is ready!');
    consumer.subscribe(['storeEvent']);
    consumer.consume();
  })
  .on('data', function(data) {
    console.log('Consumer has received data!');
    console.log(data.value.toString());
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

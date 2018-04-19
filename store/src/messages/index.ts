import * as avro from "avsc";

export const ORDER_TYPE = (avro.Type.forSchema({
  type: 'record',
  fields: [
    {name: 'uuid', type: 'string'},
    {name: 'status', type: 'string'}
  ],
}) as any);

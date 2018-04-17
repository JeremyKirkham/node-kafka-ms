import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  uuid: string;

  @Column()
  status: string;
}

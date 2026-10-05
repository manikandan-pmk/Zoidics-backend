import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("contacts")
export class Contact {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: "varchar",
    length: 120,
  })
  name!: string;

  @Column({
    type: "varchar",
    length: 180,
  })
  email!: string;

  @Column({
    type: "varchar",
    length: 30,
    nullable: true,
  })
  phone!: string | null;

  @Column({
    type: "varchar",
    length: 200,
  })
  subject!: string;

  @Column({
    type: "text",
  })
  message!: string;

  @Column({
    type: "varchar",
    length: 20,
    default: "new",
  })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

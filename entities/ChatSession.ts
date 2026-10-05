import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("chat_sessions")
export class ChatSession {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: "varchar",
    length: 100,
    nullable: true,
  })
  name!: string | null;

  @Column({
    type: "varchar",
    length: 150,
    nullable: true,
  })
  email!: string | null;

  @Column({
    type: "varchar",
    length: 30,
    nullable: true,
  })
  phone!: string | null;

  @Column({
    type: "varchar",
    length: 50,
    nullable: true,
  })
  service!: string | null;

  @Column({
    type: "text",
    nullable: true,
  })
  requirement!: string | null;

  @Column({
    type: "varchar",
    length: 120,
    nullable: true,
  })
  timeline!: string | null;

  @Column({
    type: "varchar",
    length: 120,
    nullable: true,
  })
  budget!: string | null;

  @Column({
    type: "varchar",
    length: 30,
    default: "active",
  })
  status!: "active" | "submitted";

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
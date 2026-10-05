import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

import { ChatSession } from "./ChatSession";

@Entity("chat_messages")
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: "varchar",
    length: 20,
  })
  role!: "user" | "model";

  @Column({
    type: "text",
  })
  message!: string;

  @Column()
  sessionId!: number;

  @ManyToOne(() => ChatSession, {
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "sessionId",
  })
  session!: ChatSession;

  @CreateDateColumn()
  createdAt!: Date;
}
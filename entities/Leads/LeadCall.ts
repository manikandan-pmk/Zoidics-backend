import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Lead } from "./Lead";

@Entity("lead_calls")
export class LeadCall {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int" })
  leadId!: number;

  @ManyToOne(() => Lead, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "leadId" })
  lead!: Lead;

  @Column({ type: "varchar", length: 20 })
  result!:
    | "answered"
    | "no_answer"
    | "busy"
    | "switched_off"
    | "call_back_later";

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @CreateDateColumn()
  calledAt!: Date;
}

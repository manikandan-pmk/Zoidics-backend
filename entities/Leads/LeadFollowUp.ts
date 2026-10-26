import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";

import { Lead } from "./Lead";

export type LeadActivityType = "follow_up" | "meeting";

@Entity("lead_follow_ups")
@Index(["leadId", "scheduledAt"])
@Index(["isCompleted", "reminderSentAt", "scheduledAt"])
export class LeadFollowUp {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int" })
  leadId!: number;

  @ManyToOne(() => Lead, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "leadId" })
  lead!: Lead;

  @Column({
    type: "varchar",
    length: 20,
    default: "follow_up",
  })
  activityType!: LeadActivityType;

  @Column({ type: "datetime" })
  scheduledAt!: Date;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @Column({ type: "boolean", default: false })
  isCompleted!: boolean;

  @Column({ type: "datetime", nullable: true })
  reminderSentAt!: Date | null;

  @Column({ type: "varchar", length: 20, default: "pending" })
  reminderStatus!: "pending" | "sent" | "failed" | "cancelled";

  @Column({ type: "int", default: 0 })
  reminderAttempts!: number;

  @Column({ type: "text", nullable: true })
  reminderError!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

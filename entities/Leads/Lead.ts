
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

import { LeadCampaign } from "./LeadCampaign";
import { LeadCategory } from "./LeadCategory";

@Entity("leads")
@Index(["campaignId", "createdAt"])
@Index(["categoryId", "createdAt"])
export class Lead {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int" })
  campaignId!: number;

  @ManyToOne(() => LeadCampaign, (campaign) => campaign.leads, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "campaignId" })
  campaign!: LeadCampaign;

  @Column({ type: "int", nullable: true })
  categoryId!: number | null;

  @ManyToOne(() => LeadCategory, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "categoryId" })
  category!: LeadCategory | null;

  @Column({ type: "varchar", length: 150 })
  businessName!: string;

  @Column({ type: "varchar", length: 120, nullable: true })
  contactPerson!: string | null;

  @Column({ type: "varchar", length: 30, nullable: true })
  phone!: string | null;

  @Column({ type: "varchar", length: 180, nullable: true })
  email!: string | null;

  @Column({ type: "varchar", length: 180, nullable: true })
  instagram!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  serviceNeeded!: string | null;

  // Separate business address column
  @Column({ type: "varchar", length: 1000, nullable: true })
  address!: string | null;

  // Separate city column
  @Column({ type: "varchar", length: 100, nullable: true })
  city!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  source!: string | null;

  @Column({ type: "varchar", length: 20, default: "new" })
  status!:
    | "new"
    | "contacted"
    | "interested"
    | "follow_up"
    | "converted"
    | "not_interested"
    | "lost";

  @Column({ type: "varchar", length: 20, default: "not_called" })
  lastCallResult!:
    | "not_called"
    | "answered"
    | "no_answer"
    | "busy"
    | "switched_off"
    | "call_back_later";

  @Column({ type: "varchar", length: 10, default: "medium" })
  priority!: "high" | "medium" | "low";

  @Column({ type: "varchar", length: 10, default: "warm" })
  interestLevel!: "hot" | "warm" | "cold";

  // Notes are now reserved for actual notes only
  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @Column({ type: "datetime", nullable: true })
  nextFollowUpAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  lastContactedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

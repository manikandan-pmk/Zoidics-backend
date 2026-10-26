
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Lead } from "./Lead";
import { WhatsAppTemplate } from "./WhatsAppTemplate";

export type WhatsAppMessageStatus =
  | "draft"
  | "ready"
  | "opened"
  | "sent"
  | "failed";

@Entity("lead_whatsapp_messages")
@Index(["leadId", "createdAt"])
export class LeadWhatsAppMessage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int" })
  leadId!: number;

  @ManyToOne(() => Lead, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "leadId" })
  lead!: Lead;

  @Column({ type: "int" })
  templateId!: number;

  @ManyToOne(() => WhatsAppTemplate, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "templateId" })
  template!: WhatsAppTemplate;

  @Column({ type: "text" })
  renderedContent!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  imageUrl!: string | null;

  @Column({ type: "varchar", length: 20, default: "draft" })
  status!: WhatsAppMessageStatus;

  @Column({ type: "datetime", nullable: true })
  openedAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  sentAt!: Date | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}

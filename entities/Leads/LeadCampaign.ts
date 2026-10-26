
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Lead } from "./Lead";

@Entity("lead_campaigns")
export class LeadCampaign {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 150 })
  name!: string;

  @Column({ type: "varchar", length: 100 })
  topic!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  city!: string | null;

  @Column({ type: "date", nullable: true })
  startDate!: string | null;

  @Column({ type: "date", nullable: true })
  endDate!: string | null;

  @Column({ type: "varchar", length: 20, default: "active" })
  status!: "active" | "completed" | "archived";

  @Column({ type: "varchar", length: 255, nullable: true })
  originalFileName!: string | null;

  @OneToMany(() => Lead, (lead) => lead.campaign)
  leads!: Lead[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

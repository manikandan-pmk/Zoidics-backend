
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
import { LeadCategory } from "./LeadCategory";

@Entity("whatsapp_templates")
@Index(["categoryId", "isActive"])
export class WhatsAppTemplate {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int" })
  categoryId!: number;

  @ManyToOne(() => LeadCategory, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "categoryId" })
  category!: LeadCategory;

  @Column({
    type: "varchar",
    length: 150,
    default: "Zoidics Software Solutions",
  })
  companyName!: string;

  @Column({ type: "varchar", length: 150 })
  title!: string;

  @Column({ type: "varchar", length: 100 })
  topic!: string;

  @Column({ type: "varchar", length: 20, default: "English" })
  language!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  imageUrl!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  imagePublicId!: string | null;

  @Column({ type: "varchar", length: 200, nullable: true })
  imageAltText!: string | null;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

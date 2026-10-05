import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("projects")
export class Project {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 150 })
  title!: string;

  @Column({ length: 180, unique: true })
  slug!: string;

  @Column({ length: 100 })
  category!: string;

  @Column({ type: "text" })
  shortDescription!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "json" })
  technologies!: string[];

  @Column({
    type: "varchar",
    length: 500,
    nullable: true,
  })
  imageUrl!: string | null;

  @Column({
    type: "varchar",
    length: 500,
    nullable: true,
  })
  liveUrl!: string | null;

  @Column({ default: false })
  isPublished!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

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

  // Contact enquiry status
  @Column({
    type: "varchar",
    length: 20,
    default: "new",
  })
  status!: "new" | "contacted" | "in_progress" | "resolved" | "closed";

    @Column({
    type: "boolean",
    default: false,
  })
  isDeal!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
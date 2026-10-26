import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("admin_users")
export class Admin {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ unique: true, length: 255 })
  email!: string;

  @Column({ length: 255 })
  password!: string;

  @Column({ default: "admin", length: 50 })
  role!: string;

  @CreateDateColumn()
  created_at!: Date;
}

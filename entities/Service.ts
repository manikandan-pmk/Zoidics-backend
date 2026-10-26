import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("services")
export class Service {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    length: 150,
  })
  name!: string;

  @Column({
    type: "varchar",
    length: 500,
    nullable: true,
  })
  imageUrl!: string | null;

  @Column({
    default: true,
  })
  isPublished!: boolean;

  @Column({
    type: "int",
    default: 0,
  })
  displayOrder!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
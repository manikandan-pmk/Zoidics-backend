import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("testimonials")
export class Testimonial {
  @PrimaryGeneratedColumn()
  id!: number;

  /* =====================================================
     NAME
  ===================================================== */

  @Column({
    type: "varchar",
    length: 150,
  })
  name!: string;

  /* =====================================================
     ROLE
  ===================================================== */

  @Column({
    type: "varchar",
    length: 150,
    nullable: true,
  })
  role!: string | null;

  /* =====================================================
     COMPANY
  ===================================================== */

  @Column({
    type: "varchar",
    length: 150,
    nullable: true,
  })
  company!: string | null;

  /* =====================================================
     MESSAGE
  ===================================================== */

  @Column({
    type: "text",
  })
  message!: string;

  /* =====================================================
     IMAGE
  ===================================================== */

  @Column({
    type: "varchar",
    length: 500,
    nullable: true,
  })
  imageUrl!: string | null;

  /* =====================================================
     PUBLISHED
  ===================================================== */

  @Column({
    type: "boolean",
    default: true,
  })
  isPublished!: boolean;

  /* =====================================================
     DISPLAY ORDER
  ===================================================== */

  @Column({
    type: "int",
    default: 0,
  })
  displayOrder!: number;

  /* =====================================================
     CREATED
  ===================================================== */

  @CreateDateColumn()
  createdAt!: Date;

  /* =====================================================
     UPDATED
  ===================================================== */

  @UpdateDateColumn()
  updatedAt!: Date;
}

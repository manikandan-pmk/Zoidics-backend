import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("blogs")
export class Blog {
  @PrimaryGeneratedColumn()
  id!: number;

  /* =====================================================
     TITLE
  ===================================================== */

  @Column({
    type: "varchar",
    length: 200,
  })
  title!: string;

  /* =====================================================
     SLUG
  ===================================================== */

  @Column({
    type: "varchar",
    length: 220,
    unique: true,
  })
  slug!: string;

  /* =====================================================
     CATEGORY
  ===================================================== */

  @Column({
    type: "varchar",
    length: 100,
  })
  category!: string;

  /* =====================================================
     EXCERPT
  ===================================================== */

  @Column({
    type: "text",
  })
  excerpt!: string;

  /* =====================================================
     CONTENT
  ===================================================== */

  @Column({
    type: "longtext",
  })
  content!: string;

  /* =====================================================
     FEATURED IMAGE
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
    default: false,
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

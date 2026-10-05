import "reflect-metadata";

import { DataSource } from "typeorm";

import { Project } from "../entities/Project";
import { Admin } from "../entities/Admin";
import { Contact } from "../entities/Contact";
import { Service } from "../entities/Service";
import { Testimonial } from "../entities/Testimonial";
import { Blog } from "../entities/Blog";
import { ChatSession } from "../entities/ChatSession";
import { ChatMessage } from "../entities/ChatMessage";

const databaseUrl = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "zoidics_portfolio",
};

export const AppDataSource = new DataSource({
  type: "mysql",

  host: databaseUrl.host,
  port: databaseUrl.port,
  username: databaseUrl.username,
  password: databaseUrl.password,
  database: databaseUrl.database,

  entities: [Project, Admin, Contact, Service, Testimonial, Blog, ChatSession, ChatMessage],
  

  migrations: ["migrations/*.{ts,js}"],

  synchronize: true,

  logging: false,
});

export async function connectDatabase() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  return AppDataSource;
}

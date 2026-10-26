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
import { Lead } from "../entities/Leads/Lead";
import { LeadCall} from "../entities/Leads/LeadCall";
import { LeadCampaign } from "../entities/Leads/LeadCampaign";
import { LeadCategory } from "../entities/Leads/LeadCategory";
import { LeadFollowUp } from "../entities/Leads/LeadFollowUp";
import { LeadWhatsAppMessage } from "../entities/Leads/LeadWhatsAppMessage";
import { WhatsAppTemplate } from "../entities/Leads/WhatsAppTemplate";

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

  entities: [Project, Admin, Contact, Service, Testimonial, Blog, ChatSession, ChatMessage , Lead , LeadCall , LeadCampaign , LeadCategory , LeadFollowUp , LeadWhatsAppMessage , WhatsAppTemplate],
  

  migrations: ["migrations/*.{ts,js}"],

  synchronize: false,

  logging: false,
});

export async function connectDatabase() {
  console.log("Database:", AppDataSource.options.database);
console.log("Synchronize:", AppDataSource.options.synchronize);
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  return AppDataSource;
}

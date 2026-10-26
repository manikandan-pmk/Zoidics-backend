
import { Lead } from "@/entities/Leads/Lead";
import { LeadCall } from "@/entities/Leads/LeadCall";
import { LeadCampaign } from "@/entities/Leads/LeadCampaign";
import { LeadCategory } from "@/entities/Leads/LeadCategory";
import { LeadFollowUp } from "@/entities/Leads/LeadFollowUp";
import { LeadWhatsAppMessage } from "@/entities/Leads/LeadWhatsAppMessage";
import { WhatsAppTemplate } from "@/entities/Leads/WhatsAppTemplate";

import { AppDataSource } from "@/lib/database";

declare global {
  var __dbConnection: typeof AppDataSource | undefined;
}

const connection = globalThis.__dbConnection ?? AppDataSource;

if (!connection.isInitialized) {
  await connection.initialize();
}

globalThis.__dbConnection = connection;

// Lead repositories
export const LeadRepo = connection.getRepository(Lead);
export const LeadCallRepo = connection.getRepository(LeadCall);
export const LeadCampaignRepo = connection.getRepository(LeadCampaign);
export const LeadCategoryRepo = connection.getRepository(LeadCategory);
export const LeadFollowUpRepo = connection.getRepository(LeadFollowUp);
export const LeadWhatsAppMessageRepo =
  connection.getRepository(LeadWhatsAppMessage);
export const WhatsAppTemplateRepo =
  connection.getRepository(WhatsAppTemplate);

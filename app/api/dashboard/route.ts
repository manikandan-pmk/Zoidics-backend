import { NextResponse } from "next/server";

import { AppDataSource } from "@/lib/database";

import { Project } from "@/entities/Project";
import { Service } from "@/entities/Service";
import { Contact } from "@/entities/Contact";
import { Blog } from "@/entities/Blog";
import { ChatSession } from "@/entities/ChatSession";

export async function GET() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const projectRepository =
      AppDataSource.getRepository(Project);

    const serviceRepository =
      AppDataSource.getRepository(Service);

    const contactRepository =
      AppDataSource.getRepository(Contact);

    const blogRepository =
      AppDataSource.getRepository(Blog);

    const chatSessionRepository =
      AppDataSource.getRepository(ChatSession);

    const [
      totalProjects,
      publishedProjects,

      totalServices,
      activeServices,

      totalContacts,
      newContacts,

      totalBlogs,
      publishedBlogs,

      totalChatbotLeads,
      activeChatbotLeads,
    ] = await Promise.all([
      // Projects
      projectRepository.count(),

      projectRepository.count({
        where: {
          isPublished: true,
        },
      }),

      // Services
      serviceRepository.count(),

      serviceRepository.count({
        where: {
          isPublished: true,
        },
      }),

      // Client Enquiries - Contact Us
      contactRepository.count(),

      contactRepository.count({
        where: {
          status: "new",
        },
      }),

      // Blogs
      blogRepository.count(),

      blogRepository.count({
        where: {
          isPublished: true,
        },
      }),

      // ChatBot Leads
      chatSessionRepository.count(),

      chatSessionRepository.count({
        where: {
          status: "active",
        },
      }),
    ]);

    // Recent projects
    const recentProjects =
      await projectRepository.find({
        order: {
          createdAt: "DESC",
        },
        take: 5,
      });

    return NextResponse.json({
      success: true,

      stats: {
        projects: totalProjects,
        publishedProjects,

        services: totalServices,
        activeServices,

        clientEnquiries: totalContacts,
        newClientEnquiries: newContacts,

        blogs: totalBlogs,
        publishedBlogs,

        chatbotLeads: totalChatbotLeads,
        activeChatbotLeads,
      },

      recentProjects: recentProjects.map(
        (project) => ({
          id: project.id,
          title: project.title,
          category: project.category,
          isPublished: project.isPublished,
          createdAt: project.createdAt,
        })
      ),
    });
  } catch (error) {
    console.error(
      "Dashboard API Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load dashboard data",
      },
      {
        status: 500,
      }
    );
  }
}
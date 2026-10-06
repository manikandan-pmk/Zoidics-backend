import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

import { connectDatabase } from "../../../lib/database";
import { Contact } from "../../../entities/Contact";

import {
  sendCompanyContactEmail,
  sendClientContactEmail,
} from "../../../lib/mailer";

/* =========================================================
   CORS
========================================================= */

const FRONTEND_URL = process.env.FRONTEND_URL || "https://zoidics.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": FRONTEND_URL,
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/* =========================================================
   OPTIONS - CORS PREFLIGHT
========================================================= */

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/* =========================================================
   POST - CREATE CONTACT
   PUBLIC API
========================================================= */

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const phone = body.phone?.trim() || null;
    const subject = body.subject?.trim();
    const message = body.message?.trim();

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, email, subject and message are required.",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    /* =====================================================
       EMAIL VALIDATION
    ===================================================== */

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid email address.",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    /* =====================================================
       DATABASE
    ===================================================== */

    const database = await connectDatabase();

    const contactRepository = database.getRepository(Contact);

    /* =====================================================
       CREATE CONTACT
    ===================================================== */

    const contact = contactRepository.create({
      name,
      email,
      phone,
      subject,
      message,
      status: "new",
    });

    /* =====================================================
       SAVE CONTACT
    ===================================================== */

    await contactRepository.save(contact);

    console.log("Contact saved successfully:", contact.id);

    /* =====================================================
       EMAIL STATUS
    ===================================================== */

    let companyEmailSent = false;
    let clientEmailSent = false;

    /* =====================================================
       SEND EMAIL TO COMPANY
    ===================================================== */

    try {
      await sendCompanyContactEmail({
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        subject: contact.subject,
        message: contact.message,
      });

      companyEmailSent = true;

      console.log("Company notification email sent successfully.");
    } catch (error) {
      console.error("Company notification email failed:", error);
    }

    /* =====================================================
       SEND CONFIRMATION EMAIL TO CLIENT
    ===================================================== */

    try {
      await sendClientContactEmail({
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        subject: contact.subject,
        message: contact.message,
      });

      clientEmailSent = true;

      console.log("Client confirmation email sent successfully.");
    } catch (error) {
      console.error("Client confirmation email failed:", error);
    }

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json(
      {
        success: true,
        message: "Thank you for contacting Zoidics Software Solutions.",

        contactId: contact.id,

        email: {
          company: companyEmailSent,
          client: clientEmailSent,
        },
      },
      {
        status: 201,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error("CONTACT SUBMISSION ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to submit your enquiry. Please try again.",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}

/* =========================================================
   PUT - UPDATE CONTACT
   ADMIN ONLY
========================================================= */

export async function PUT(request: NextRequest) {
  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET is not configured");

      return NextResponse.json(
        {
          success: false,
          message: "Server authentication configuration error.",
        },
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }

    const JWT_SECRET = new TextEncoder().encode(secret);
    const token = request.cookies.get("jwt")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401, headers: corsHeaders },
      );
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (payload.role !== "admin" || payload.isAdmin !== true) {
      return NextResponse.json(
        { success: false, message: "Admin access required." },
        { status: 403, headers: corsHeaders },
      );
    }

    const body = await request.json();
    const id = Number(body.id);
    const status = body.status;
    const isDeal = body.isDeal;

    const allowedStatuses = [
      "new",
      "contacted",
      "in_progress",
      "resolved",
      "closed",
    ];

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { success: false, message: "Valid contact ID is required." },
        { status: 400, headers: corsHeaders },
      );
    }

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid contact status." },
        { status: 400, headers: corsHeaders },
      );
    }

    if (typeof isDeal !== "boolean") {
      return NextResponse.json(
        { success: false, message: "Deal value must be true or false." },
        { status: 400, headers: corsHeaders },
      );
    }

    const database = await connectDatabase();
    const contactRepository = database.getRepository(Contact);

    const contact = await contactRepository.findOne({
      where: { id },
    });

    if (!contact) {
      return NextResponse.json(
        { success: false, message: "Contact enquiry not found." },
        { status: 404, headers: corsHeaders },
      );
    }

    contact.status = status;
    contact.isDeal = isDeal;

    const updatedContact = await contactRepository.save(contact);

    console.log("Contact updated successfully:", updatedContact.id);

    return NextResponse.json(
      {
        success: true,
        message: "Contact enquiry updated successfully.",
        contact: updatedContact,
      },
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error("UPDATE CONTACT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update contact enquiry.",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}

/* =========================================================
   GET - GET ALL CONTACTS
   ADMIN ONLY
========================================================= */

export async function GET(request: NextRequest) {
  try {
    /* =====================================================
       JWT SECRET
    ===================================================== */

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET is not configured");

      return NextResponse.json(
        {
          success: false,
          message: "Server authentication configuration error.",
        },
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }

    const JWT_SECRET = new TextEncoder().encode(secret);

    /* =====================================================
       GET JWT FROM COOKIE
    ===================================================== */

    const token = request.cookies.get("jwt")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        {
          status: 401,
          headers: corsHeaders,
        },
      );
    }

    /* =====================================================
       VERIFY JWT
    ===================================================== */

    const { payload } = await jwtVerify(token, JWT_SECRET);

    /* =====================================================
       CHECK ADMIN ROLE
    ===================================================== */

    if (payload.role !== "admin" || payload.isAdmin !== true) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required.",
        },
        {
          status: 403,
          headers: corsHeaders,
        },
      );
    }

    /* =====================================================
       DATABASE
    ===================================================== */

    const database = await connectDatabase();

    const contactRepository = database.getRepository(Contact);

    /* =====================================================
       GET CONTACTS
    ===================================================== */

    const contacts = await contactRepository.find({
      order: {
        createdAt: "DESC",
      },
    });

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json(
      {
        success: true,
        count: contacts.length,
        contacts,
      },
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error("GET CONTACTS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load contact enquiries.",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}

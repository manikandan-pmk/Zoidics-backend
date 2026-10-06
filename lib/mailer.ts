import nodemailer from "nodemailer";
import path from "path";

/* =========================================================
   ENVIRONMENT
========================================================= */

const gmailUser = process.env.GMAIL_USER;
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

if (!gmailUser || !gmailAppPassword) {
  throw new Error("Gmail environment variables are missing");
}

/* =========================================================
   GMAIL TRANSPORTER
========================================================= */

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: gmailUser,
    pass: gmailAppPassword,
  },

  /*
   * Local development workaround for the
   * self-signed certificate problem.
   *
   * Remove this in production once the
   * certificate issue is properly resolved.
   */
  tls: {
    rejectUnauthorized: false,
  },
});

/* =========================================================
   ZOIDICS LOGO
========================================================= */

const logoPath = path.join(process.cwd(), "public", "logo1.png");

/* =========================================================
   TYPES
========================================================= */

type ContactEmailData = {
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
};

/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================
   COMMON EMAIL STYLES
========================================================= */

const emailStyles = `
  body {
    margin: 0;
    padding: 0;
    background: #f5f5f5;
    font-family: Arial, Helvetica, sans-serif;
    color: #111111;
  }

  .wrapper {
    width: 100%;
    padding: 40px 16px;
    background: #f5f5f5;
    box-sizing: border-box;
  }

  .container {
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    background: #ffffff;
    border: 1px solid #e8e8e8;
    border-radius: 18px;
    overflow: hidden;
  }

  .header {
    padding: 34px 32px 30px;
    border-bottom: 1px solid #eeeeee;
    background: #ffffff;
    text-align: center;
  }

  .logo {
    display: inline-block;
    width: 220px;
    max-width: 80%;
    height: auto;
  }

  .content {
    padding: 36px 32px;
  }

  .eyebrow {
    margin: 0 0 10px;
    color: #ff7a18;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1.8px;
    text-transform: uppercase;
  }

  .title {
    margin: 0;
    color: #111111;
    font-size: 28px;
    line-height: 1.25;
    font-weight: 700;
  }

  .text {
    margin: 18px 0 0;
    color: #5f6368;
    font-size: 15px;
    line-height: 1.7;
  }

  .details {
    margin-top: 28px;
    border: 1px solid #eeeeee;
    border-radius: 14px;
    overflow: hidden;
  }

  .detail-row {
    padding: 16px 18px;
    border-bottom: 1px solid #eeeeee;
  }

  .detail-row:last-child {
    border-bottom: 0;
  }

  .label {
    margin: 0 0 6px;
    color: #8a8f98;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .value {
    margin: 0;
    color: #171717;
    font-size: 15px;
    line-height: 1.5;
    word-break: break-word;
  }

  .message-box {
    margin-top: 28px;
    padding: 20px;
    background: #fafafa;
    border: 1px solid #eeeeee;
    border-radius: 14px;
  }

  .message {
    margin: 0;
    color: #333333;
    font-size: 15px;
    line-height: 1.7;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .button {
    display: inline-block;
    margin-top: 24px;
    padding: 12px 20px;
    background: #111111;
    color: #ffffff !important;
    text-decoration: none;
    border-radius: 9px;
    font-size: 14px;
    font-weight: 700;
  }

  .about-section {
    margin-top: 30px;
    padding-top: 24px;
    border-top: 1px solid #eeeeee;
  }

  .about-title {
    margin: 0 0 10px;
    color: #111111;
    font-size: 15px;
    font-weight: 700;
  }

  .about-text {
    margin: 0;
    color: #5f6368;
    font-size: 14px;
    line-height: 1.7;
  }

  .footer {
    padding: 24px 32px;
    border-top: 1px solid #eeeeee;
    background: #fafafa;
  }

  .footer-text {
    margin: 0;
    color: #8a8f98;
    font-size: 12px;
    line-height: 1.6;
  }

  .footer-brand {
    margin: 6px 0 0;
    color: #111111;
    font-size: 13px;
    font-weight: 700;
  }

  @media only screen and (max-width: 600px) {

    .wrapper {
      padding: 20px 10px;
    }

    .header {
      padding: 28px 22px 24px;
    }

    .logo {
      width: 190px;
    }

    .content {
      padding: 28px 22px;
    }

    .footer {
      padding: 22px;
    }

    .title {
      font-size: 24px;
    }
  }
`;

/* =========================================================
   COMPANY EMAIL
   ZOIDICS RECEIVES THE ENQUIRY
========================================================= */

export async function sendCompanyContactEmail(data: ContactEmailData) {
  const safeName = escapeHtml(data.name);
  const safeEmail = escapeHtml(data.email);
  const safePhone = escapeHtml(data.phone || "Not provided");
  const safeSubject = escapeHtml(data.subject);
  const safeMessage = escapeHtml(data.message);

  await transporter.sendMail({
    from: `"Zoidics Website" <${gmailUser}>`,

    to: gmailUser,

    replyTo: data.email,

    subject: `New Website Enquiry — ${data.name}`,

    attachments: [
  {
    path: logoPath,
    cid: "zoidics-logo",
    contentDisposition: "inline",
  },
],

    html: `
      <!DOCTYPE html>

      <html>

        <head>

          <meta charset="UTF-8" />

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />

          <style>
            ${emailStyles}
          </style>

        </head>

        <body>

          <div class="wrapper">

            <div class="container">

              <!-- HEADER -->

              <div class="header">

                <img
                  src="cid:zoidics-logo"
                  alt="Zoidics Software Solutions"
                  class="logo"
                />

              </div>


              <!-- CONTENT -->

              <div class="content">

                <p class="eyebrow">
                  New Website Enquiry
                </p>

                <h1 class="title">
                  New enquiry received
                </h1>

                <p class="text">
                  A visitor has submitted a new enquiry
                  through the Zoidics website.
                </p>


                <!-- CONTACT DETAILS -->

                <div class="details">

                  <div class="detail-row">

                    <p class="label">
                      Name
                    </p>

                    <p class="value">
                      ${safeName}
                    </p>

                  </div>


                  <div class="detail-row">

                    <p class="label">
                      Email
                    </p>

                    <p class="value">
                      ${safeEmail}
                    </p>

                  </div>


                  <div class="detail-row">

                    <p class="label">
                      Phone
                    </p>

                    <p class="value">
                      ${safePhone}
                    </p>

                  </div>


                  <div class="detail-row">

                    <p class="label">
                      Subject
                    </p>

                    <p class="value">
                      ${safeSubject}
                    </p>

                  </div>

                </div>


                <!-- MESSAGE -->

                <div class="message-box">

                  <p class="label">
                    Message
                  </p>

                  <p class="message">
                    ${safeMessage}
                  </p>

                </div>


                <!-- REPLY BUTTON -->

                <a
                  href="mailto:${safeEmail}"
                  class="button"
                >
                  Reply to ${safeName}
                </a>

              </div>


              <!-- FOOTER -->

              <div class="footer">

                <p class="footer-text">
                  This enquiry was submitted through
                  the official Zoidics website.
                </p>

                <p class="footer-brand">
                  Zoidics Software Solutions
                </p>

              </div>

            </div>

          </div>

        </body>

      </html>
    `,
  });
}

/* =========================================================
   CLIENT EMAIL
   CLIENT RECEIVES CONFIRMATION
========================================================= */

export async function sendClientContactEmail(data: ContactEmailData) {
  const safeName = escapeHtml(data.name);
  const safeSubject = escapeHtml(data.subject);

  await transporter.sendMail({
    from: `"Zoidics Software Solutions" <${gmailUser}>`,

    to: data.email,

    subject: "We received your enquiry — Zoidics Software Solutions",

    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />

          <style>
            ${emailStyles}
          </style>
        </head>

        <body>
          <div class="wrapper">
            <div class="container">

              <!-- ZOIDICS HEADER -->
              <div class="header">
                <img
                  src="https://zoidics.com/logo1.png"
                  alt="Zoidics Software Solutions"
                  class="logo"
                />
              </div>

              <!-- MAIN CONTENT -->
              <div class="content">

                <p class="eyebrow">
                  Thank You
                </p>

                <h1 class="title">
                  We received your enquiry
                </h1>

                <p class="text">
                  Hi ${safeName},
                </p>

                <p class="text">
                  Thank you for reaching out to
                  <strong>Zoidics Software Solutions</strong>.
                  We have successfully received your enquiry.
                </p>

                <p class="text">
                  Our team will review your requirements
                  and get back to you as soon as possible.
                </p>

                <!-- ENQUIRY SUBJECT -->
                <div class="details">
                  <div class="detail-row">
                    <p class="label">
                      Enquiry Subject
                    </p>

                    <p class="value">
                      ${safeSubject}
                    </p>
                  </div>
                </div>

                <!-- ABOUT ZOIDICS -->
                <div class="about-section">
                  <p class="about-title">
                    About Zoidics
                  </p>

                  <p class="about-text">
                    Zoidics is a Chennai-based software
                    development team helping businesses,
                    startups, and individuals turn ideas
                    into modern digital products.
                  </p>
                </div>

                <!-- SERVICES -->
                <p class="text">
                  We specialize in Web Development,
                  Mobile App Development, AI Integration,
                  AI Chatbots, Business Automation, SEO,
                  API Integration, and Custom Software Solutions.
                </p>

              </div>

              <!-- FOOTER -->
              <div class="footer">
                <p class="footer-text">
                  From idea → design → development → deployment,
                  we're here to help turn your digital vision
                  into reality.
                </p>

                <p class="footer-brand">
                  Zoidics Software Solutions
                </p>
              </div>

            </div>
          </div>
        </body>
      </html>
    `,
  });
}

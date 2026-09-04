import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  secure: true,
  pool: true,
  maxConnections: 5, // how many parallel connections
  maxMessages: 100, // max messages per connection before recycling
  rateDelta: 2000, // time window in ms for rate limit
  rateLimit: 5, // max 5 emails per 2 seconds
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmailReport = async (report, month, year, recipientEmail) => {
  const attendanceStatus =
    report.attendancePercentage >= 75
      ? {
          color: "#10b981",
          icon: "✓",
          message: "Excellent Attendance!",
          description:
            "Keep up the great work. Your consistent presence is helping you succeed.",
        }
      : {
          color: "#ef4444",
          icon: "⚠",
          message: "Attendance Improvement Needed",
          description:
            "Your attendance is below the required threshold. Please ensure regular attendance to avoid academic consequences.",
        };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const mailOptions = {
    from: `"Attendance System" <${process.env.SMTP_USER}>`,
    to: recipientEmail,
    subject: `📊 Monthly Attendance Report – ${monthNames[month]} ${year}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
          <tr>
            <td align="center">
              <!-- Main Container -->
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                      Monthly Attendance Report
                    </h1>
                    <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">
                      ${monthNames[month]} ${year}
                    </p>
                  </td>
                </tr>

                <!-- Greeting -->
                <tr>
                  <td style="padding: 30px 30px 20px 30px;">
                    <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 22px;">
                      Hi ${report.studentName},
                    </h2>
                    <p style="color: #6b7280; margin: 0; font-size: 15px; line-height: 1.6;">
                      Here's your attendance summary for this month. Review your statistics below.
                    </p>
                  </td>
                </tr>

                <!-- Statistics Cards -->
                <tr>
                  <td style="padding: 0 30px 20px 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <!-- Present Days -->
                        <td width=28%" style="background-color: #ecfdf5; border-radius: 8px; padding: 20px; vertical-align: top;">
                          <div style="color: #059669; font-size: 32px; font-weight: 700; margin-bottom: 5px;">
                            ${report.presentDays}
                          </div>
                          <div style="color: #047857; font-size: 14px; font-weight: 500;">
                            Present Days
                          </div>
                        </td>
                        <td width="4%"></td>
                        <!-- Absent Days -->
                        <td width="28%" style="background-color: #fef2f2; border-radius: 8px; padding: 20px; vertical-align: top;">
                          <div style="color: #dc2626; font-size: 32px; font-weight: 700; margin-bottom: 5px;">
                            ${report.absentDays}
                          </div>
                          <div style="color: #b91c1c; font-size: 14px; font-weight: 500;">
                            Absent Days
                          </div>
                        </td>
                        <!-- Leave Days -->
                        <td width="28%" style="background-color: #fefce8; border-radius: 8px; padding: 20px; vertical-align: top;">
                          <div style="color: #ca8a04; font-size: 32px; font-weight: 700; margin-bottom: 5px;">
                            ${report.leaveDays}
                          </div>
                          <div style="color: #a16207; font-size: 14px; font-weight: 500;">
                            Leave Days
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Total Days & Percentage -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                      <tr>
                        <td width="50%" style="padding-right: 10px;">
                          <div style="color: #6b7280; font-size: 13px; margin-bottom: 5px;">Total Days</div>
                          <div style="color: #1f2937; font-size: 24px; font-weight: 600;">${report.totalDays}</div>
                        </td>
                        <td width="50%" style="border-left: 2px solid #e5e7eb; padding-left: 20px;">
                          <div style="color: #6b7280; font-size: 13px; margin-bottom: 5px;">Attendance Rate</div>
                          <div style="color: ${attendanceStatus.color}; font-size: 24px; font-weight: 700;">
                            ${report.attendancePercentage}%
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Status Message -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${attendanceStatus.color}15; border-left: 4px solid ${attendanceStatus.color}; border-radius: 8px; padding: 20px;">
                      <tr>
                        <td>
                          <div style="color: ${attendanceStatus.color}; font-size: 18px; font-weight: 600; margin-bottom: 8px;">
                            ${attendanceStatus.icon} ${attendanceStatus.message}
                          </div>
                          <div style="color: #374151; font-size: 14px; line-height: 1.6;">
                            ${attendanceStatus.description}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 25px 30px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 13px; margin: 0 0 10px 0; line-height: 1.6;">
                      This is an automated message. If you have any questions or concerns about your attendance, please contact your instructor or administration office.
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                      © ${year} Attendance Management System. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.response);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("❌ Error sending email:", err);
    throw new Error(`Failed to send email: ${err.message}`);
  }
};

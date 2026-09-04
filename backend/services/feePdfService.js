import PDFDocument from "pdfkit";

/**
 * Generates a PDF stream for a Fee Voucher / Payment Receipt
 */
export const generateFeeVoucherPDF = (voucher, campus, studentInfo) => {
  const doc = new PDFDocument({ margin: 40, size: "A4" });

  // Styling palette
  const primaryColor = "#1e40af"; // Deep blue
  const secondaryColor = "#475569"; // Slate gray
  const darkTextColor = "#0f172a";
  const lightBgColor = "#f8fafc";
  const accentBorderColor = "#e2e8f0";

  // Status Badge Colors
  let badgeColor = "#64748b"; // default slate
  const upperStatus = (voucher.status || "pending").toUpperCase();
  if (upperStatus === "PAID") badgeColor = "#16a34a"; // Green
  else if (upperStatus === "PARTIALLY_PAID") badgeColor = "#d97706"; // Amber
  else if (upperStatus === "OVERDUE") badgeColor = "#dc2626"; // Red
  else if (upperStatus === "PENDING") badgeColor = "#2563eb"; // Blue

  // Header Banner
  doc
    .rect(40, 40, 515, 60)
    .fill(primaryColor);

  doc
    .fillColor("#ffffff")
    .fontSize(22)
    .font("Helvetica-Bold")
    .text("SchoolSync", 55, 52);

  doc
    .fontSize(10)
    .font("Helvetica")
    .text("OFFICIAL FEE VOUCHER & PAYMENT RECEIPT", 55, 78);

  doc
    .fillColor("#ffffff")
    .fontSize(14)
    .font("Helvetica-Bold")
    .text(upperStatus.replace("_", " "), 420, 62, { align: "right" });

  // Campus Info Section
  doc
    .fillColor(darkTextColor)
    .fontSize(12)
    .font("Helvetica-Bold")
    .text(campus?.name || "School Campus", 40, 115);

  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor(secondaryColor)
    .text(`Address: ${campus?.address || "N/A"}, ${campus?.city || ""}`, 40, 130)
    .text(`Contact Phone: ${campus?.contact?.phone || "N/A"} | Email: ${campus?.contact?.email || "N/A"}`, 40, 143);

  // Line separator
  doc
    .moveTo(40, 160)
    .lineTo(555, 160)
    .strokeColor(accentBorderColor)
    .stroke();

  // Two Column Voucher Details Box
  // Left Box: Student Information
  doc
    .rect(40, 170, 250, 95)
    .fillAndStroke(lightBgColor, accentBorderColor);

  doc
    .fillColor(primaryColor)
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("STUDENT INFORMATION", 50, 178);

  doc
    .fillColor(darkTextColor)
    .fontSize(9)
    .font("Helvetica-Bold")
    .text(`Name: `, 50, 195)
    .font("Helvetica")
    .text(`${studentInfo?.name || voucher.student?.name || "N/A"}`, 95, 195);

  doc
    .font("Helvetica-Bold")
    .text(`Roll Number: `, 50, 210)
    .font("Helvetica")
    .text(`${studentInfo?.rollNumber || "N/A"}`, 115, 210);

  doc
    .font("Helvetica-Bold")
    .text(`Class: `, 50, 225)
    .font("Helvetica")
    .text(`${studentInfo?.className || voucher.class?.className || "N/A"}`, 85, 225);

  doc
    .font("Helvetica-Bold")
    .text(`Email: `, 50, 240)
    .font("Helvetica")
    .text(`${voucher.student?.email || "N/A"}`, 85, 240);

  // Right Box: Voucher Details
  doc
    .rect(305, 170, 250, 95)
    .fillAndStroke(lightBgColor, accentBorderColor);

  doc
    .fillColor(primaryColor)
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("VOUCHER DETAILS", 315, 178);

  doc
    .fillColor(darkTextColor)
    .fontSize(9)
    .font("Helvetica-Bold")
    .text(`Voucher No: `, 315, 195)
    .font("Helvetica")
    .text(`${voucher.voucherNumber}`, 380, 195);

  doc
    .font("Helvetica-Bold")
    .text(`Issue Date: `, 315, 210)
    .font("Helvetica")
    .text(`${new Date(voucher.issueDate).toLocaleDateString()}`, 375, 210);

  doc
    .font("Helvetica-Bold")
    .text(`Due Date: `, 315, 225)
    .font("Helvetica")
    .text(`${new Date(voucher.dueDate).toLocaleDateString()}`, 365, 225);

  doc
    .font("Helvetica-Bold")
    .text(`Fee Type: `, 315, 240)
    .font("Helvetica")
    .text(`${(voucher.feeType || "tuition").toUpperCase()}`, 365, 240);

  // Fee Details Table
  doc
    .rect(40, 280, 515, 25)
    .fill(primaryColor);

  doc
    .fillColor("#ffffff")
    .fontSize(9)
    .font("Helvetica-Bold")
    .text("DESCRIPTION / TITLE", 50, 288)
    .text("TYPE", 300, 288)
    .text("AMOUNT (PKR)", 450, 288, { align: "right" });

  doc
    .rect(40, 305, 515, 30)
    .fillAndStroke("#ffffff", accentBorderColor);

  doc
    .fillColor(darkTextColor)
    .fontSize(9)
    .font("Helvetica")
    .text(voucher.title || "Tuition Fee", 50, 314)
    .text((voucher.feeType || "tuition").toUpperCase(), 300, 314)
    .font("Helvetica-Bold")
    .text(`PKR ${voucher.totalAmount.toLocaleString()}`, 450, 314, { align: "right" });

  // Summary Table (Total, Paid, Remaining)
  const summaryY = 350;

  doc
    .rect(305, summaryY, 250, 75)
    .fillAndStroke(lightBgColor, accentBorderColor);

  doc
    .fillColor(darkTextColor)
    .fontSize(9)
    .font("Helvetica")
    .text("Total Fee Amount:", 315, summaryY + 12)
    .font("Helvetica-Bold")
    .text(`PKR ${voucher.totalAmount.toLocaleString()}`, 450, summaryY + 12, { align: "right" });

  doc
    .font("Helvetica")
    .text("Amount Paid:", 315, summaryY + 30)
    .font("Helvetica-Bold")
    .fillColor("#16a34a")
    .text(`PKR ${voucher.paidAmount.toLocaleString()}`, 450, summaryY + 30, { align: "right" });

  doc
    .fillColor(darkTextColor)
    .font("Helvetica-Bold")
    .text("Remaining Balance:", 315, summaryY + 50)
    .fillColor(voucher.remainingBalance > 0 ? "#dc2626" : "#16a34a")
    .fontSize(10)
    .text(`PKR ${voucher.remainingBalance.toLocaleString()}`, 450, summaryY + 50, { align: "right" });

  // Payment History Section
  let currentY = 440;
  doc
    .fillColor(primaryColor)
    .fontSize(11)
    .font("Helvetica-Bold")
    .text("PAYMENT HISTORY", 40, currentY);

  currentY += 15;

  if (voucher.payments && voucher.payments.length > 0) {
    doc
      .rect(40, currentY, 515, 20)
      .fill(secondaryColor);

    doc
      .fillColor("#ffffff")
      .fontSize(8)
      .font("Helvetica-Bold")
      .text("DATE", 50, currentY + 6)
      .text("METHOD", 150, currentY + 6)
      .text("TRANSACTION / REF #", 260, currentY + 6)
      .text("AMOUNT PAID", 450, currentY + 6, { align: "right" });

    currentY += 20;

    voucher.payments.forEach((payment, idx) => {
      doc
        .rect(40, currentY, 515, 20)
        .fillAndStroke(idx % 2 === 0 ? "#ffffff" : lightBgColor, accentBorderColor);

      doc
        .fillColor(darkTextColor)
        .fontSize(8)
        .font("Helvetica")
        .text(new Date(payment.paymentDate).toLocaleDateString(), 50, currentY + 6)
        .text((payment.paymentMethod || "cash").toUpperCase().replace("_", " "), 150, currentY + 6)
        .text(payment.transactionId || "N/A", 260, currentY + 6)
        .font("Helvetica-Bold")
        .text(`PKR ${payment.amount.toLocaleString()}`, 450, currentY + 6, { align: "right" });

      currentY += 20;
    });
  } else {
    doc
      .fontSize(9)
      .font("Helvetica-Oblique")
      .fillColor(secondaryColor)
      .text("No payments recorded yet.", 40, currentY + 5);
    currentY += 25;
  }

  // Footer / Instructions & Signatures
  const footerY = 680;
  doc
    .moveTo(40, footerY)
    .lineTo(555, footerY)
    .strokeColor(accentBorderColor)
    .stroke();

  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor(secondaryColor)
    .text("Notice: Please retain this fee voucher for official institution records.", 40, footerY + 10)
    .text("Generated via SchoolSync Management Platform.", 40, footerY + 22);

  doc
    .moveTo(400, footerY + 45)
    .lineTo(530, footerY + 45)
    .strokeColor(secondaryColor)
    .stroke();

  doc
    .fontSize(8)
    .font("Helvetica-Bold")
    .fillColor(darkTextColor)
    .text("Authorized Signatory", 400, footerY + 50, { align: "center", width: 130 });

  doc.end();
  return doc;
};

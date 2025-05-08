const express = require("express");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const cors = require("cors");
require("dotenv").config();
const OpenAI = require("openai");

const app = express();
const port = 3001;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
app.use(cors());
app.use(express.json());
app.use("/pdfs", express.static(path.join(__dirname, "pdfs")));

app.post("/generate-pdf", async (req, res) => {
  const complaints = req.body.complaints || [];
  const departmentName = req.body.department || "All Departments";

  const total = complaints.length;
  const statusCounts = complaints.reduce((acc, c) => {
    const status = c.Status || "Unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  let summary = "Summary unavailable.";
  try {
    const prompt = `You are an HR and operations analyst. Please provide a structured and insightful summary of the following ${complaints.length} employee complaints. Group the complaints by themes if possible, mention common issues, and provide suggestions or observations.

${complaints.map(c => `Title: ${c.Title}\nDescription: ${c.Description}`).join("\n\n")}`;
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });
    summary = completion.choices[0].message.content;
  } catch (e) {
    console.error("Failed to generate summary", e.message);
  }

  const fileName = `report_${Date.now()}.pdf`;
  const filePath = path.join(__dirname, "pdfs", fileName);
  fs.mkdirSync(path.join(__dirname, "pdfs"), { recursive: true });
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(fs.createWriteStream(filePath));

  // Capgemini logo and title section
  const logoPath = path.join(__dirname, "capgemini-logo.png");
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, doc.page.width / 2 - 50, 20, { width: 100 });
  }

  doc.moveDown(2);
  doc.fontSize(20).text(`Complaint Analytics Report`, { align: "center" });
  doc.fontSize(16).text(`Department: ${departmentName}`, { align: "center" });
  doc.moveDown();
  doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();

  doc.moveDown().fontSize(12).text(`Analytics`, { underline: true }).moveDown(0.5);
  doc.font("Helvetica-Bold").text(`Total Complaints: `, { continued: true }).font("Helvetica").text(`${total}`);
  ["Open", "Resolved", "Escalated", "Duplicate", "Pending", "Submitted"].forEach(status => {
    doc.font("Helvetica-Bold").text(`${status}: `, { continued: true }).font("Helvetica").text(`${statusCounts[status] || 0}`);
  });

  // AI Summary section (move above complaints table)
  doc.moveDown().fontSize(14).text("AI Summary:", { underline: true });
  doc.font("Helvetica-Oblique").fontSize(10).text(summary).moveDown();

  // Table-style complaints list
  doc.moveDown().fontSize(14).text("Complaints Table", { underline: true }).moveDown();

  // Table header box
  const tableTop = doc.y;
  const colWidths = [250, 100, 150];
  const rowHeight = 20;
  const tableCols = ["Title", "Status", "Date"];

  // Draw header background
  doc.rect(doc.page.margins.left, tableTop, colWidths.reduce((a, b) => a + b), rowHeight).fillAndStroke("#e6e6e6", "black");
  doc.fillColor("black").font("Helvetica-Bold").fontSize(10);
  let x = doc.page.margins.left;
  tableCols.forEach((text, i) => {
    doc.text(text, x + 5, tableTop + 5, { width: colWidths[i] - 10 });
    x += colWidths[i];
  });

  let y = tableTop + rowHeight;
  doc.font("Helvetica").fontSize(10);
  complaints.forEach((c, index) => {
    if (y + rowHeight > doc.page.height - doc.page.margins.bottom - 40) {
      doc.addPage();
      y = doc.page.margins.top;

      // Redraw table header on new page
      doc.rect(doc.page.margins.left, y, colWidths.reduce((a, b) => a + b), rowHeight).fillAndStroke("#e6e6e6", "black");
      doc.fillColor("black").font("Helvetica-Bold");
      x = doc.page.margins.left;
      tableCols.forEach((text, i) => {
        doc.text(text, x + 5, y + 5, { width: colWidths[i] - 10 });
        x += colWidths[i];
      });

      y += rowHeight;
      doc.font("Helvetica");
    }

    doc.fillColor("black");
    doc.rect(doc.page.margins.left, y, colWidths.reduce((a, b) => a + b), rowHeight).stroke();

    x = doc.page.margins.left;
    const rowData = [c.Title || "-", c.Status || "-", c.SubmittedOn || "-"];
    rowData.forEach((text, i) => {
      doc.text(text, x + 5, y + 5, { width: colWidths[i] - 10, height: rowHeight });
      x += colWidths[i];
    });
    y += rowHeight;
  });

  doc.moveDown(2);
  doc.font("Helvetica-Oblique").fontSize(8).fillColor("gray")
     .text("© 2025 Capgemini. All rights reserved.", { align: "center" });

  doc.end();

  res.json({ url: `http://localhost:${port}/pdfs/${fileName}` });
});

app.listen(port, () => {
  console.log(`PDF generator listening at http://localhost:${port}`);
});
// Service for sending emails
require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});



// ✅ NEW FUNCTION TO SEND PATIENT SUMMARY
async function sendPatientSummaryEmail(toEmail, patientName, summaryContent) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: 'Your Health Summary from SwiftMedLink',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Health Summary for ${patientName}</h2>
        <p>Dear ${patientName},</p>
        <p>As requested, here is a copy of your latest health summary. Please keep this for your records.</p>
        <div style="background-color: #f9f9f9; border: 1px solid #ddd; padding: 15px; border-radius: 5px;">
          <h3 style="border-bottom: 2px solid #eee; padding-bottom: 10px;">Summary Details</h3>
          <p style="white-space: pre-wrap;">${summaryContent}</p>
        </div>
        <p>If you have any questions, please consult with your doctor.</p>
        <p>Best regards,<br/>The SwiftMedLink Team</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}


module.exports = { 
  sendPatientSummaryEmail // ✅ Export the new function
};
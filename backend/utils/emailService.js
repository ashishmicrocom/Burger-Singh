import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false // Allow self-signed certificates (for development)
    }
  });
};

// Send OTP email
export const sendOTPEmail = async (email, otp) => {
  // Fallback to console logging if SMTP not configured (development mode)
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.log('⚠️  SMTP not configured - Development Mode');
    console.log(`📧 Email to ${email}: Your OTP is ${otp}. Valid for 5 minutes.`);
    console.log('👉 Configure SMTP in .env for production');
    return true;
  }

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Burger Singh" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Burger Singh OTP Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #FF6B35 0%, #FF8E53 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px dashed #FF6B35; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #FF6B35; letter-spacing: 8px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🍔 Burger Singh</h1>
              <p>Employee Onboarding Verification</p>
            </div>
            <div class="content">
              <h2>Email Verification</h2>
              <p>Hello,</p>
              <p>Thank you for applying to join the Burger Singh family! To complete your onboarding, please verify your email address.</p>
              
              <div class="otp-box">
                <p style="margin: 0; color: #666;">Your OTP Code:</p>
                <div class="otp-code">${otp}</div>
              </div>

              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>This OTP is valid for <strong>5 minutes</strong> only</li>
                  <li>Do not share this code with anyone</li>
                  <li>If you didn't request this, please ignore this email</li>
                </ul>
              </div>

              <p>If you have any questions, please contact our HR team.</p>
              <p>Best regards,<br><strong>Burger Singh Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Burger Singh. All rights reserved.</p>
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Your Burger Singh OTP code is: ${otp}. Valid for 5 minutes. Do not share this code with anyone.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    throw new Error('Failed to send email');
  }
};

/**
 * Send approval request email to Field Coach
 * @param {String} fieldCoachEmail - Field Coach email
 * @param {Object} candidateData - Candidate details
 * @param {String} approvalLink - Link for approval
 * @param {String} rejectionLink - Link for rejection
 */
export const sendApprovalRequestEmail = async (fieldCoachEmail, candidateData, approvalLink, rejectionLink) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.log('⚠️  SMTP not configured - Development Mode');
    console.log(`📧 Approval Email to ${fieldCoachEmail}`);
    console.log(`Candidate: ${candidateData.fullName}`);
    console.log(`Store: ${candidateData.storeName}`);
    console.log(`Approve Link: ${approvalLink}`);
    console.log(`Reject Link: ${rejectionLink}`);
    return true;
  }

  try {
    const transporter = createTransporter();
    const formattedDOB = candidateData.dob ? new Date(candidateData.dob).toLocaleDateString('en-IN') : 'N/A';
    const formattedDOJ = candidateData.dateOfJoining ? new Date(candidateData.dateOfJoining).toLocaleDateString('en-IN') : 'N/A';
    
    const mailOptions = {
      from: `"Burger Singh HR" <${process.env.SMTP_USER}>`,
      to: fieldCoachEmail,
      subject: `New Onboarding Application - ${candidateData.fullName} | Burger Singh`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; background: #ffffff; }
            .header { background: linear-gradient(135deg, #FF6B35 0%, #FF8E53 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { margin: 0 0 10px 0; font-size: 28px; }
            .header p { margin: 0; font-size: 16px; opacity: 0.95; }
            .content { background: #f9f9f9; padding: 30px; }
            .footer { background: #f0f0f0; padding: 20px; text-align: center; color: #666; font-size: 12px; border-radius: 0 0 10px 10px; }
            .section { margin: 20px 0; background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .section-title { font-size: 18px; font-weight: bold; color: #FF6B35; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #FF6B35; text-transform: uppercase; }
            .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .detail-item { margin: 10px 0; }
            .detail-label { font-weight: 600; color: #555; font-size: 13px; margin-bottom: 5px; text-transform: uppercase; }
            .detail-value { color: #333; font-size: 15px; font-weight: 500; }
            .full-width { grid-column: 1 / -1; }
            .action-buttons { display: flex; gap: 15px; margin-top: 30px; }
            .btn { display: inline-block; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; text-align: center; width: 45%; }
            .btn-approve { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; }
            .btn-reject { background: linear-gradient(135deg, #f44336 0%, #da190b 100%); color: white; }
            .btn:hover { text-decoration: none; transform: scale(1.02); }
            .info-box { background: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .badge { display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin: 5px; }
            .badge-verified { background: #4CAF50; color: white; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🍔 Burger Singh</h1>
              <p>New Onboarding Application for Review</p>
            </div>
            
            <div class="content">
              <p>Hello Field Coach,</p>
              <p>A new employee onboarding application has been submitted and requires your review and approval.</p>

              <div class="section">
                <div class="section-title">👤 Personal Information</div>
                <div class="detail-grid">
                  <div class="detail-item">
                    <div class="detail-label">Full Name</div>
                    <div class="detail-value"><strong>${candidateData.fullName || 'N/A'}</strong></div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Date of Birth</div>
                    <div class="detail-value">${formattedDOB}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Gender</div>
                    <div class="detail-value">${candidateData.gender || 'N/A'}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Marital Status</div>
                    <div class="detail-value">${candidateData.maritalStatus || 'N/A'}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Blood Group</div>
                    <div class="detail-value">${candidateData.bloodGroup || 'N/A'}</div>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">📧 Contact Details</div>
                <div class="detail-grid">
                  <div class="detail-item">
                    <div class="detail-label">Email</div>
                    <div class="detail-value">${candidateData.email || 'N/A'}
                      ${candidateData.emailOtpVerified ? '<span class="badge badge-verified">Verified</span>' : ''}
                    </div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Phone</div>
                    <div class="detail-value">${candidateData.phone || 'N/A'}
                      ${candidateData.phoneOtpVerified ? '<span class="badge badge-verified">Verified</span>' : ''}
                    </div>
                  </div>
                  ${candidateData.phone2 ? `
                  <div class="detail-item">
                    <div class="detail-label">Alternate Phone</div>
                    <div class="detail-value">${candidateData.phone2}</div>
                  </div>
                  ` : ''}
                </div>
              </div>

              <div class="section">
                <div class="section-title">🎓 Education & Experience</div>
                <div class="detail-grid">
                  <div class="detail-item">
                    <div class="detail-label">Qualification</div>
                    <div class="detail-value">${candidateData.qualification || 'N/A'}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Specialization</div>
                    <div class="detail-value">${candidateData.specialization || 'N/A'}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Total Experience</div>
                    <div class="detail-value">${candidateData.totalExperience || 'N/A'}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Last Designation</div>
                    <div class="detail-value">${candidateData.lastDesignation || 'N/A'}</div>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">💼 Employment Details</div>
                <div class="detail-grid">
                  <div class="detail-item">
                    <div class="detail-label">Store/Outlet</div>
                    <div class="detail-value"><strong>${candidateData.storeName || 'N/A'}</strong></div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Designation</div>
                    <div class="detail-value">${candidateData.designation || 'N/A'}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Department</div>
                    <div class="detail-value">${candidateData.department || 'N/A'}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Date of Joining</div>
                    <div class="detail-value">${formattedDOJ}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">T-Shirt Size</div>
                    <div class="detail-value">${candidateData.tshirtSize || 'N/A'}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Lower Size</div>
                    <div class="detail-value">${candidateData.lowerSize || 'N/A'}</div>
                  </div>
                </div>
              </div>

              ${candidateData.covidVaccinated !== undefined ? `
              <div class="section">
                <div class="section-title">💉 Vaccination Status</div>
                <div class="detail-grid">
                  <div class="detail-item">
                    <div class="detail-label">COVID-19 Vaccination</div>
                    <div class="detail-value">${candidateData.covidVaccinated ? '✅ Vaccinated' : '❌ Not Vaccinated'}</div>
                  </div>
                  ${candidateData.hepatitisVaccinated !== undefined ? `
                  <div class="detail-item">
                    <div class="detail-label">Hepatitis Vaccination</div>
                    <div class="detail-value">${candidateData.hepatitisVaccinated ? '✅ Vaccinated' : '❌ Not Vaccinated'}</div>
                  </div>
                  ` : ''}
                  ${candidateData.typhoidVaccinated !== undefined ? `
                  <div class="detail-item">
                    <div class="detail-label">Typhoid Vaccination</div>
                    <div class="detail-value">${candidateData.typhoidVaccinated ? '✅ Vaccinated' : '❌ Not Vaccinated'}</div>
                  </div>
                  ` : ''}
                </div>
              </div>
              ` : ''}

              <div class="section">
                <div class="section-title">🆔 Verification Status</div>
                <div class="detail-grid">
                  <div class="detail-item">
                    <div class="detail-label">Aadhaar Verification</div>
                    <div class="detail-value">${candidateData.aadhaarVerified ? '✅ Verified' : '❌ Not Verified'}</div>
                  </div>
                </div>
              </div>

              <div class="info-box">
                <strong>ℹ️ Note:</strong> Approving this application will automatically create the candidate's LMS account and send them login credentials.
              </div>

              <div class="action-buttons">
                <a href="${approvalLink}" class="btn btn-approve">✅ APPROVE</a>
                <a href="${rejectionLink}" class="btn btn-reject">❌ REJECT</a>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>© ${new Date().getFullYear()} Burger Singh. All rights reserved.</strong></p>
              <p>This email requires your action. Please review and approve/reject the application.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `New onboarding application from ${candidateData.fullName}. Approve: ${approvalLink} Reject: ${rejectionLink}`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Approval request email sent to:', fieldCoachEmail);
    return true;
  } catch (error) {
    console.error('❌ Error sending approval email:', error.message);
    throw new Error('Failed to send approval email');
  }
};

/**
 * Send approval confirmation emails
 */
export const sendApprovalConfirmationEmails = async (emails, candidateName, storeName) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.log('⚠️  SMTP not configured - Development Mode');
    console.log(`📧 Approval Confirmation Emails sent`);
    return true;
  }

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Burger Singh HR" <${process.env.SMTP_USER}>`,
      to: emails.join(','),
      subject: `✅ Application Approved - ${candidateName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-box { background: #e8f5e9; border-left: 4px solid #4CAF50; padding: 20px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Application Approved</h1>
            </div>
            <div class="content">
              <div class="success-box">
                <p><strong>${candidateName}</strong> has been approved for <strong>${storeName}</strong></p>
                <ul>
                  <li>LMS account has been created</li>
                  <li>Welcome email sent to candidate</li>
                  <li>Training materials available in LMS</li>
                </ul>
              </div>
              <p>Best regards,<br><strong>Burger Singh HR</strong></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Application approved for ${candidateName}. LMS account created.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Confirmation emails sent');
    return true;
  } catch (error) {
    console.error('❌ Error sending confirmation email:', error.message);
    throw new Error('Failed to send confirmation email');
  }
};

/**
 * Send rejection notification email
 */
export const sendRejectionEmail = async (emails, candidateName, storeName, rejectionReason) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.log('⚠️  SMTP not configured - Development Mode');
    console.log(`📧 Rejection Email sent`);
    return true;
  }

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Burger Singh HR" <${process.env.SMTP_USER}>`,
      to: emails.join(','),
      subject: `Application Status - ${candidateName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f44336; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: #ffebee; border-left: 4px solid #f44336; padding: 20px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Application Status Update</h1>
            </div>
            <div class="content">
              <div class="info-box">
                <p>The application for <strong>${candidateName}</strong> at <strong>${storeName}</strong> has not been approved.</p>
                <p><strong>Reason:</strong> ${rejectionReason || 'Please contact HR'}</p>
              </div>
              <p>You may reapply after addressing the concerns.</p>
              <p>Best regards,<br><strong>Burger Singh HR</strong></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Application not approved. Reason: ${rejectionReason}`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Rejection email sent');
    return true;
  } catch (error) {
    console.error('❌ Error sending rejection email:', error.message);
    throw new Error('Failed to send rejection email');
  }
};

// Test email configuration
export const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email server configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Email server configuration error:', error.message);
    return false;
  }
};

/**
 * Send application submission confirmation email to candidate
 * @param {String} candidateEmail - Candidate's email
 * @param {Object} applicationData - Application details
 */
export const sendApplicationSubmissionEmail = async (candidateEmail, applicationData) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.log('⚠️  SMTP not configured - Development Mode');
    console.log(`📧 Application Submission Email to ${candidateEmail}`);
    console.log(`Candidate: ${applicationData.fullName}`);
    console.log('Application details would be sent here');
    return true;
  }

  try {
    const transporter = createTransporter();
    const formattedDOB = applicationData.dob ? new Date(applicationData.dob).toLocaleDateString('en-IN') : 'N/A';
    const formattedDOJ = applicationData.dateOfJoining ? new Date(applicationData.dateOfJoining).toLocaleDateString('en-IN') : 'N/A';
    const submittedDate = applicationData.submittedAt ? new Date(applicationData.submittedAt).toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : new Date().toLocaleDateString('en-IN');
    
    const mailOptions = {
      from: `"Burger Singh HR" <${process.env.SMTP_USER}>`,
      to: candidateEmail,
      subject: `Application Submitted Successfully - ${applicationData.fullName} | Burger Singh`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; background: #ffffff; }
            .header { background: linear-gradient(135deg, #FF6B35 0%, #FF8E53 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { margin: 0 0 10px 0; font-size: 28px; }
            .header p { margin: 0; font-size: 16px; opacity: 0.95; }
            .content { background: #f9f9f9; padding: 30px; }
            .success-banner { background: #e8f5e9; border-left: 5px solid #4CAF50; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .success-banner h2 { margin: 0 0 10px 0; color: #2e7d32; font-size: 20px; }
            .section { margin: 25px 0; background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .section-title { font-size: 18px; font-weight: bold; color: #FF6B35; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #FF6B35; text-transform: uppercase; }
            .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .detail-item { margin: 10px 0; }
            .detail-label { font-weight: 600; color: #555; font-size: 13px; margin-bottom: 5px; text-transform: uppercase; }
            .detail-value { color: #333; font-size: 15px; font-weight: 500; }
            .full-width { grid-column: 1 / -1; }
            .next-steps { background: #fff3e0; border-left: 5px solid #ff9800; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .next-steps h3 { margin: 0 0 15px 0; color: #e65100; }
            .next-steps ul { margin: 10px 0; padding-left: 20px; }
            .next-steps li { margin: 8px 0; }
            .footer { background: #f0f0f0; padding: 25px; text-align: center; color: #666; font-size: 12px; border-radius: 0 0 10px 10px; }
            .footer p { margin: 5px 0; }
            .contact-info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; }
            .badge { display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin: 5px; }
            .badge-verified { background: #4CAF50; color: white; }
            .badge-pending { background: #ff9800; color: white; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🍔 Burger Singh</h1>
              <p>Employee Onboarding System</p>
            </div>
            
            <div class="content">
              <div class="success-banner">
                <h2>✅ Application Submitted Successfully!</h2>
                <p>Dear <strong>${applicationData.fullName}</strong>, your onboarding application has been received and is now under review.</p>
                <p style="margin-top: 10px;"><strong>Application ID:</strong> ${applicationData.applicationId || 'BS-' + Date.now()}</p>
                <p><strong>Submitted on:</strong> ${submittedDate}</p>
              </div>

              <div class="section">
                <div class="section-title">👤 Personal Information</div>
                <div class="detail-grid">
                  <div class="detail-item">
                    <div class="detail-label">Full Name</div>
                    <div class="detail-value">${applicationData.fullName || 'N/A'}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Date of Birth</div>
                    <div class="detail-value">${formattedDOB}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Gender</div>
                    <div class="detail-value">${applicationData.gender || 'N/A'}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Marital Status</div>
                    <div class="detail-value">${applicationData.maritalStatus || 'N/A'}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Blood Group</div>
                    <div class="detail-value">${applicationData.bloodGroup || 'N/A'}</div>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">📧 Contact Details</div>
                <div class="detail-grid">
                  <div class="detail-item">
                    <div class="detail-label">Email</div>
                    <div class="detail-value">${applicationData.email || 'N/A'}
                      ${applicationData.emailOtpVerified ? '<span class="badge badge-verified">Verified</span>' : ''}
                    </div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Phone</div>
                    <div class="detail-value">${applicationData.phone || 'N/A'}
                      ${applicationData.phoneOtpVerified ? '<span class="badge badge-verified">Verified</span>' : ''}
                    </div>
                  </div>
                  ${applicationData.phone2 ? `
                  <div class="detail-item">
                    <div class="detail-label">Alternate Phone</div>
                    <div class="detail-value">${applicationData.phone2}</div>
                  </div>
                  ` : ''}
                  <div class="detail-item full-width">
                    <div class="detail-label">Current Address</div>
                    <div class="detail-value">${applicationData.currentAddress || 'N/A'}</div>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">🎓 Education & Experience</div>
                <div class="detail-grid">
                  <div class="detail-item">
                    <div class="detail-label">Qualification</div>
                    <div class="detail-value">${applicationData.qualification || 'N/A'}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Specialization</div>
                    <div class="detail-value">${applicationData.specialization || 'N/A'}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Total Experience</div>
                    <div class="detail-value">${applicationData.totalExperience || 'N/A'}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Last Designation</div>
                    <div class="detail-value">${applicationData.lastDesignation || 'N/A'}</div>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">💼 Employment Details</div>
                <div class="detail-grid">
                  <div class="detail-item">
                    <div class="detail-label">Store/Outlet</div>
                    <div class="detail-value">${applicationData.storeName || 'N/A'}</div>
                  </div>
                  
                  <div class="detail-item">
                    <div class="detail-label">Date of Joining</div>
                    <div class="detail-value">${formattedDOJ}</div>
                  </div>
                  <div class="detail-item full-width">
                    <div class="detail-label">T-Shirt Size</div>
                    <div class="detail-value">${applicationData.tshirtSize || 'N/A'}</div>
                  </div>
                  <div class="detail-item full-width">
                    <div class="detail-label">Lower Size</div>
                    <div class="detail-value">${applicationData.lowerSize || 'N/A'}</div>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">💉 Health & Vaccination</div>
                <div class="detail-grid">
                  <div class="detail-item">
                    <div class="detail-label">COVID-19 Vaccination</div>
                    <div class="detail-value">${applicationData.covidVaccinated ? '✅ Vaccinated' : '❌ Not Vaccinated'}</div>
                  </div>
                  
                </div>
              </div>

              <div class="section">
                <div class="section-title">🆔 Verification Status</div>
                <div class="detail-grid">
                  <div class="detail-item">
                    <div class="detail-label">Aadhaar Number</div>
                    <div class="detail-value">XXXX XXXX ${applicationData.aadhaarNumber ? applicationData.aadhaarNumber.slice(-4) : 'XXXX'}
                      ${applicationData.aadhaarVerified ? '<span class="badge badge-verified">Verified</span>' : '<span class="badge badge-pending">Pending</span>'}
                    </div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">PAN Number</div>
                    <div class="detail-value">${applicationData.panNumber || 'N/A'}</div>
                  </div>
                </div>
              </div>

              <div class="next-steps">
                <h3>📋 Next Steps</h3>
                <ul>
                  <li><strong>Review Process:</strong> Your application is being reviewed by the Field Coach</li>
                  <li><strong>Timeline:</strong> You will receive an update within 2-3 business days</li>
                  <li><strong>What's Next:</strong> Once approved, you will receive your LMS login credentials</li>
                  <li><strong>Training:</strong> Complete mandatory training modules before joining date</li>
                </ul>
              </div>

              <div class="contact-info">
                <strong>📞 Need Help?</strong><br>
                Contact HR: <strong>hr@burgersingh.com</strong><br>
                Phone: <strong>+91-XXXX-XXXXXX</strong>
              </div>

              <p style="text-align: center; margin-top: 30px; color: #666;">
                <strong>Welcome to the Burger Singh family! 🍔</strong><br>
                We're excited to have you on board.
              </p>
            </div>
            
            <div class="footer">
              <p><strong>© ${new Date().getFullYear()} Burger Singh. All rights reserved.</strong></p>
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>If you have any questions, contact our HR department.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Application Submitted Successfully - Burger Singh

Dear ${applicationData.fullName},

Your onboarding application has been submitted successfully on ${submittedDate}.

Personal Information:
- Name: ${applicationData.fullName}
- DOB: ${formattedDOB}
- Gender: ${applicationData.gender}

Contact Details:
- Email: ${applicationData.email}
- Phone: ${applicationData.phone}

Employment Details:
- Store: ${applicationData.storeName}
- Designation: ${applicationData.designation}
- Date of Joining: ${formattedDOJ}

Next Steps:
1. Your application is being reviewed by the Field Coach
2. You will receive an update within 2-3 business days
3. Once approved, you will receive LMS login credentials

For any queries, contact: hr@burgersingh.com

Best regards,
Burger Singh HR Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Application submission email sent to:', candidateEmail);
    return true;
  } catch (error) {
    console.error('❌ Error sending application submission email:', error.message);
    throw new Error('Failed to send application submission email');
  }
};

/**
 * Send application approval notification email to candidate
 * @param {String} candidateEmail - Candidate's email
 * @param {Object} applicationData - Application details
 */
export const sendCandidateApprovalEmail = async (candidateEmail, applicationData) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.log('⚠️  SMTP not configured - Development Mode');
    console.log(`📧 Approval Notification Email to ${candidateEmail}`);
    console.log(`Candidate: ${applicationData.fullName} - APPROVED`);
    return true;
  }

  try {
    const transporter = createTransporter();
    const formattedDOJ = applicationData.dateOfJoining ? new Date(applicationData.dateOfJoining).toLocaleDateString('en-IN') : 'N/A';
    
    const mailOptions = {
      from: `"Burger Singh HR" <${process.env.SMTP_USER}>`,
      to: candidateEmail,
      subject: `🎉 Congratulations! Your Application has been Approved | Burger Singh`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 700px; margin: 0 auto; padding: 20px; background: #ffffff; }
            .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { margin: 0 0 10px 0; font-size: 32px; }
            .header p { margin: 0; font-size: 18px; opacity: 0.95; }
            .content { background: #f9f9f9; padding: 30px; }
            .success-banner { background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-left: 5px solid #4CAF50; padding: 25px; margin: 20px 0; border-radius: 8px; text-align: center; }
            .success-banner h2 { margin: 0 0 10px 0; color: #2e7d32; font-size: 24px; }
            .success-icon { font-size: 60px; margin-bottom: 15px; }
            .section { margin: 25px 0; background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .section-title { font-size: 18px; font-weight: bold; color: #4CAF50; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #4CAF50; }
            .info-item { margin: 12px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
            .info-label { font-weight: 600; color: #555; font-size: 14px; }
            .info-value { color: #333; font-size: 16px; font-weight: 500; margin-top: 5px; }
            .next-steps { background: #fff3e0; border-left: 5px solid #ff9800; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .next-steps h3 { margin: 0 0 15px 0; color: #e65100; }
            .next-steps ul { margin: 10px 0; padding-left: 25px; }
            .next-steps li { margin: 10px 0; line-height: 1.8; }
            .footer { background: #f0f0f0; padding: 25px; text-align: center; color: #666; font-size: 12px; border-radius: 0 0 10px 10px; }
            .contact-box { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .contact-box strong { color: #1976d2; font-size: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🍔 Burger Singh</h1>
              <p>Welcome to Our Family!</p>
            </div>
            
            <div class="content">
              <div class="success-banner">
                <div class="success-icon">🎉</div>
                <h2>Congratulations, ${applicationData.fullName}!</h2>
                <p style="font-size: 16px; color: #555; margin-top: 10px;">Your onboarding application has been <strong style="color: #2e7d32;">APPROVED</strong></p>
              </div>

              <p style="font-size: 16px; text-align: center; margin: 20px 0;">
                We are excited to welcome you to the Burger Singh team! Your application has been reviewed and approved by our Field Coach.
              </p>

              <div class="section">
                <div class="section-title">📋 Your Employment Details</div>
                <div class="info-item">
                  <div class="info-label">Store/Outlet</div>
                  <div class="info-value">${applicationData.storeName || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Designation</div>
                  <div class="info-value">${applicationData.designation || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Department</div>
                  <div class="info-value">${applicationData.department || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Date of Joining</div>
                  <div class="info-value">${formattedDOJ}</div>
                </div>
              </div>

              <div class="next-steps">
                <h3>📝 Next Steps - Important!</h3>
                <ul>
                  <li><strong>LMS Account Creation:</strong> Your Learning Management System (LMS) account will be created within 24 hours</li>
                  <li><strong>Login Credentials:</strong> You will receive a separate email with your LMS username and password</li>
                  <li><strong>Mandatory Training:</strong> Complete all required training modules before your joining date</li>
                  <li><strong>Document Verification:</strong> Keep your original documents ready for verification on your first day</li>
                  <li><strong>Joining Kit:</strong> You will receive your uniform and employee ID on your first day</li>
                  <li><strong>Reporting Time:</strong> Please report to your assigned outlet at 9:00 AM on ${formattedDOJ}</li>
                </ul>
              </div>

              <div class="section">
                <div class="section-title">✅ What to Bring on Your First Day</div>
                <ul style="margin: 15px 0; padding-left: 25px; line-height: 1.8;">
                  <li>Original Aadhaar Card</li>
                  <li>Original PAN Card</li>
                  <li>Educational Certificates (originals + photocopies)</li>
                  <li>Passport-sized photographs (4 copies)</li>
                  <li>Previous employment documents (if applicable)</li>
                  <li>Bank account details and cancelled cheque</li>
                </ul>
              </div>

              <div class="contact-box">
                <strong>📞 Need Help?</strong><br>
                <p style="margin: 10px 0;">For any questions or concerns, please contact:</p>
                <strong style="font-size: 15px;">HR Department: hr@burgersingh.com</strong><br>
                <strong style="font-size: 15px;">Phone: +91-XXXX-XXXXXX</strong>
              </div>

              <p style="text-align: center; margin-top: 30px; font-size: 18px; color: #2e7d32;">
                <strong>Welcome aboard! We look forward to having you on our team! 🍔</strong>
              </p>
            </div>
            
            <div class="footer">
              <p><strong>© ${new Date().getFullYear()} Burger Singh. All rights reserved.</strong></p>
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Congratulations ${applicationData.fullName}!

Your onboarding application has been APPROVED!

Employment Details:
- Store: ${applicationData.storeName}
- Designation: ${applicationData.designation}
- Department: ${applicationData.department}
- Date of Joining: ${formattedDOJ}

Next Steps:
1. LMS account will be created within 24 hours
2. Complete all mandatory training modules
3. Keep original documents ready for verification
4. Report to ${applicationData.storeName} at 9:00 AM on ${formattedDOJ}

For queries, contact: hr@burgersingh.com

Welcome to Burger Singh!
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Approval notification email sent to candidate:', candidateEmail);
    return true;
  } catch (error) {
    console.error('❌ Error sending approval notification email:', error.message);
    throw new Error('Failed to send approval notification email');
  }
};

/**
 * Send application rejection notification email to candidate
 * @param {String} candidateEmail - Candidate's email
 * @param {Object} applicationData - Application details
 * @param {String} rejectionReason - Reason for rejection
 */
export const sendCandidateRejectionEmail = async (candidateEmail, applicationData, rejectionReason) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.log('⚠️  SMTP not configured - Development Mode');
    console.log(`📧 Rejection Notification Email to ${candidateEmail}`);
    console.log(`Candidate: ${applicationData.fullName} - REJECTED`);
    console.log(`Reason: ${rejectionReason}`);
    return true;
  }

  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Burger Singh HR" <${process.env.SMTP_USER}>`,
      to: candidateEmail,
      subject: `Application Status Update | Burger Singh`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 700px; margin: 0 auto; padding: 20px; background: #ffffff; }
            .header { background: linear-gradient(135deg, #FF6B35 0%, #FF8E53 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { margin: 0 0 10px 0; font-size: 28px; }
            .header p { margin: 0; font-size: 16px; opacity: 0.95; }
            .content { background: #f9f9f9; padding: 30px; }
            .status-banner { background: #ffebee; border-left: 5px solid #f44336; padding: 25px; margin: 20px 0; border-radius: 8px; }
            .status-banner h2 { margin: 0 0 10px 0; color: #c62828; font-size: 22px; }
            .section { margin: 25px 0; background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .section-title { font-size: 18px; font-weight: bold; color: #FF6B35; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #FF6B35; }
            .reason-box { background: #fff3e0; border-left: 4px solid #ff9800; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .reason-box strong { color: #e65100; }
            .info-box { background: #e3f2fd; border-left: 4px solid #2196F3; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .footer { background: #f0f0f0; padding: 25px; text-align: center; color: #666; font-size: 12px; border-radius: 0 0 10px 10px; }
            .contact-box { background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🍔 Burger Singh</h1>
              <p>Application Status Update</p>
            </div>
            
            <div class="content">
              <p>Dear ${applicationData.fullName},</p>
              
              <div class="status-banner">
                <h2>Application Status Update</h2>
                <p style="font-size: 16px; margin: 10px 0;">
                  Thank you for your interest in joining Burger Singh. After careful review, we regret to inform you that your application has not been approved at this time.
                </p>
              </div>

              ${rejectionReason ? `
              <div class="reason-box">
                <strong>Reason for Decision:</strong>
                <p style="margin: 10px 0; color: #555; font-size: 15px;">${rejectionReason}</p>
              </div>
              ` : ''}

              <div class="section">
                <div class="section-title">💡 What You Can Do Next</div>
                <ul style="margin: 15px 0; padding-left: 25px; line-height: 1.8;">
                  <li>If you would like more details about this decision, please contact our HR department</li>
                  <li>You may reapply after addressing the concerns mentioned above</li>
                  <li>Keep an eye on our careers page for future opportunities that match your profile</li>
                  <li>We encourage you to gain more experience and apply again in the future</li>
                </ul>
              </div>

              <div class="info-box">
                <strong>ℹ️ Important Note:</strong>
                <p style="margin: 10px 0;">
                  This decision does not reflect on your abilities or potential. We receive many applications and can only select candidates who best match our current requirements. We appreciate your understanding.
                </p>
              </div>

              <div class="contact-box">
                <strong>📞 Questions or Feedback?</strong><br>
                <p style="margin: 10px 0;">Please feel free to reach out to us:</p>
                <strong style="font-size: 15px; color: #2e7d32;">HR Department: hr@burgersingh.com</strong><br>
                <strong style="font-size: 15px; color: #2e7d32;">Phone: +91-XXXX-XXXXXX</strong>
              </div>

              <p style="text-align: center; margin-top: 30px; color: #666;">
                We wish you all the best in your future endeavors and thank you for considering Burger Singh as your potential employer.
              </p>
            </div>
            
            <div class="footer">
              <p><strong>© ${new Date().getFullYear()} Burger Singh. All rights reserved.</strong></p>
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Dear ${applicationData.fullName},

Application Status Update

Thank you for your interest in joining Burger Singh. After careful review, we regret to inform you that your application has not been approved at this time.

${rejectionReason ? `Reason: ${rejectionReason}\n` : ''}

What You Can Do Next:
- Contact HR for more details about this decision
- You may reapply after addressing the concerns mentioned
- Keep an eye on our careers page for future opportunities
- Gain more experience and apply again in the future

For questions, contact: hr@burgersingh.com

We wish you all the best in your future endeavors.

Best regards,
Burger Singh HR Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Rejection notification email sent to candidate:', candidateEmail);
    return true;
  } catch (error) {
    console.error('❌ Error sending rejection notification email:', error.message);
    throw new Error('Failed to send rejection notification email');
  }
};

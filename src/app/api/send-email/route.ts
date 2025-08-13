// src/app/api/send-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as Brevo from '@getbrevo/brevo';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

// --- Interfaces ---
interface SendEmailRequestBody {
  to: string;
  name?: string;
  subject: string;
  template: 'welcome' | 'test' | 'custom' | 'vehicleRequestConfirmation' | 'vehicleRequestNotification'; 
  body?: string; 
  requestDetails?: any;
}

// --- Email Templates ---

const generateWelcomeEmailHtml = (name: string): string => `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; text-align: right; }
        .button {
            display: inline-block;
            background-color: #007BFF;
            color: #ffffff !important; /* Important to override default link color */
            padding: 12px 25px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            font-size: 16px;
        }
        .button:hover { background-color: #0056b3; }
        p { margin-bottom: 1em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>שלום ${name},</h1>
        <p>שמחים לעדכן שחשבונך במערכת עו"סנט אושר על ידי מנהל.</p>
        <p>כעת תוכל להתחבר למערכת ולהנות מכל הכלים שהיא מציעה.</p>
        <br>
        <a href="https://osnet.netlify.app" class="button">כניסה למערכת</a>
        <br><br>
        <p>בברכה,</p>
        <p>צוות המערכת</p>
    </div>
</body>
</html>
`;

const generateTestEmailHtml = (body: string): string => `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; text-align: right; }
    </style>
</head>
<body>
    <div class="container">
        ${body}
    </div>
</body>
</html>
`;

const generateVehicleRequestConfirmationHtml = (name: string, details: any): string => `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; text-align: right; }
        h1 { color: #199A56; }
        strong { font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>שלום ${name},</h1>
        <p>בקשתך להזמנת רכב ביטחון התקבלה בהצלחה ותועבר לבדיקה.</p>
        <p>להלן סיכום פרטי הבקשה:</p>
        <ul>
            <li><strong>מטרת הנסיעה:</strong> ${details.purpose}</li>
            <li><strong>כתובת:</strong> ${details.address}</li>
            <li><strong>תאריך ושעת יציאה:</strong> ${format(new Date(details.startDateTime), "d MMMM yyyy 'בשעה' HH:mm", { locale: he })}</li>
            <li><strong>שעת חזרה משוערת:</strong> ${details.endTime}</li>
        </ul>
        <p>בברכה,</p>
        <p>מערכת עו"סנט</p>
    </div>
</body>
</html>
`;

const generateVehicleRequestNotificationHtml = (details: any): string => `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; text-align: right; }
        h1 { color: #A25DDC; }
        strong { font-weight: bold; }
        .button {
            display: inline-block;
            background-color: #A25DDC;
            color: #ffffff !important;
            padding: 12px 25px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            font-size: 16px;
        }
        .button:hover { background-color: #8e44ad; }
    </style>
</head>
<body>
    <div class="container">
        <h1>בקשה חדשה להזמנת רכב ביטחון</h1>
        <p>התקבלה בקשה חדשה במערכת. יש להיכנס למערכת כדי לאשר אותה.</p>
        <p>פרטי הבקשה:</p>
        <ul>
            <li><strong>שם העובד/ת:</strong> ${details.userName}</li>
            <li><strong>מטרת הנסיעה:</strong> ${details.purpose}</li>
            <li><strong>כתובת:</strong> ${details.address}</li>
            <li><strong>תאריך ושעת יציאה:</strong> ${format(new Date(details.startDateTime), "d MMMM yyyy 'בשעה' HH:mm", { locale: he })}</li>
            <li><strong>שעת חזרה משוערת:</strong> ${details.endTime}</li>
        </ul>
        <br>
        <a href="https://osnet.netlify.app/admin/vehicle-requests" class="button">עבור לניהול בקשות</a>
        <br><br>
    </div>
</body>
</html>
`;


// --- API Handler ---

export async function POST(req: NextRequest) {
  const body: SendEmailRequestBody = await req.json();
  console.log('send-email API called', { method: req.method, body });

  const { to, name, subject, template, body: customBody, requestDetails } = body;
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.error('Brevo API key is not configured.');
    return NextResponse.json({ error: 'Server is not configured for sending emails.' }, { status: 500 });
  }

  if (!to || !subject || !template) {
    return NextResponse.json({ error: 'Missing required parameters: to, subject, and template are required.' }, { status: 400 });
  }
  
  // Specific checks for templates that require a 'name'
  if ((template === 'welcome' || template === 'vehicleRequestConfirmation') && !name) {
      return NextResponse.json({ error: 'Missing required parameter: name is required for this template.' }, { status: 400 });
  }

  // Specific checks for templates that require 'requestDetails'
  if ((template === 'vehicleRequestConfirmation' || template === 'vehicleRequestNotification') && !requestDetails) {
     return NextResponse.json({ error: 'Missing required parameter: requestDetails is required for this template.' }, { status: 400 });
  }


  let htmlContent: string;
  switch (template) {
      case 'welcome':
          htmlContent = generateWelcomeEmailHtml(name!);
          break;
      case 'test':
      case 'custom':
          htmlContent = generateTestEmailHtml(customBody || "This is a test body.");
          break;
      case 'vehicleRequestConfirmation':
          const startDateTime = new Date(requestDetails.startDateTime);
          const [endHours, endMinutes] = requestDetails.endTime.split(':').map(Number);
          const endDateTime = new Date(startDateTime);
          endDateTime.setHours(endHours, endMinutes);
          
          htmlContent = generateVehicleRequestConfirmationHtml(name!, {...requestDetails, endDateTime: endDateTime.toISOString() });
          break;
      case 'vehicleRequestNotification':
          htmlContent = generateVehicleRequestNotificationHtml(requestDetails);
          break;
      default:
          return NextResponse.json({ error: 'Invalid template specified.' }, { status: 400 });
  }

  const apiInstance = new Brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(
    Brevo.TransactionalEmailsApiApiKeys.apiKey,
    apiKey
  );

  const sendSmtpEmail = new Brevo.SendSmtpEmail();
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = htmlContent;
  sendSmtpEmail.sender = { name: 'עו"סנט', email: 'osnet@amireyal.co.il' };
  sendSmtpEmail.to = [{ email: to, name }];

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Brevo sendTransacEmail successful response:', data);
    return NextResponse.json({ message: 'Email sent successfully', data }, { status: 200 });
  } catch (error: any) {
    console.error('Error sending email with Brevo:', JSON.stringify(error, null, 2));
    return NextResponse.json({ error: 'Failed to send email.', details: error.body || error.message }, { status: 500 });
  }
}

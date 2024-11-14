import nodemailer from "nodemailer";

const sendEmail = async ({ email, subject, message }) => {
	try {
		// Create a transporter object using your email provider
		const transporter = nodemailer.createTransport({
			host: process.env.EMAIL_HOST, // e.g., smtp.gmail.com for Gmail
			port: process.env.EMAIL_PORT || 587, // 587 is the default port for TLS
			auth: {
				user: process.env.EMAIL_USER, // your email address
				pass: process.env.EMAIL_PASS, // your email password or app password
			},
		});

		// Define the email options
		const mailOptions = {
			from: process.env.EMAIL_FROM, // sender address
			to: email,                    // recipient's email
			subject: subject,             // email subject
			text: message,                // plain text body
		};

		// Send the email
		await transporter.sendMail(mailOptions);
		console.log(`Email sent to ${email}`);
	} catch (error) {
		console.error("Error sending email", error.message);
		throw new Error("Email could not be sent");
	}
};

export default sendEmail;

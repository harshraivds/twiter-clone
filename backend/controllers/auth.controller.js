import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import sendEmail from "../lib/utils/sendEmail.js";
import crypto from "crypto";
export const signup = async (req, res) => {
	try {
		const { fullName, username, email, password } = req.body;

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({ error: "Invalid email format" });
		}

		const existingUser = await User.findOne({ username });
		if (existingUser) {
			return res.status(400).json({ error: "Username is already taken" });
		}

		const existingEmail = await User.findOne({ email });
		if (existingEmail) {
			return res.status(400).json({ error: "Email is already taken" });
		}

		if (password.length < 6) {
			return res.status(400).json({ error: "Password must be at least 6 characters long" });
		}

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		const newUser = new User({
			fullName,
			username,
			email,
			password: hashedPassword,
		});

		if (newUser) {
			generateTokenAndSetCookie(newUser._id, res);
			await newUser.save();

			res.status(201).json({
				_id: newUser._id,
				fullName: newUser.fullName,
				username: newUser.username,
				email: newUser.email,
				followers: newUser.followers,
				following: newUser.following,
				profileImg: newUser.profileImg,
				coverImg: newUser.coverImg,
			});
		} else {
			res.status(400).json({ error: "Invalid user data" });
		}
	} catch (error) {
		console.log("Error in signup controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const login = async (req, res) => {
	try {
		const { username, password } = req.body;
		const user = await User.findOne({ username });
		const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

		if (!user || !isPasswordCorrect) {
			return res.status(400).json({ error: "Invalid username or password" });
		}

		generateTokenAndSetCookie(user._id, res);

		res.status(200).json({
			_id: user._id,
			fullName: user.fullName,
			username: user.username,
			email: user.email,
			followers: user.followers,
			following: user.following,
			profileImg: user.profileImg,
			coverImg: user.coverImg,
		});
	} catch (error) {
		console.log("Error in login controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const logout = async (req, res) => {
	try {
		res.cookie("jwt", "", { maxAge: 0 });
		res.status(200).json({ message: "Logged out successfully" });
	} catch (error) {
		console.log("Error in logout controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const getMe = async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select("-password");
		res.status(200).json(user);
	} catch (error) {
		console.log("Error in getMe controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

// Forgot Password Controller
export const forgotPassword = async (req, res) => {
	try {
		const { email } = req.body;
		const user = await User.findOne({ email });

		if (!user) {
			return res.status(404).json({ error: "User not found with this email" });
		}

		// Generate a reset token
		const resetToken = crypto.randomBytes(20).toString("hex");

		// Hash and set reset token on user object
		user.resetPasswordToken = crypto
			.createHash("sha256")
			.update(resetToken)
			.digest("hex");

		// Set expiration time (e.g., 1 hour from now)
		user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;

		await user.save({ validateBeforeSave: false });

		// Send reset link via email
		const resetUrl = `$${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
		const message = `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;

		try {
			await sendEmail({
				email: user.email,
				subject: "Password Reset Request",
				message,
			});

			res.status(200).json({ message: "Email sent successfully" });
		} catch (error) {
			console.log("Error sending email", error.message);
			user.resetPasswordToken = undefined;
			user.resetPasswordExpire = undefined;
			await user.save({ validateBeforeSave: false });
			res.status(500).json({ error: "Failed to send email" });
		}
	} catch (error) {
		console.log("Error in forgotPassword controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

// Reset Password Controller
export const resetPassword = async (req, res) => {
	try {
		// Check if token exists in the request parameters
		if (!req.params.token) {
			return res.status(400).json({ error: "Token is missing from the request" });
		}

		// Hash the token received from URL
		const resetPasswordToken = crypto
			.createHash("sha256")
			.update(req.params.token)
			.digest("hex");

		// Find user with the matching token and check expiration
		const user = await User.findOne({
			resetPasswordToken,
			resetPasswordExpire: { $gt: Date.now() },
		});

		if (!user) {
			return res.status(400).json({ error: "Invalid or expired token" });
		}

		const { password } = req.body;
		if (password.length < 6) {
			return res.status(400).json({ error: "Password must be at least 6 characters long" });
		}

		// Hash the new password and update user
		const salt = await bcrypt.genSalt(10);
		user.password = await bcrypt.hash(password, salt);

		// Clear the reset token fields
		user.resetPasswordToken = undefined;
		user.resetPasswordExpire = undefined;

		await user.save();

		res.status(200).json({ message: "Password reset successful" });
	} catch (error) {
		console.log("Error in resetPassword controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

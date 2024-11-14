import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";

const ResetPasswordPage = () => {
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const { token } = useParams(); // Get token from URL
	const navigate = useNavigate();

	const { mutate: resetPasswordMutation, isPending } = useMutation({
		mutationFn: async (newPasswordData) => {
			const res = await fetch(`/api/auth/password/reset/${token}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(newPasswordData),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || "Failed to reset password.");
			}

			return data.message;
		},
		onSuccess: (data) => {
			setMessage(data);
			setError("");
			// Redirect to homepage after a short delay
			setTimeout(() => navigate("/"), 3000);
		},
		onError: (error) => {
			setError(error.message);
			setMessage("");
		},
	});

	const handleSubmit = (e) => {
		e.preventDefault();
		if (password !== confirmPassword) {
			setError("Passwords do not match.");
			return;
		}
		if (password.length < 8) {
			setError("Password should be at least 8 characters long.");
			return;
		}

		resetPasswordMutation({ password });
	};

	const togglePasswordVisibility = () => setShowPassword(!showPassword);
	const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

	return (
		<div className='max-w-screen-xl mx-auto flex h-screen'>
			<div className='flex-1 flex flex-col justify-center items-center'>
				{message ? (
					<div className='flex flex-col items-center'>
						<h2 className='text-2xl font-bold text-green-500'>{message}</h2>
						<p className='text-gray-500 mt-2'>Redirecting to home...</p>
					</div>
				) : (
					<form className='flex gap-4 flex-col' onSubmit={handleSubmit}>
						<h1 className='text-4xl font-extrabold text-white'>Reset Password</h1>
						<p className='text-white text-lg mb-4'>Enter a new password to reset your account.</p>

						<label className='input input-bordered rounded flex items-center gap-2'>
							<input
								type={showPassword ? "text" : "password"}
								className='grow'
								placeholder='New password'
								onChange={(e) => setPassword(e.target.value)}
								value={password}
								required
							/>
							<button type="button" onClick={togglePasswordVisibility} className="text-xl">
								{showPassword ? <MdVisibilityOff /> : <MdVisibility />}
							</button>
						</label>

						<label className='input input-bordered rounded flex items-center gap-2'>
							<input
								type={showConfirmPassword ? "text" : "password"}
								className='grow'
								placeholder='Confirm new password'
								onChange={(e) => setConfirmPassword(e.target.value)}
								value={confirmPassword}
								required
							/>
							<button type="button" onClick={toggleConfirmPasswordVisibility} className="text-xl">
								{showConfirmPassword ? <MdVisibilityOff /> : <MdVisibility />}
							</button>
						</label>

						<button className='btn rounded-full btn-primary text-white' disabled={isPending}>
							{isPending ? "Resetting..." : "Reset Password"}
						</button>
						{error && <p className='text-red-500'>{error}</p>}

						{/* Link back to Login */}
						<div className='mt-4'>
							<Link to='/login' className='text-blue-500 text-sm'>
								Back to Login
							</Link>
						</div>
					</form>
				)}
			</div>
		</div>
	);
};

export default ResetPasswordPage;

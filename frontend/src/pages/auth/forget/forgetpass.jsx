import { useState } from "react";
import { Link } from "react-router-dom";
import { MdOutlineMail } from "react-icons/md";
import { useMutation } from "@tanstack/react-query";

const ForgotPasswordPage = () => {
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");

	const { mutate: forgotPasswordMutation, isPending } = useMutation({
		mutationFn: async (email) => {
			const res = await fetch("/api/auth/forgot", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email }),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || "Failed to send reset link.");
			}

			return data.message;
		},
		onSuccess: (data) => {
			setMessage(data);
			setError("");
		},
		onError: (error) => {
			setError(error.message);
			setMessage("");
		},
	});

	const handleSubmit = (e) => {
		e.preventDefault();
		forgotPasswordMutation(email);
	};

	return (
		<div className='max-w-screen-xl mx-auto flex h-screen'>
			<div className='flex-1 flex flex-col justify-center items-center'>
				<form className='flex gap-4 flex-col' onSubmit={handleSubmit}>
					<h1 className='text-4xl font-extrabold text-white'>Forgot Password</h1>
					<p className='text-white text-lg mb-4'>
						Enter your email to receive a password reset link.
					</p>
					<label className='input input-bordered rounded flex items-center gap-2'>
						<MdOutlineMail />
						<input
							type='email'
							className='grow'
							placeholder='Enter your email'
							onChange={(e) => setEmail(e.target.value)}
							value={email}
							required
						/>
					</label>
					<button className='btn rounded-full btn-primary text-white' disabled={isPending}>
						{isPending ? "Sending..." : "Send Reset Link"}
					</button>
					{message && <p className='text-green-500'>{message}</p>}
					{error && <p className='text-red-500'>{error}</p>}
				</form>
				<div className='flex flex-col gap-2 mt-4'>
					<p className='text-white text-lg'>Remembered your password?</p>
					<Link to='/login'>
						<button className='btn rounded-full btn-primary text-white btn-outline w-full'>Back to Login</button>
					</Link>
				</div>
			</div>
		</div>
	);
};

export default ForgotPasswordPage;

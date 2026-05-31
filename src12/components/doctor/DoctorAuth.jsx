import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    LogIn, UserPlus, Mail, KeyRound, User, Fingerprint, ShieldCheck, CheckCircle2 
} from 'lucide-react';

const BACKEND_URL = 'http://localhost:5000/api/v1/doctors';

export default function DoctorAuth() {
    const [isLoginView, setIsLoginView] = useState(true);
    const [formData, setFormData] = useState({
        username: '', 
        email: '', 
        password: '', 
        doctorId: '',
        licenseNumber: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [verifiedDoctor, setVerifiedDoctor] = useState(null); // This will hold the verified data
    const [isVerified, setIsVerified] = useState(false); // New state to control the form flow

    const navigate = useNavigate();

    const clearForm = () => {
        setError('');
        setSuccess('');
        setVerifiedDoctor(null);
        setIsVerified(false);
        setFormData({
            username: '', email: '', password: '', doctorId: '', licenseNumber: '',
        });
    };
    
    const toggleView = () => {
        setIsLoginView(!isLoginView);
        clearForm();
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleVerify = async () => {
        setLoading(true);
        setError('');
        setSuccess('Verifying with NMC registry...');
        try {
            const res = await fetch(`${BACKEND_URL}/verify-doctor`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    doctorId: formData.doctorId,
                    licenseNumber: formData.licenseNumber,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setVerifiedDoctor(data.doctor);
            setSuccess('✅ Verification Successful! Please complete your registration.');
            setIsVerified(true);
        } catch (err) {
            setError(err.message || 'Verification failed.');
            setSuccess('');
        } finally {
            setLoading(false);
        }
    };
    
    const handleRegister = async () => {
        setLoading(true);
        setError('');
        setSuccess('Creating your account...');
        try {
            const res = await fetch(`${BACKEND_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    verifiedDoctor: verifiedDoctor, // Send the verified data
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setSuccess(data.message);
            setTimeout(toggleView, 3000);
        } catch (err) {
            setError(err.message || 'Registration failed.');
            setSuccess('');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const res = await fetch(`${BACKEND_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, password: formData.password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            localStorage.setItem('authToken', data.token);
            setSuccess('Login successful! Redirecting...');
            setTimeout(() => navigate('/doctor/dashboard'), 1000);
        } catch (err) {
            setError(err.message || 'Login failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isLoginView) {
            handleLogin();
        } else {
            // In registration view, the button's action changes
            if (!isVerified) {
                handleVerify();
            } else {
                handleRegister();
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <motion.div
                className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Doctor Portal</h1>
                    <p className="text-gray-600 mt-2">
                        {isLoginView ? 'Welcome back! Please sign in.' : 'Verify your identity to register.'}
                    </p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    {isLoginView ? (
                        <>
                            {/* LOGIN FORM */}
                            <motion.div initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
                                <input name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required className="w-full pl-4 p-2 border rounded-md" />
                            </motion.div>
                            <motion.div initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
                                <input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} required className="w-full pl-4 p-2 border rounded-md" />
                            </motion.div>
                        </>
                    ) : (
                        <>
                            {/* REGISTRATION FORM */}
                            <motion.div initial="hidden" animate="visible" transition={{ delay: 0.1 }} className="relative">
                                <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input name="doctorId" type="text" placeholder="NMC Doctor ID" value={formData.doctorId} onChange={handleChange} required disabled={isVerified} className="w-full pl-10 p-2 border rounded-md disabled:bg-gray-100" />
                            </motion.div>
                            <motion.div initial="hidden" animate="visible" transition={{ delay: 0.2 }} className="relative">
                                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input name="licenseNumber" type="text" placeholder="Registration Number" value={formData.licenseNumber} onChange={handleChange} required disabled={isVerified} className="w-full pl-10 p-2 border rounded-md disabled:bg-gray-100" />
                            </motion.div>
                            
                            {isVerified && (
                                <>
                                    <motion.div initial="hidden" animate="visible" transition={{ delay: 0.3 }} className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input name="username" type="text" placeholder="Choose a Username" value={formData.username} onChange={handleChange} required className="w-full pl-10 p-2 border rounded-md" />
                                    </motion.div>
                                    <motion.div initial="hidden" animate="visible" transition={{ delay: 0.4 }} className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input name="email" type="email" placeholder="Email Address for Login" value={formData.email} onChange={handleChange} required className="w-full pl-10 p-2 border rounded-md" />
                                    </motion.div>
                                    <motion.div initial="hidden" animate="visible" transition={{ delay: 0.5 }} className="relative">
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input name="password" type="password" placeholder="Create a Password" value={formData.password} onChange={handleChange} required className="w-full pl-10 p-2 border rounded-md" />
                                    </motion.div>
                                </>
                            )}
                        </>
                    )}

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    {success && <p className="text-green-500 text-sm text-center">{success}</p>}
                    
                    {verifiedDoctor && (
                        <motion.div
                            className="mt-4 p-4 bg-green-50 border border-green-300 rounded-xl"
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        >
                            <div className="flex items-center gap-2 text-green-700">
                                <CheckCircle2 size={20} /><h3 className="font-semibold">Verified Details</h3>
                            </div>
                            <p className="text-sm mt-1"><b>Name:</b> {verifiedDoctor.name}</p>
                            <p className="text-sm"><b>Council:</b> {verifiedDoctor.council}</p>
                        </motion.div>
                    )}

                    <motion.button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center gap-2 bg-indigo-600 text-white p-3 rounded-lg font-semibold"
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    >
                        {loading ? 'Processing...' : (
                            isLoginView ? <><LogIn size={20}/> Sign In</> : 
                            isVerified ? <><UserPlus size={20}/> Create Account</> : 'Verify Identity'
                        )}
                    </motion.button>
                </form>

                <p className="text-center text-sm text-gray-600">
                    {isLoginView ? "Don't have an account?" : 'Already have an account?'}
                    <button onClick={toggleView} className="font-medium text-indigo-600 hover:underline ml-1">
                        {isLoginView ? 'Sign Up' : 'Sign In'}
                    </button>
                </p>
            </motion.div>
        </div>
    );
}

import React, { useState } from 'react';

const ContactScreen: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'submitted' | 'error'>('idle');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !message) {
            alert('Please fill out all fields.');
            return;
        }
        setStatus('submitting');
        // Simulate a network request
        setTimeout(() => {
            console.log('Form submitted:', { name, email, message });
            setStatus('submitted');
            setName('');
            setEmail('');
            setMessage('');
        }, 1000);
    };

    if (status === 'submitted') {
        return (
            <div className="max-w-xl mx-auto text-center bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Thank You!</h1>
                <p className="text-slate-600">Your message has been sent successfully. We'll get back to you as soon as possible.</p>
                <button 
                    onClick={() => setStatus('idle')}
                    className="mt-6 px-6 py-2 bg-sky-500 text-white font-semibold rounded-lg shadow-md hover:bg-sky-600 transition-all"
                >
                    Send Another Message
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-slate-800">Get in Touch</h1>
                <p className="mt-2 text-slate-600">Have a question or feedback? Fill out the form below to send us a message.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">Full Name</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                        placeholder="Jane Doe"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                        placeholder="you@example.com"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-slate-700">Message</label>
                    <textarea
                        id="message"
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                        placeholder="Your question or feedback..."
                        required
                    ></textarea>
                </div>
                <div>
                    <button
                        type="submit"
                        disabled={status === 'submitting'}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-sky-300"
                    >
                        {status === 'submitting' ? 'Sending...' : 'Send Message'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ContactScreen;

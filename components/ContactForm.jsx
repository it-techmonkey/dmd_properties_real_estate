import { useState } from 'react';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    event: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage('');

    // Check for empty fields
    const emptyFields = [];
    if (!formData.name.trim()) emptyFields.push('Name');
    if (!formData.email.trim()) emptyFields.push('Email');
    if (!formData.phone.trim()) emptyFields.push('Phone');
    if (!formData.subject.trim()) emptyFields.push('Subject');
    if (!formData.event.trim()) emptyFields.push('Event');
    if (!formData.message.trim()) emptyFields.push('Message');

    if (emptyFields.length > 0) {
      setErrorMessage(`Please fill in: ${emptyFields.join(', ')}`);
      setSubmitStatus('error');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          event: formData.event,
          message: formData.message,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          event: '',
          message: '',
        });
      } else {
        setErrorMessage(result.error || 'Something went wrong. Please try again later.');
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setErrorMessage('Something went wrong. Please try again later.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact-form" className="relative bg-black scroll-mt-20 font-jakarta">
      {/* White gradient fade from bottom going up 3/4 of the section */}
      <div className="absolute bottom-0 left-0 right-0 h-2/6 bg-gradient-to-t from-white/10 via-white/[0.02] to-transparent pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-20">
        {/* Section Title */}
        <h2 className="text-white text-3xl md:text-4xl font-light mb-10 md:mb-12 font-heading">
          Get in Touch
        </h2>

        {/* Success Message */}
        {submitStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400">
            Thank you! Your message has been sent successfully. We'll get back to you soon.
          </div>
        )}

        {/* Error Message */}
        {submitStatus === 'error' && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
            {errorMessage}
          </div>
        )}

        {/* Contact Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Row 1: Name, Email, Phone */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Name */}
            <div>
              <label 
                htmlFor="name" 
                className="block text-gray-300 text-sm mb-2"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Rachel Joe"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-[#1a1a1a] border-2 border-gray-600 rounded-md px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-electric-500 focus:ring-1 focus:ring-electric-500 transition-colors duration-200"
              />
            </div>

            {/* Email */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-gray-300 text-sm mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="rachel@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-[#1a1a1a] border-2 border-gray-600 rounded-md px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-electric-500 focus:ring-1 focus:ring-electric-500 transition-colors duration-200"
              />
            </div>

            {/* Phone */}
            <div>
              <label 
                htmlFor="phone" 
                className="block text-gray-300 text-sm mb-2"
              >
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-[#1a1a1a] border-2 border-gray-600 rounded-md px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-electric-500 focus:ring-1 focus:ring-electric-500 transition-colors duration-200"
              />
            </div>
          </div>

          {/* Row 2: Subject and Event */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="subject"
                className="block text-gray-300 text-sm mb-2"
              >
                Subject
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                placeholder="What is this about?"
                value={formData.subject}
                onChange={handleChange}
                className="w-full bg-[#1a1a1a] border-2 border-gray-600 rounded-md px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-electric-500 focus:ring-1 focus:ring-electric-500 transition-colors duration-200"
              />
            </div>

            <div>
              <label
                htmlFor="event"
                className="block text-gray-300 text-sm mb-2"
              >
                Event
              </label>
              <input
                type="text"
                id="event"
                name="event"
                placeholder="Event name or type"
                value={formData.event}
                onChange={handleChange}
                className="w-full bg-[#1a1a1a] border-2 border-gray-600 rounded-md px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-electric-500 focus:ring-1 focus:ring-electric-500 transition-colors duration-200"
              />
            </div>
          </div>

          {/* Row 3: Message (full width) */}
          <div>
            <label
              htmlFor="message"
              className="block text-gray-300 text-sm mb-2"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              placeholder="Your message here..."
              rows="4"
              value={formData.message}
              onChange={handleChange}
              className="w-full bg-[#1a1a1a] border-2 border-gray-600 rounded-md px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-electric-500 focus:ring-1 focus:ring-electric-500 transition-colors duration-200 resize-none"
            ></textarea>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-1/2 md:w-1/3 max-w-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black"
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </section>
  );
}

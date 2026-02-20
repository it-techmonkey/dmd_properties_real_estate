import { useState, useEffect } from 'react';

export default function ManageDataModal({
  show,
  data,
  type = 'enquiry', // 'enquiry' or 'lead'
  mode = 'edit', // 'create' or 'edit'
  onClose,
  onSave,
  onDelete,
  onMoveToLeads, // Only for enquiries
  onStatusChange, // Only for leads
  onSalesStageChange, // Only for leads
  loading = false,
  salesStages = [], // For leads
}) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    employer: '',
    propertyInterests: '',
    nationality: '',
    dateOfBirth: '',
    homeAddress: '',
    notes: '',
    clientFolderLink: '',
    event: '',
    // Lead-specific fields
    projectName: '',
    price: '',
    priceUnit: 'K',
    type: '',
    intent: '',
    status: '',
    salesStage: '',
  });

  const [moveData, setMoveData] = useState({
    projectName: '',
    price: '',
    priceUnit: 'K',
    type: '',
    intent: '',
  });

  const [showLeadSection, setShowLeadSection] = useState(false);
  const [formError, setFormError] = useState('');
  const [moveError, setMoveError] = useState('');

  // Load data when modal opens
  useEffect(() => {
    if (show && data) {
      if (type === 'enquiry') {
        setFormData({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: data.email || '',
          phone: data.phone || '',
          jobTitle: data.job_title || '',
          employer: data.employer || '',
          propertyInterests: data.property_interests || '',
          nationality: data.nationality || '',
          dateOfBirth: data.date_of_birth ? data.date_of_birth.split('T')[0] : '',
          homeAddress: data.home_address || '',
          notes: data.notes || '',
          clientFolderLink: data.client_folder_link || '',
          event: data.event || '',
        });
        setMoveData({
          projectName: '',
          price: '',
          priceUnit: 'K',
          type: '',
          intent: '',
        });
      } else if (type === 'lead') {
        const numericPrice = Number(data.price) || 0;
        let derivedUnit = 'K';
        let derivedPrice = data.price || '';
        if (numericPrice >= 1_000_000) {
          derivedUnit = 'M';
          derivedPrice = (numericPrice / 1_000_000).toString();
        } else if (numericPrice >= 1_000) {
          derivedUnit = 'K';
          derivedPrice = (numericPrice / 1_000).toString();
        } else if (numericPrice > 0) {
          derivedUnit = 'K';
          derivedPrice = numericPrice.toString();
        }
        setFormData({
          firstName: data.name ? data.name.split(' ')[0] : '',
          lastName: data.name ? data.name.split(' ').slice(1).join(' ') : '',
          email: data.email || '',
          phone: data.phone || '',
          jobTitle: data.job_title || '',
          employer: data.employer || '',
          propertyInterests: data.property_interests || '',
          nationality: data.nationality || '',
          dateOfBirth: data.date_of_birth ? data.date_of_birth.split('T')[0] : '',
          homeAddress: data.home_address || '',
          notes: data.notes || '',
          clientFolderLink: data.client_folder_link || '',
          projectName: data.project_name || '',
          price: derivedPrice,
          priceUnit: derivedUnit,
          type: data.type || '',
          intent: data.intent || '',
          status: data.status || 'WARM',
          salesStage: data.sales_stage || 'New Inquiry',
        });
      }
      setShowLeadSection(false);
      setFormError('');
      setMoveError('');
    }
  }, [show, data, type]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateFields = () => {
    if (!formData.firstName.trim()) {
      setFormError('First name is required.');
      return false;
    }
    if (!formData.lastName.trim()) {
      setFormError('Last name is required.');
      return false;
    }
    if (formData.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) {
      setFormError('A valid email address is required.');
      return false;
    }
    if (formData.phone.trim() && !/^\+?[0-9\s-]{7,}$/.test(formData.phone)) {
      setFormError('A valid phone number is required.');
      return false;
    }
    return true;
  };

  const validateLeadFields = () => {
    // Phone validation removed - will use from enquiry
    return true;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    setMoveError('');

    if (!validateFields()) {
      return;
    }

    const success = await onSave(data?.id || null, formData);
    if (success) {
      handleClose();
    }
  };

  const handleDelete = async () => {
    const name = type === 'enquiry' 
      ? `${formData.firstName} ${formData.lastName}`
      : formData.firstName + ' ' + formData.lastName;
      
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }

    const success = await onDelete(data.id);
    if (success) {
      handleClose();
    }
  };

  const handleMoveToLead = async () => {
    setFormError('');
    setMoveError('');

    if (!validateFields()) {
      return;
    }

    const success = await onMoveToLeads(data.id, {
      enquiryName: `${formData.firstName} ${formData.lastName}`.trim(),
      moveData: { ...moveData },
      formDataSnapshot: { ...formData },
    });

    if (success) {
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      jobTitle: '',
      employer: '',
      propertyInterests: '',
      nationality: '',
      dateOfBirth: '',
      homeAddress: '',
      notes: '',
      clientFolderLink: '',
      event: '',
      projectName: '',
      price: '',
      priceUnit: 'K',
      type: '',
      intent: '',
      status: '',
      salesStage: '',
    });
    setMoveData({
      projectName: '',
      price: '',
      priceUnit: 'K',
      type: '',
      intent: '',
    });
    setShowLeadSection(false);
    setFormError('');
    setMoveError('');
    onClose();
  };

  if (!show) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'HOT':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'WARM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'COLD':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === 'create' ? 'Create' : 'Manage'} {type === 'enquiry' ? 'Enquiry' : 'Lead'}{mode === 'edit' ? ` - ${formData.firstName} ${formData.lastName}` : ''}
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 text-2xl disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {/* Error Messages */}
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {formError}
            </div>
          )}

          {/* Basic Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              {type === 'enquiry' ? 'Enquiry' : 'Lead'} Details
            </h3>

            {/* Row 1: First & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  First Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="John"
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Last Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Doe"
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Row 2: Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+971 50 123 4567"
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Row 3: Job Title & Employer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Job Title</label>
                <input
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleInputChange}
                  placeholder="Real Estate Manager"
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Employer</label>
                <input
                  type="text"
                  name="employer"
                  value={formData.employer}
                  onChange={handleInputChange}
                  placeholder="ABC Corp"
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Row 4: Nationality & Date of Birth */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Nationality</label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  placeholder="e.g., UAE"
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Property Interests */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Property Interests</label>
              <textarea
                name="propertyInterests"
                value={formData.propertyInterests}
                onChange={handleInputChange}
                placeholder="Apartment, Villa, 2-3 bedrooms"
                rows="2"
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
              ></textarea>
            </div>

            {/* Home Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Home Address</label>
              <textarea
                name="homeAddress"
                value={formData.homeAddress}
                onChange={handleInputChange}
                placeholder="Street, City, Country"
                rows="2"
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
              ></textarea>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes..."
                rows="3"
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
              ></textarea>
            </div>

            {/* Client Folder Link */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Client Folder Link</label>
              <input
                type="url"
                name="clientFolderLink"
                value={formData.clientFolderLink}
                onChange={handleInputChange}
                placeholder="https://drive.google.com/..."
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
              />
            </div>

            {/* Event */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Event</label>
              <input
                type="text"
                name="event"
                value={formData.event}
                onChange={handleInputChange}
                placeholder="e.g., Website Inquiry, Phone Call, Referral"
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Lead-specific sections */}
          {type === 'lead' && (
            <div className="space-y-4 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Lead Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                  >
                    <option value="HOT">HOT</option>
                    <option value="WARM">WARM</option>
                    <option value="COLD">COLD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Sales Stage</label>
                  <select
                    name="salesStage"
                    value={formData.salesStage}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                  >
                    {salesStages.map((stage) => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Project Name</label>
                <input
                  type="text"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleInputChange}
                  placeholder="e.g., Marina Bay Towers"
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Budget (AED)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="500"
                      disabled={loading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                    />
                    <select
                      name="priceUnit"
                      value={formData.priceUnit}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                    >
                      <option value="K">K</option>
                      <option value="M">M</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Unit Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                  >
                    <option value="">Select type</option>
                    <option value="Studio">Studio</option>
                    <option value="1 BHK">1 BHK</option>
                    <option value="2 BHK">2 BHK</option>
                    <option value="3 BHK">3 BHK</option>
                    <option value="4 BHK">4 BHK</option>
                    <option value="Townhouse">Townhouse</option>
                    <option value="Villa">Villa</option>
                    <option value="Penthouse">Penthouse</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Client Intent</label>
                <select
                  name="intent"
                  value={formData.intent}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                >
                  <option value="">Select intent</option>
                  <option value="Investment Property">Investment Property</option>
                  <option value="Primary Residence">Primary Residence</option>
                </select>
              </div>
            </div>
          )}

          {/* Lead Conversion Section (Enquiries only, edit mode only) */}
          {type === 'enquiry' && mode === 'edit' && (
            <div className="border-t border-gray-200 pt-6">
              <button
                type="button"
                onClick={() => setShowLeadSection(!showLeadSection)}
                disabled={loading}
                className="flex items-center justify-between w-full text-left mb-4 disabled:opacity-50"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  Lead Conversion (Optional)
                </h3>
                <span className="text-gray-500 text-xl">
                  {showLeadSection ? '▼' : '▶'}
                </span>
              </button>

              {showLeadSection && (
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                  {moveError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {moveError}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Inquiry</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={moveData.projectName}
                        onChange={(e) => setMoveData({ ...moveData, projectName: e.target.value })}
                        placeholder="e.g., Marina Bay Towers"
                        disabled={loading}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setMoveData({ ...moveData, projectName: formData.propertyInterests || '' })}
                        disabled={loading}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg text-xs font-medium whitespace-nowrap disabled:opacity-50"
                        title="Copy property interest from enquiry"
                      >
                        Same as enquiry
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Client Intent</label>
                    <select
                      value={moveData.intent}
                      onChange={(e) => setMoveData({ ...moveData, intent: e.target.value })}
                      disabled={loading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                    >
                      <option value="">Select intent</option>
                      <option value="Investment Property">Investment Property</option>
                      <option value="Primary Residence">Primary Residence</option>
                    </select>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <p className="text-sm font-semibold text-gray-900 mb-3">Budget</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={moveData.price}
                            onChange={(e) => setMoveData({ ...moveData, price: e.target.value })}
                            placeholder="500"
                            disabled={loading}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                          />
                          <select
                            value={moveData.priceUnit}
                            onChange={(e) => setMoveData({ ...moveData, priceUnit: e.target.value })}
                            disabled={loading}
                            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                          >
                            <option value="K">K</option>
                            <option value="M">M</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Unit Type</label>
                        <select
                          value={moveData.type}
                          onChange={(e) => setMoveData({ ...moveData, type: e.target.value })}
                          disabled={loading}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                        >
                          <option value="">Select type</option>
                          <option value="Studio">Studio</option>
                          <option value="1 BHK">1 BHK</option>
                          <option value="2 BHK">2 BHK</option>
                          <option value="3 BHK">3 BHK</option>
                          <option value="4 BHK">4 BHK</option>
                          <option value="Townhouse">Townhouse</option>
                          <option value="Villa">Villa</option>
                          <option value="Penthouse">Penthouse</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
          {/* Delete Button - Left Side (only in edit mode) */}
          {mode === 'edit' && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>}
              🗑️ Delete {type === 'enquiry' ? 'Enquiry' : 'Lead'}
            </button>
          )}

          {/* Right Side Actions */}
          <div className={`flex gap-3 ${mode === 'create' ? 'w-full justify-end' : 'justify-end'}`}>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-900 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            
            {type === 'enquiry' && showLeadSection && (
              <button
                type="button"
                onClick={handleMoveToLead}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>}
                → Move to Lead
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>}
              {mode === 'create' ? '+ Create' : '💾 Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

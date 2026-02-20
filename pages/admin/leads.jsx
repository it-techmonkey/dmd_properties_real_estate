import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Cookies from 'js-cookie';
import { useAuth } from '../../context/AuthContext';
import AdminHeader from '../../components/AdminHeader';
import ManageDataModal from '../../components/ManageDataModal';
import SuccessPopup from '../../components/SuccessPopup';

export default function AdminLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [manageModal, setManageModal] = useState({ show: false, lead: null });
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();

  const salesStages = [
    'New Inquiry',
    'Contacted',
    'Requirements Captured',
    'Qualified Lead',
    'Property Shared',
    'Shortlisted',
    'Site Visit Scheduled',
    'Site Visit Done',
    'Negotiation',
    'Offer Made',
    'Offer Accepted',
    'Booking / Reservation',
    'SPA Issued',
    'SPA Signed',
    'Mortgage Approved',
    'Oqood Registered / Title Deed Issued',
    'Deal Closed – Won',
    'Deal Lost',
    'Post-Sale Follow-up'
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // Get status from URL query
    if (router.query.status) {
      setStatusFilter(router.query.status);
    }
  }, [router.query]);

  useEffect(() => {
    if (user) {
      fetchLeads();
    }
  }, [user, statusFilter, search]);

  const fetchLeads = async () => {
    try {
      const token = Cookies.get('admin_token');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await fetch(`/api/admin/leads?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads);
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenManageModal = (lead) => {
    setManageModal({ show: true, lead });
  };

  const handleCloseManageModal = () => {
    setManageModal({ show: false, lead: null });
  };

  const handleSaveLead = async (leadId, formData) => {
    setActionLoading(true);
    try {
      const token = Cookies.get('admin_token');
      const res = await fetch('/api/admin/leads', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: leadId,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          phone: formData.phone,
          job_title: formData.jobTitle,
          employer: formData.employer,
          property_interests: formData.propertyInterests,
          nationality: formData.nationality,
          date_of_birth: formData.dateOfBirth,
          home_address: formData.homeAddress,
          notes: formData.notes,
          client_folder_link: formData.clientFolderLink,
          project_name: formData.projectName,
          price: formData.price,
          type: formData.type,
          intent: formData.intent,
          status: formData.status,
          sales_stage: formData.salesStage,
        }),
      });

      if (res.ok) {
        fetchLeads();
        setSuccessMessage('Lead updated successfully');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setActionLoading(false);
        return true;
      }
      setActionLoading(false);
      return false;
    } catch (error) {
      console.error('Failed to update lead:', error);
      setActionLoading(false);
      return false;
    }
  };

  const handleStatusChange = async (lead, newStatus) => {
    setActionLoading(true);
    try {
      const token = Cookies.get('admin_token');
      const res = await fetch('/api/admin/leads', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: lead.id,
          status: newStatus,
        }),
      });

      if (res.ok) {
        fetchLeads();
        setActionLoading(false);
        return true;
      }
      setActionLoading(false);
      return false;
    } catch (error) {
      console.error('Failed to update status:', error);
      setActionLoading(false);
      return false;
    }
  };

  const handleSalesStageChange = async (lead, newSalesStage) => {
    setActionLoading(true);
    try {
      const token = Cookies.get('admin_token');
      const res = await fetch('/api/admin/leads', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: lead.id,
          sales_stage: newSalesStage,
        }),
      });

      if (res.ok) {
        fetchLeads();
        setActionLoading(false);
        return true;
      }
      setActionLoading(false);
      return false;
    } catch (error) {
      console.error('Failed to update sales stage:', error);
      setActionLoading(false);
      return false;
    }
  };

  const handleDeleteLead = async (leadId) => {
    setActionLoading(true);
    try {
      const token = Cookies.get('admin_token');
      const res = await fetch('/api/admin/leads', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: leadId }),
      });

      if (res.ok) {
        fetchLeads();
        setSuccessMessage('Lead deleted successfully');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setActionLoading(false);
        return true;
      }
      setActionLoading(false);
      return false;
    } catch (error) {
      console.error('Failed to delete lead:', error);
      setActionLoading(false);
      return false;
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    const num = Number(price);
    if (num >= 1000000) {
      return `AED ${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `AED ${(num / 1000).toFixed(0)}K`;
    }
    return `AED ${num.toLocaleString()}`;
  };

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

  if (authLoading || (loading && !leads.length)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <Head>
        <title>Leads | Admin Panel</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Admin Header */}
        <AdminHeader />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Leads Management</h1>
            <p className="text-gray-600">Track and manage your sales leads</p>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8 items-start sm:items-center justify-between">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchLeads()}
                className="px-3 py-1 bg-transparent hover:bg-gray-100 disabled:opacity-50 text-gray-700 font-medium rounded text-sm transition-colors flex items-center gap-1 border border-gray-300"
              >
                🔄 Refresh
              </button>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              >
                <option value="all">All Statuses</option>
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
              </select>
            </div>
          </div>

          {/* Leads Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm relative min-h-[70vh]">
            <div className="overflow-x-auto overflow-y-visible">
              <div className="w-full min-h-[360px] sm:min-h-[440px]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Client Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Project</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Sales Stage</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Value</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Phone</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center text-gray-500 py-12">
                        No leads found
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => (
                      <tr 
                        key={lead.id} 
                        onClick={() => handleOpenManageModal(lead)}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <span className="text-gray-900 font-medium">{lead.name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600">{lead.project_name || '-'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600">
                            {(() => {
                              if (!lead.type) return '-';
                              let typeStr = lead.type;
                              if (typeStr.startsWith('{') && typeStr.endsWith('}')) {
                                const inner = typeStr.slice(1, -1);
                                const values = inner.split(',').map(v => v.replace(/^"|"$/g, '').trim());
                                return values.join(', ');
                              }
                              try {
                                // Try parsing as JSON array
                                const parsed = JSON.parse(typeStr);
                                if (Array.isArray(parsed)) {
                                  return parsed.join(', ');
                                }
                                return String(parsed);
                              } catch {
                                // Return as-is
                                return typeStr;
                              }
                            })()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-3 py-1 rounded border font-medium ${getStatusColor(lead.status)}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 border border-blue-300 font-medium">
                            {lead.sales_stage || 'New Inquiry'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-teal-600 font-semibold">{formatPrice(lead.price)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600">{lead.phone}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenManageModal(lead);
                            }}
                            className="text-gray-600 hover:text-gray-800 p-2 rounded hover:bg-gray-100 transition-colors"
                            title="Manage Lead"
                          >
                            ⚙️
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>
            </div>

            {/* Count */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-gray-600 text-sm">Showing {leads.length} leads</p>
            </div>
          </div>
        </main>

        {/* Lead Manage Modal */}
        <ManageDataModal
          show={manageModal.show}
          data={manageModal.lead}
          type="lead"
          onClose={handleCloseManageModal}
          onSave={handleSaveLead}
          onDelete={handleDeleteLead}
          loading={actionLoading}
          salesStages={salesStages}
        />

        {/* Action Loading Overlay */}
        {actionLoading && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
              <p className="text-gray-700 font-medium">Processing...</p>
            </div>
          </div>
        )}

        {/* Success Popup */}
        {showSuccess && <SuccessPopup message={successMessage} />}
      </div>
    </>
  );
}

// Exclude from main layout
AdminLeads.getLayout = function getLayout(page) {
  return page;
};

import { useState, useEffect, useRef } from 'react';
import SuccessPopup from '../../components/SuccessPopup';
import ManageDataModal from '../../components/ManageDataModal';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Cookies from 'js-cookie';
import { useAuth } from '../../context/AuthContext';
import AdminHeader from '../../components/AdminHeader';

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true); // full-page loader for initial fetch
  const [listLoading, setListLoading] = useState(false); // lightweight loader for list refreshes
  const [actionLoading, setActionLoading] = useState(false); // loading for individual actions
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEnquiries, setTotalEnquiries] = useState(0);
  const [manageModal, setManageModal] = useState({ show: false, enquiry: null });
  const [createModal, setCreateModal] = useState({ show: false });
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const hasLoadedEnquiries = useRef(false);

  const handleOpenManageModal = (enquiry) => {
    setManageModal({ show: true, enquiry });
  };

  const handleCloseManageModal = () => {
    setManageModal({ show: false, enquiry: null });
  };

  const getDisplayName = (enquiry) => {
    const combined = [enquiry.first_name, enquiry.last_name].filter(Boolean).join(' ').trim();
    if (combined) return combined;
    if (enquiry.name) return enquiry.name;
    return '—';
  };

  const getInterestedProperty = (enquiry) => {
    const source = enquiry.message || enquiry.property_interests || enquiry.propertyInterests || enquiry.subject || '';
    const cleaned = source.replace(/^property:\s*/i, '').trim();
    return cleaned || '—';
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);

  const fetchEnquiries = async ({ showPageLoader = false, pageOverride } = {}) => {
    try {
      if (showPageLoader) {
        setLoading(true);
      } else {
        setListLoading(true);
      }
      const currentPage = pageOverride ?? page;
      const token = Cookies.get('admin_token');
      const res = await fetch(
        `/api/admin/enquiries?search=${encodeURIComponent(searchQuery)}&page=${currentPage}&pageSize=${pageSize}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setEnquiries(data.enquiries);
        if (data.pagination) {
          setPage(data.pagination.page || currentPage);
          setTotalPages(data.pagination.totalPages || 1);
          setTotalEnquiries(data.pagination.total || 0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch enquiries:', error);
    } finally {
      if (showPageLoader) {
        setLoading(false);
      } else {
        setListLoading(false);
      }
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setPage(1);
    setSearchQuery(query);
  };

  const handlePageChange = (direction) => {
    setPage((prev) => {
      const next = prev + direction;
      if (next < 1) return 1;
      if (next > totalPages) return totalPages;
      return next;
    });
  };


  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      fetchEnquiries({ showPageLoader: !hasLoadedEnquiries.current });
      hasLoadedEnquiries.current = true;
    }, 250);
    return () => clearTimeout(timer);
  }, [user, searchQuery, page]);

  const handleSaveEnquiry = async (enquiryId, formData) => {
    setActionLoading(true);

    try {
      const token = Cookies.get('admin_token');
      const isCreate = !enquiryId;
      const url = `/api/admin/enquiries`;
      const method = isCreate ? 'POST' : 'PUT';
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };
      const body = JSON.stringify(
        isCreate
          ? {
              first_name: formData.firstName,
              last_name: formData.lastName,
              email: formData.email,
              phone: formData.phone,
              subject: 'Manual Entry',
              message: formData.propertyInterests || 'N/A',
              event: formData.event,
              job_title: formData.jobTitle,
              employer: formData.employer,
              property_interests: formData.propertyInterests,
              notes: formData.notes,
              client_folder_link: formData.clientFolderLink,
              nationality: formData.nationality,
              date_of_birth: formData.dateOfBirth,
              home_address: formData.homeAddress,
            }
          : {
              id: enquiryId,
              first_name: formData.firstName,
              last_name: formData.lastName,
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
              event: formData.event,
            }
      );

      const res = await fetch(url, {
        method,
        headers,
        body,
      });

      if (!res.ok) {
        let errorMsg = 'Failed to save enquiry';
        try {
          const error = await res.json();
          if (error && error.error) errorMsg = error.error;
        } catch {}
        if (res.status === 405) {
          errorMsg = "Invalid request method. Please contact support.";
        }
        console.error(errorMsg);
        setActionLoading(false);
        return false;
      }

      await fetchEnquiries({ pageOverride: page });
      setSuccessMessage(isCreate ? 'Enquiry created successfully' : 'Enquiry updated successfully');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setActionLoading(false);
      return true;
    } catch (error) {
      console.error('Error saving enquiry:', error);
      setActionLoading(false);
      return false;
    }
  };

  const handleDeleteEnquiry = async (enquiryId) => {
    setActionLoading(true);

    try {
      const token = Cookies.get('admin_token');
      const res = await fetch(`/api/admin/enquiries`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: enquiryId }),
      });

      if (res.ok) {
        const isLastOnPage = enquiries.length === 1 && page > 1;
        const nextPage = isLastOnPage ? page - 1 : page;
        setPage(nextPage);
        await fetchEnquiries({ pageOverride: nextPage });
        setSuccessMessage('Enquiry deleted successfully');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setActionLoading(false);
        return true;
      }
      setActionLoading(false);
      return false;
    } catch (error) {
      console.error('Error deleting enquiry:', error);
      setActionLoading(false);
      return false;
    }
  };

  const handleMoveToLeads = async (enquiryId, { enquiryName, moveData, formDataSnapshot }) => {
    setActionLoading(true);

    try {
      const token = Cookies.get('admin_token');
      const basePrice = parseFloat(moveData.price);
      const finalPrice = Number.isNaN(basePrice)
        ? null
        : basePrice * (moveData.priceUnit === 'M' ? 1_000_000 : moveData.priceUnit === 'K' ? 1_000 : 1);

      const leadPayload = {
        // Contact
        name: `${formDataSnapshot?.firstName || ''} ${formDataSnapshot?.lastName || ''}`.trim() || enquiryName,
        email: formDataSnapshot?.email || undefined,
        phone: formDataSnapshot?.phone || undefined,
        // Lead details
        projectName: moveData.projectName,
        price: finalPrice,
        type: moveData.type,
        intent: moveData.intent,
        status: 'HOT',
        salesStage: 'New Inquiry',
        // Profile fields
        job_title: formDataSnapshot?.jobTitle,
        employer: formDataSnapshot?.employer,
        property_interests: formDataSnapshot?.propertyInterests,
        notes: formDataSnapshot?.notes,
        client_folder_link: formDataSnapshot?.clientFolderLink,
        nationality: formDataSnapshot?.nationality,
        date_of_birth: formDataSnapshot?.dateOfBirth || null,
        home_address: formDataSnapshot?.homeAddress,
      };

      const res = await fetch(`/api/admin/move-to-leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sourceId: enquiryId,
          sourceType: 'enquiry',
          leadData: leadPayload,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        console.error(error.error || 'Failed to move enquiry to leads');
        setActionLoading(false);
        return false;
      }

      // After successful lead creation, delete the enquiry
      const deleteRes = await fetch(`/api/admin/enquiries`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: enquiryId }),
      });

      if (deleteRes.ok) {
        const isLastOnPage = enquiries.length === 1 && page > 1;
        const nextPage = isLastOnPage ? page - 1 : page;
        setPage(nextPage);
        await fetchEnquiries({ pageOverride: nextPage });
        setSuccessMessage(`${enquiryName} moved to leads successfully`);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setActionLoading(false);
        return true;
      } else {
        console.error('Failed to complete move operation');
        setActionLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Error moving to leads:', error);
      setActionLoading(false);
      return false;
    }
  };

  if (authLoading || loading) {
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
        <title>Enquiries | Admin Panel</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Admin Header */}
        <AdminHeader />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-12">
          {/* Page Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Enquiry Management</h1>
            <p className="text-gray-600">Manage enquiries database and convert enquiries to leads</p>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8 items-start sm:items-center justify-between">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="flex gap-2 items-center">
              <button
                onClick={() => setCreateModal({ show: true })}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded text-sm transition-colors flex items-center gap-1"
                title="Create new enquiry"
              >
                + Create Enquiry
              </button>
              <button
                onClick={() => {
                  setPage(1);
                  fetchEnquiries({ showPageLoader: true, pageOverride: 1 });
                }}
                disabled={listLoading}
                className="px-6 py-2.5 bg-transparent hover:bg-gray-100 disabled:opacity-50 text-gray-700 font-medium rounded text-sm transition-colors flex items-center gap-1 border border-gray-300"
                title="Refresh enquiries list"
              >
                🔄 {listLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Enquiries Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm relative min-h-[60vh] -mx-4 sm:mx-0 sm:rounded-lg">
            {listLoading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-30">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-600"></div>
              </div>
            )}
            {enquiries.length === 0 ? (
              <div className="text-center py-12 px-4 sm:px-6">
                <p className="text-gray-500 mb-4">No enquiries found</p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div>
              <div className="overflow-x-auto overflow-y-visible">
                <div className="w-full min-h-[320px] sm:min-h-[380px]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900">Name</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900">Email</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900">Phone</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900">Interested Property</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900">Created</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-4 text-right text-xs sm:text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enquiries.map((enquiry, idx) => (
                      <tr 
                        key={enquiry.id} 
                        onClick={() => handleOpenManageModal(enquiry)}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="px-3 sm:px-6 py-2 sm:py-4">
                          <div className="font-medium text-gray-900 text-xs sm:text-sm">
                            {getDisplayName(enquiry)}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 text-gray-600 text-xs sm:text-sm">{enquiry.email || '-'}</td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 text-gray-600 text-xs sm:text-sm">{enquiry.phone || '-'}</td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 text-gray-600 text-xs sm:text-sm">{getInterestedProperty(enquiry)}</td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 text-gray-600 text-xs sm:text-sm">
                          {new Date(enquiry.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenManageModal(enquiry);
                            }}
                            className="text-gray-600 hover:text-gray-800 p-2 rounded hover:bg-gray-100 transition-colors"
                            title="Manage Enquiry"
                          >
                            ⚙️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 py-4 border-t border-gray-200 bg-white">
                <div className="text-sm text-gray-600">
                  Showing {totalEnquiries > 0 ? (page - 1) * pageSize + 1 : 0}–
                  {totalEnquiries > 0 ? Math.min((page - 1) * pageSize + pageSize, totalEnquiries) : 0} of {totalEnquiries}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(-1)}
                    disabled={page === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={page === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Enquiry Manage Modal */}
      <ManageDataModal
        show={manageModal.show}
        data={manageModal.enquiry}
        type="enquiry"
        mode="edit"
        onClose={handleCloseManageModal}
        onSave={handleSaveEnquiry}
        onDelete={handleDeleteEnquiry}
        onMoveToLeads={handleMoveToLeads}
        loading={actionLoading}
      />

      {/* Create Enquiry Modal */}
      <ManageDataModal
        show={createModal.show}
        data={null}
        type="enquiry"
        mode="create"
        onClose={() => setCreateModal({ show: false })}
        onSave={(id, formData) => handleSaveEnquiry(null, formData)}
        loading={actionLoading}
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
    </>
  );
}

// Exclude from main layout
EnquiriesPage.getLayout = function getLayout(page) {
  return page;
};

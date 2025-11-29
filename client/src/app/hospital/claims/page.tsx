'use client';

import { useEffect, useMemo, useState } from 'react';
import HospitalSidebar from '@/components/hospital/HospitalSidebar';
import MessageButton from '@/components/messaging/MessageButton';
import { useClaimsMessaging } from '@/contexts/ClaimsMessagingContext';
import {
  DocumentVerificationResult,
  DocumentTemplateKey,
  ensureDemoHashSeeded,
  getTemplateOptions,
  markHashAsSuspicious,
  verifyDocumentLocally,
  seedDemoHashesFromImages,
  clearDocumentHashes,
} from '@/utils/documentVerification';
import ClaimDetailsModal from '@/components/modals/ClaimDetailsModal';

export default function HospitalClaimsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [insurerFilter, setInsurerFilter] = useState('All Insurers');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [hashMarked, setHashMarked] = useState(false);
  const [verificationResult, setVerificationResult] = useState<DocumentVerificationResult | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [formState, setFormState] = useState({
    file: null as File | null,
    totalAmount: '',
    lineItemsTotal: '',
    admissionDate: '',
    dischargeDate: '',
    templateKey: '' as DocumentTemplateKey | '',
    snippet: '',
    treatmentCategory: '' as string | '',
  });
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [isClaimDetailsOpen, setIsClaimDetailsOpen] = useState(false);
  const { hasUnreadAlert } = useClaimsMessaging();
  const templateOptions = useMemo(() => getTemplateOptions(), []);

  useEffect(() => {
    ensureDemoHashSeeded();
    seedDemoHashesFromImages();
  }, []);

  const allClaims = [
    { id: 'CLM-8921', patient: 'John Doe', treatment: 'General Checkup', date: '2025-10-06', amount: '$1,250', status: 'Pending' },
    { id: 'CLM-8920', patient: 'Mary Johnson', treatment: 'X-Ray Scan', date: '2025-10-06', amount: '$450', status: 'Under Review' },
    { id: 'CLM-8919', patient: 'Robert Smith', treatment: 'Surgery', date: '2025-10-05', amount: '$5,200', status: 'Approved' },
    { id: 'CLM-8918', patient: 'Emily Davis', treatment: 'Blood Test', date: '2025-10-05', amount: '$820', status: 'Approved' },
    { id: 'CLM-8917', patient: 'Michael Wilson', treatment: 'Emergency Care', date: '2025-10-04', amount: '$3,100', status: 'Rejected' },
  ];

  // Filter claims based on search and filters
  const filteredClaims = allClaims.filter((claim) => {
    // Search filter - matches claim ID or patient name
    const matchesSearch = 
      searchQuery === '' ||
      claim.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.patient.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = 
      statusFilter === 'All Status' ||
      claim.status === statusFilter ||
      (statusFilter === 'Under Review' && claim.status === 'Under Review');

    return matchesSearch && matchesStatus;
  });
  
  return (
    <>
    <div className="min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <HospitalSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="ml-0 flex flex-col">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-4 lg:px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Claims Management</h1>
                  <p className="text-xs lg:text-sm text-gray-600">Manage and track insurance claims</p>
                </div>
              </div>
              <div className="hidden lg:flex items-center space-x-2 lg:space-x-4">
                <button className="bg-blue-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-blue-700 text-sm lg:text-base">
                  + Submit New Claim
                </button>
                {/* Temporarily hidden Upload Document button
                <button
                  onClick={() => {
                    setFormError(null);
                    setFormState({
                      file: null,
                      totalAmount: '',
                      lineItemsTotal: '',
                      admissionDate: '',
                      dischargeDate: '',
                      templateKey: '' as DocumentTemplateKey | '',
                      snippet: '',
                      treatmentCategory: '',
                    });
                    setUploadModalOpen(true);
                  }}
                  className="bg-green-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-green-700 text-sm lg:text-base"
                >
                  Upload Document
                </button>
                */}
                {/* Temporarily hidden Reset Hashes button
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="bg-gray-500 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-gray-600 text-sm lg:text-base"
                  title="Clear hash database for testing"
                >
                  Reset Hashes
                </button>
                */}
              </div>
            </div>
          </div>
          {/* Mobile button */}
          <div className="lg:hidden px-4 pt-2 pb-3">
            <div className="space-y-2">
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                + Submit New Claim
              </button>
              {/* Temporarily hidden Upload Document button
              <button
                onClick={() => {
                  setFormError(null);
                  setFormState({
                    file: null,
                    totalAmount: '',
                    lineItemsTotal: '',
                    admissionDate: '',
                    dischargeDate: '',
                    templateKey: '' as DocumentTemplateKey | '',
                    snippet: '',
                    treatmentCategory: '',
                  });
                  setUploadModalOpen(true);
                }}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
              >
                Upload Document
              </button>
              */}
              {/* Temporarily hidden Reset Hashes button
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 text-sm"
              >
                Reset Hashes
              </button>
              */}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Today&apos;s Claims</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-600">15</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Approved Today</p>
              <p className="text-2xl font-bold text-green-600">28</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold text-blue-600">Rs. 45.2K</p>
            </div>
          </div>
          
          {/* Claims Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-3 lg:p-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-2 lg:gap-4">
            <input
                  type="text"
                  placeholder="Search by claim ID or patient name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm lg:text-base"
                />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm lg:text-base"
                >
                  <option>All Status</option>
                  <option>Pending</option>
                  <option>Under Review</option>
                  <option>Approved</option>
                  <option>Rejected</option>
                </select>
                <select 
                  value={insurerFilter}
                  onChange={(e) => setInsurerFilter(e.target.value)}
                  className="px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm lg:text-base"
                >
                  <option>All Insurers</option>
                  <option>HealthGuard Insurance</option>
                  <option>MediCare Plus</option>
                  <option>SecureHealth</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Claim ID</th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                    <th className="hidden md:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Treatment</th>
                    <th className="hidden sm:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
              {filteredClaims.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        No claims found matching your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredClaims.map((claim) => {
                      const hasAlert = hasUnreadAlert(claim.id, 'hospital');
                      return (
                        <tr
                          key={claim.id}
                          className={`hover:bg-gray-50 ${hasAlert ? 'border-l-4 border-red-500' : ''}`}
                        >
                          <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm font-medium text-gray-900">{claim.id}</td>
                          <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm text-gray-900">{claim.patient}</td>
                          <td className="hidden md:table-cell px-3 lg:px-6 py-4 text-xs lg:text-sm text-gray-500">{claim.treatment}</td>
                          <td className="hidden sm:table-cell px-3 lg:px-6 py-4 text-xs lg:text-sm text-gray-500">{claim.date}</td>
                          <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm text-gray-900">{claim.amount}</td>
                          <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm">
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                              claim.status === 'Approved' ? 'bg-green-100 text-green-800' :
                              claim.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                              claim.status === 'Under Review' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {claim.status}
                            </span>
                          </td>
                          <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm">
                            <button 
                              onClick={() => {
                                setSelectedClaimId(claim.id);
                                setIsClaimDetailsOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              View
                            </button>
                          </td>
                          <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm">
                            <MessageButton claimId={claim.id} userRole="hospital" />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {selectedClaimId && (
            <ClaimDetailsModal
              isOpen={isClaimDetailsOpen}
              onClose={() => {
                setIsClaimDetailsOpen(false);
                setSelectedClaimId(null);
              }}
              claimId={selectedClaimId}
              claimData={allClaims.find(c => c.id === selectedClaimId)}
            />
          )}
      {/* Upload Modal */}
          {uploadModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
              <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b px-6 py-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Run Document Trust Checks</h2>
                    <p className="text-sm text-gray-500">Upload the hospital document and provide quick details for validation.</p>
                  </div>
                  <button
                    onClick={() => setUploadModalOpen(false)}
                    className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                    aria-label="Close upload modal"
                  >
                    ✕
                  </button>
                </div>
                <div className="max-h-[80vh] overflow-y-auto px-6 py-4 space-y-6">
                  {formError && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">Document File</label>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(event) => {
                        const nextFile = event.target.files?.[0] ?? null;
                        setFormState((prev) => ({ ...prev, file: nextFile }));
                      }}
                      className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 file:mr-4 file:rounded-md file:border-0 file:bg-green-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-green-700 hover:file:bg-green-200"
                    />
                    {formState.file && (
                      <div className="rounded-lg bg-gray-50 px-4 py-2 text-xs text-gray-600">
                        {formState.file.name} · {(formState.file.size / 1024).toFixed(1)} KB
                      </div>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Total Amount (PKR)</label>
                      <input
                        type="number"
                        min="0"
                        value={formState.totalAmount}
                        onChange={(event) => setFormState((prev) => ({ ...prev, totalAmount: event.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                        placeholder="e.g., 45000"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Sum of Line Items (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    value={formState.lineItemsTotal}
                    onChange={(event) => setFormState((prev) => ({ ...prev, lineItemsTotal: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                    placeholder="e.g., 44980"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Admission Date</label>
                  <input
                    type="date"
                    value={formState.admissionDate}
                    onChange={(event) => setFormState((prev) => ({ ...prev, admissionDate: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Discharge Date</label>
                  <input
                    type="date"
                    value={formState.dischargeDate}
                    onChange={(event) => setFormState((prev) => ({ ...prev, dischargeDate: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Hospital Template</label>
                <select
                  value={formState.templateKey}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, templateKey: event.target.value as DocumentTemplateKey | '' }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                >
                  <option value="">Select hospital template</option>
                  {templateOptions.map((template) => (
                    <option key={template.key} value={template.key}>
                      {template.label}
                    </option>
                  ))}
                </select>
                {formState.templateKey && (
                  <p className="rounded-lg bg-gray-50 px-4 py-2 text-xs text-gray-600">
                    Expected keywords: {templateOptions.find((template) => template.key === formState.templateKey)?.keywords.join(', ')}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Treatment Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formState.treatmentCategory}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, treatmentCategory: event.target.value }))
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                >
                  <option value="">Select treatment category</option>
                  <option value="Surgery">Surgery</option>
                  <option value="Emergency Care">Emergency Care</option>
                  <option value="Routine Checkup">Routine Checkup</option>
                  <option value="Lab Test">Lab Test</option>
                  <option value="Maternity">Maternity</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="General Consultation">General Consultation</option>
                </select>
                <p className="text-xs text-gray-500">
                  System will validate your selection against the claim amount
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Paste a text snippet from the document (used for template check)
                </label>
                <textarea
                  rows={3}
                  value={formState.snippet}
                  onChange={(event) => setFormState((prev) => ({ ...prev, snippet: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  placeholder="Example: City General Hospital Billing Department..."
                />
              </div>
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-xs text-yellow-900">
                Metadata checks are simulated in the UI until backend integration is available.
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
              <button
                onClick={() => setUploadModalOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!formState.file) {
                    setFormError('Please attach a document file.');
                    return;
                  }
                  if (!formState.treatmentCategory) {
                    setFormError('Please select a treatment category.');
                    return;
                  }
                  setFormError(null);
                  setIsVerifying(true);
                  setHashMarked(false);
                  try {
                    const result = await verifyDocumentLocally({
                      file: formState.file,
                      totalAmount: formState.totalAmount ? Number(formState.totalAmount) : undefined,
                      lineItemsTotal: formState.lineItemsTotal ? Number(formState.lineItemsTotal) : undefined,
                      admissionDate: formState.admissionDate,
                      dischargeDate: formState.dischargeDate,
                      templateKey: formState.templateKey,
                      documentSnippet: formState.snippet,
                      treatmentCategory: formState.treatmentCategory,
                    });
                    setVerificationResult(result);
                    setUploadModalOpen(false);
                    setResultModalOpen(true);
                  } catch (error) {
                    console.error('Verification error', error);
                    setFormError('Unable to run verification in the browser.');
                  } finally {
                    setIsVerifying(false);
                  }
                }}
                disabled={isVerifying}
                className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-400"
              >
                {isVerifying ? 'Processing…' : 'Run Verification'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {resultModalOpen && verificationResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Verification Result</h2>
                <p className="text-sm text-gray-500">Client-side checks completed successfully.</p>
              </div>
              <button
                onClick={() => {
                  setResultModalOpen(false);
                  setVerificationResult(null);
                }}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close result modal"
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Trust Score</p>
                    <p className="text-4xl font-bold text-gray-900">{verificationResult.score}</p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium ${
                      verificationResult.score >= 80
                        ? 'bg-green-100 text-green-800'
                        : verificationResult.score >= 50
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {verificationResult.score >= 80
                      ? 'Auto Accept'
                      : verificationResult.score >= 50
                        ? 'Needs Review'
                        : 'High Risk'}
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-600">{verificationResult.metadataNote}</p>
              </div>
              <div className="rounded-xl border border-gray-200 px-4 py-4">
                <p className="text-sm font-semibold text-gray-900">Reasons & Insights</p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-700">
                  {verificationResult.reasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
              {verificationResult.nearDuplicateDetected && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
                  <p className="font-medium">Near-duplicate document detected</p>
                  <p className="mt-1 text-xs text-orange-700">
                    This document is similar to a previously uploaded document (slightly edited version).
                  </p>
                </div>
              )}
              {!verificationResult.nearDuplicateDetected &&
                verificationResult.perceptualWarningSimilarity !== undefined && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                    <p className="font-medium">Possible document reuse detected</p>
                    <p className="mt-1 text-xs text-yellow-700">
                      This document is {(verificationResult.perceptualWarningSimilarity * 100).toFixed(1)}% similar to a
                      previous upload. Manual review is recommended.
                    </p>
                  </div>
                )}
              <div className="rounded-xl border border-gray-200 px-4 py-4 space-y-2 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">SHA-256 Hash</span>
                  <code className="break-all text-xs text-gray-500">{verificationResult.sha256 ?? 'Unavailable'}</code>
                </div>
                {verificationResult.perceptualHash && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">Perceptual Hash</span>
                    <code className="break-all text-xs text-gray-500">{verificationResult.perceptualHash}</code>
                  </div>
                )}
                {verificationResult.templateLabel && (
                  <p>
                    Template evaluated:&nbsp;
                    <span className="font-medium text-gray-900">{verificationResult.templateLabel}</span>
                  </p>
                )}
              </div>
              {verificationResult.sha256 && !verificationResult.duplicateDetected && (
                <button
                  onClick={() => {
                    markHashAsSuspicious(verificationResult.sha256);
                    setHashMarked(true);
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {hashMarked ? '✓ Flagged for future review' : 'Flag for future review'}
                </button>
              )}
              {verificationResult.duplicateDetected && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  <p className="font-medium">Duplicate document automatically flagged</p>
                  <p className="mt-1 text-xs text-red-700">
                    This document hash has been added to the suspicious list for future reference.
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end border-t px-6 py-4">
              <button
                onClick={() => {
                  setResultModalOpen(false);
                  setVerificationResult(null);
                }}
                className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Clear Hash Database</h2>
              <p className="text-sm text-gray-500 mt-1">
                This will clear all stored SHA-256 and perceptual hashes, including demo seeds.
              </p>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-700">
                This action cannot be undone. You will need to reload the page to re-seed demo hashes.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const cleared = clearDocumentHashes();
                  if (cleared) {
                    setShowResetConfirm(false);
                    // Reload page to re-seed demo hashes
                    window.location.reload();
                  }
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Clear & Reload
              </button>
            </div>
          </div>
        </div>
      )}
        </main>
      </div>
    </div>
  </>
  );
}


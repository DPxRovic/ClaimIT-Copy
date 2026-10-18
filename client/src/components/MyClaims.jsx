import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, CheckCircle, ChevronDown, MessageSquare, Eye } from 'lucide-react';
import { ModalWithdraw } from './ModalWithdraw';
import { ModalMessage } from './ModalMessage';
import { ModalViewDetails } from './ModalViewDetails';
import { useAuth } from '../context/AuthContext.jsx';
import { subscribeUserClaims, withdrawClaimService } from '../firebase/claims.js';

/**
 * Hardcoded claims dataset matching the exact reference layout
 */
export const DEFAULT_CLAIMS = [
  {
    id: '#CLM-8492',
    title: 'Clear umbrella with green trim',
    category: 'Clothing & Apparel',
    type: 'Lost Claim',
    submitted: 'Sep 16, 2026',
    status: 'Withdrawn',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDElfiIkRd79aiY-JhMgovFfs6Z1nwwv4PJvASx_6koqpHyuXTJNc7OYgUux5ekSEE_odOiuJOx8YHvKOFL0auRactt-UVjj9MPMXo5atVoeH6RC9tC4dY8PfnAcIG00VYvyGlk-T3N745lgVlmL6x6K9A4lOlN5VpQRvc1JpJOXo7QOKsMkmwe8DFL3zIZjXBOaBtQxDvzaCWLeP-QORGBZBpXNZiu8-PYu_zp0DoPKouQG8BljJ0Wng',
    iconType: 'umbrella',
    posterName: 'Security Desk Lead',
    location: 'Science Hall 102',
    foundDate: 'September 16, 2026',
    claimedDate: 'Claimed Sep 16, 2026 • Withdrawn',
    description: 'Found left in Science Hall lecture room 102 under row C seats during rainy afternoon.',
    userProof: 'Clear bubble canopy with lime green edge trim and curved handle. Left during Physics lecture.',
    attachmentName: 'receipt_umbrella_store.png',
    attachmentSize: '840 KB',
    handoverLocation: 'Campus Lost & Found Desk - Student Center Rm 210',
    timeline: [
      { step: 'Claim Submitted', date: 'Sep 16, 9:15 AM', completed: true },
      { step: 'Under Verification', date: 'Sep 16, 11:30 AM', completed: true },
      { step: 'Withdrawn by User', date: 'Sep 16, 2:10 PM', completed: true, current: true },
    ],
  },
  {
    id: '#CLM-8401',
    title: 'Apple AirPods Pro (2nd Gen)',
    category: 'Electronics',
    type: 'Found Claim',
    submitted: 'Sep 15, 2026',
    status: 'Pending',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZ-p-PVJuZ3M3F6g6WthSsKMaRgzboUZBXvrHPbuc-LS0798_O7ULhuVYGHl-CqxeedN8ujsiv5vzqBGC5u4-pKpmS08lYj8XwXRUsWyBwI3yMMOsETk7FYRpWecxU43aYckGgwXPyQKKAM7aoKcmGO3QkEMNMAed-Hrl-8iRJD5r_m2sNghhAaJTz_4BOlZpZOnDB2CiVcBG2Hl9irNzxHyslYyGtybqBTWTtjc4qV6OoPGUyiL0oRw',
    iconType: 'airpods',
    posterName: 'Marco Villanueva',
    location: 'Engineering Quad',
    foundDate: 'September 14, 2026',
    claimedDate: 'Claimed Sep 15, 2026',
    unreadUpdates: true,
    description: 'White MagSafe charging case with faint hairline scratch on bottom rim. Bluetooth name verified.',
    userProof: 'AirPods Pro 2 case with scratch on base. Serial ending in 8X9Q and Bluetooth device named Lia Pro.',
    attachmentName: 'bluetooth_settings_screen.png',
    attachmentSize: '1.2 MB',
    contactPerson: 'Marco Villanueva',
    handoverLocation: 'Engineering Quad Security Post',
    timeline: [
      { step: 'Claim Submitted', date: 'Sep 15, 3:45 PM', completed: true },
      { step: 'Awaiting Verification', date: 'Sep 15, 4:00 PM', completed: true, current: true },
      { step: 'Approval & Handover Code', date: 'Pending review', completed: false },
    ],
  },
  {
    id: '#CLM-7923',
    title: 'Ring of three keys, red lanyard',
    category: 'Keys & Accessories',
    type: 'Lost Claim',
    submitted: 'Sep 14, 2026',
    status: 'Approved',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3pzvaVJ-Abi0wPYwzm5YE9siASmc3OfbTQa9BLhGg4vWYj4iSPSZMMIrzZP1rjShNP7qT563qJJtG0WcqnPo8_zXxK-LyUrGtVw8R4YeAvH6BLdokiJ1kPt9JDnpyy45_mszIWq0rf7qlpHd543EZhP1oBk2YY9fGpscB6tsb18QjAF5rqZbCG__brAKAIlQwWbRZ7oedo9o_0h9RCjElcl0w0DQwY2K5EJTV5aELiQEYa0DFHUwzMA',
    iconType: 'keys',
    contactPerson: 'Ana Reyes',
    posterName: 'Ana Reyes (BS Psychology)',
    location: 'Isles',
    foundDate: 'September 14, 2026',
    claimedDate: 'Claimed Sep 14, 2026',
    unreadUpdates: true,
    description: 'Three keys on a red lanyard with a small silver tag.',
    userProof: 'One house key, one padlock key and a tiny silver mailbox key. The lanyard is red with IT 2A written on it. I lost it last Friday around 2 pm.',
    handoverLocation: 'Main Library Service Desk (Floor 1)',
    timeline: [
      { step: 'Claim Submitted', date: 'Sep 14, 10:20 AM', completed: true },
      { step: 'Matched with Found Item', date: 'Sep 14, 1:15 PM', completed: true },
      { step: 'Approved for Handover', date: 'Sep 15, 9:00 AM', completed: true, current: true },
      { step: 'Picked Up', date: 'Pending pickup', completed: false },
    ],
  },
  {
    id: '#CLM-6180',
    title: 'Casio scientific calculator fx-991',
    category: 'Books & Study Material',
    type: 'Lost Claim',
    submitted: 'Sep 12, 2026',
    status: 'Declined',
    iconType: 'calculator',
    posterName: 'Marco Villanueva (BS Computer Science)',
    location: 'Guard House',
    foundDate: 'September 12, 2026',
    claimedDate: 'Claimed Sep 12 • Declined',
    description: 'Casio fx-991 scientific calculator with dark gray sliding hard cover.',
    userProof: 'Casio scientific calculator fx-991 with faint silver initials MV on reverse battery plate. Left on table 4.',
    attachmentName: 'calculator_model.png',
    attachmentSize: '420 KB',
    declinedReason: 'Marco Villanueva reviewed your submitted proof and marked it as non-matching with the found item.',
    contactPerson: 'Marco Villanueva',
    handoverLocation: 'Mathematics Department Reception (Hall 4)',
    timeline: [
      { step: 'Claim Submitted', date: 'Sep 12, 8:40 AM', completed: true },
      { step: 'Evidence Evaluated', date: 'Sep 12, 2:00 PM', completed: true },
      { step: 'Claim Declined', date: 'Sep 13, 10:15 AM', completed: true, current: true },
    ],
  },
  {
    id: '#CLM-5902',
    title: 'Silver 14" M2 MacBook Air',
    category: 'Electronics',
    type: 'Found Claim',
    submitted: 'Sep 11, 2026',
    status: 'Approved',
    iconType: 'laptop',
    contactPerson: 'Crystal',
    posterName: 'Crystal (Security HQ)',
    location: 'South Gate Pavilion',
    foundDate: 'September 11, 2026',
    claimedDate: 'Claimed Sep 11, 2026',
    unreadUpdates: true,
    description: 'Silver MacBook Air in transparent snap-on shell. Password lock matched and student ID verified.',
    userProof: 'Silver MacBook Air with clear hard shell. Custom desktop wallpaper is university library at sunset.',
    handoverLocation: 'Main Campus Security HQ (South Gate Pavilion)',
    timeline: [
      { step: 'Claim Submitted', date: 'Sep 11, 11:30 AM', completed: true },
      { step: 'Serial & Mac Address Verified', date: 'Sep 11, 3:20 PM', completed: true },
      { step: 'Approved by Crystal', date: 'Sep 12, 9:45 AM', completed: true, current: true },
      { step: 'Handover & Sign-off', date: 'Ready for collection', completed: false },
    ],
  },
  {
    id: '#CLM-5421',
    title: 'Ray-Ban Clubmaster Sunglasses',
    category: 'Keys & Accessories',
    type: 'Lost Claim',
    submitted: 'Sep 10, 2026',
    status: 'Pending',
    iconType: 'glasses',
    posterName: 'Coach Rivera (Recreation Center)',
    location: 'Recreation Center Front Counter',
    foundDate: 'September 10, 2026',
    claimedDate: 'Claimed Sep 10, 2026',
    description: 'Classic tortoiseshell/gold frames in black textured leather Ray-Ban protective case.',
    userProof: 'Ray-Ban Clubmaster with dark green lenses in black case with Ray-Ban microfiber cloth.',
    handoverLocation: 'Recreation Center Lost & Found Front Counter',
    timeline: [
      { step: 'Claim Submitted', date: 'Sep 10, 4:55 PM', completed: true },
      { step: 'Awaiting Match Confirmation', date: 'Sep 11, 10:00 AM', completed: true, current: true },
      { step: 'Handover Scheduled', date: 'Pending', completed: false },
    ],
  },
  {
    id: '#CLM-4890',
    title: 'Hydro Flask 32oz Wide Mouth (Olive)',
    category: 'Others',
    type: 'Found Claim',
    submitted: 'Aug 28, 2026',
    status: 'Approved',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7yA0c_LqpyGUcRUuqYtQmtFcAf-fwdBO2sdwnVJ4M8gTnH1n1sya1yMDnwvpezsPBzNwl9j1EOiAaH7aprtCRylNe_3fZOe4ieFp-DU_kv6JDmkgxzyeP61QX-2aTuIphIsaG7Fb_JNU2hoJIvX2y2VR8p7_koOP0NvIB5bP-ExjLAbpf6UnfFQhFjLYUSuyIqdQmrb-q_1cNie3_vqMOEYvlhi7_cz8Jn4mBSPGcEEaN_FmqQPPTJg',
    iconType: 'bottle',
    contactPerson: 'Rachel Vance',
    posterName: 'Rachel Vance (BS Biology)',
    location: 'Student Union Info Desk',
    foundDate: 'August 28, 2026',
    claimedDate: 'Claimed Aug 28, 2026',
    description: 'Olive green bottle with boot accessory and slight dent on the bottom lip. Left at outdoor pavilion table.',
    userProof: 'Olive green Hydro Flask with black silicone flex boot and small dent on base. National park sticker on lid.',
    handoverLocation: 'Student Union Info Desk (Ground Floor)',
    timeline: [
      { step: 'Claim Submitted', date: 'Aug 28, 1:10 PM', completed: true },
      { step: 'Match Confirmed by Rachel', date: 'Aug 29, 10:45 AM', completed: true },
      { step: 'Approved for Handover', date: 'Aug 30, 8:30 AM', completed: true, current: true },
      { step: 'Collected', date: 'Ready for pickup', completed: false },
    ],
  },
  {
    id: '#CLM-8402',
    title: 'Velzo Backpack',
    category: 'Bags & Wallets',
    type: 'Found Claim',
    submitted: 'Aug 25, 2026',
    status: 'Pending',
    posterName: 'Marco Villanueva',
    location: 'Social Hall',
    foundDate: 'August 25, 2026',
    claimedDate: 'Claimed Aug 25, 2026',
    unreadUpdates: true,
    description: 'Dark gray Velzo backpack with dual side water bottle mesh and front zippered pouch left in Social Hall.',
    userProof: 'Dark gray Velzo backpack containing CS 101 notebook and grey earphones. Front pocket has my student ID badge.',
    contactPerson: 'Marco Villanueva',
    handoverLocation: 'Social Hall Security Station',
    timeline: [
      { step: 'Claim Submitted', date: 'Aug 25, 3:45 PM', completed: true },
      { step: 'Awaiting Verification', date: 'Aug 25, 4:00 PM', completed: true, current: true },
      { step: 'Approval & Handover Code', date: 'Pending review', completed: false },
    ],
  },
  {
    id: '#CLM-7810',
    title: 'Navy Blue Patagonia Backpack',
    category: 'Bags & Wallets',
    type: 'Found Claim',
    submitted: 'Aug 24, 2026',
    status: 'In Review',
    iconType: 'backpack',
    posterName: 'David Santos (Campus Safety)',
    location: 'Administration West',
    foundDate: 'August 24, 2026',
    claimedDate: 'Claimed Aug 24, 2026',
    unreadUpdates: true,
    description: 'Navy blue daypack with water bottle side pouch, containing spiral notebook and USB-C charger.',
    userProof: 'Patagonia Refugio pack with blue carabiner attached to top haul handle. Inside has CS notebooks.',
    handoverLocation: 'Campus Safety Office - Administration West',
    timeline: [
      { step: 'Claim Submitted', date: 'Aug 24, 2:10 PM', completed: true },
      { step: 'Staff Reviewing Evidence', date: 'Aug 24, 11:00 AM', completed: true, current: true },
      { step: 'Final Verification', date: 'In progress', completed: false },
    ],
  },
  {
    id: '#CLM-4311',
    title: 'Black leather wallet with student ID',
    category: 'IDs & Campus Cards',
    type: 'Lost Claim',
    submitted: 'Aug 22, 2026',
    status: 'Declined',
    iconType: 'wallet',
    posterName: 'Campus Card Center Desk',
    location: 'Campus Card & Identification Center',
    foundDate: 'August 22, 2026',
    claimedDate: 'Claimed Aug 22 • Declined',
    description: 'Black bi-fold leather wallet with student ID and transit card in transparent ID slot.',
    userProof: 'Black leather Fossil wallet with student card for Lia Santos and transit pass inside.',
    declinedReason: 'Item was already claimed and successfully verified by the primary student cardholder with state identification.',
    handoverLocation: 'Campus Card & Identification Center',
    timeline: [
      { step: 'Claim Submitted', date: 'Aug 22, 5:00 PM', completed: true },
      { step: 'Verification Cross-Check', date: 'Aug 23, 11:30 AM', completed: true },
      { step: 'Claim Closed (Duplicate Claimed)', date: 'Aug 24, 9:15 AM', completed: true, current: true },
    ],
  },
];

const DEFAULT_MESSAGES = {
  '#CLM-7923': {
    name: 'Ana Reyes',
    role: 'Finder / BS Psychology',
    messages: [
      {
        id: 'msg-1',
        sender: 'contact',
        senderName: 'Ana Reyes',
        text: "Hi Lia! I saw your claim was approved with the exact description of the 'BSCS' red lanyard. I have it with me on campus today!",
        timestamp: '10:24 AM',
      },
      {
        id: 'msg-2',
        sender: 'contact',
        senderName: 'Ana Reyes',
        text: "I'm at the Social Hall until 4:00 PM if you want to meet up there, or I can turn it over to MIS.",
        timestamp: '10:25 AM',
      },
    ],
  },
  '#CLM-5902': {
    name: 'Crystal',
    role: 'Campus Security HQ',
    messages: [
      {
        id: 'msg-4',
        sender: 'contact',
        senderName: 'Crystal',
        text: 'Hello, your Apple serial verification matched our database. Please bring your student ID and be ready to unlock the MacBook at South Gate HQ.',
        timestamp: 'Sep 11, 10:00 AM',
      },
    ],
  },
  '#CLM-4890': {
    name: 'Rachel Vance',
    role: 'Finder (Student Union)',
    messages: [
      {
        id: 'msg-6',
        sender: 'contact',
        senderName: 'Rachel Vance',
        text: 'Hey! I handed the Hydro Flask over to the Student Union Info Desk so you can pick it up anytime today without waiting for me.',
        timestamp: 'Aug 28, 9:00 AM',
      },
    ],
  },
};

/**
 * Single-file MyClaims Component
 * @param {Object} [props]
 * @param {Array} [props.claims]
 * @param {((claim: any) => void)} [props.onViewClaim]
 * @param {((claim: any) => void)} [props.onOpenMessage]
 * @param {((claim: any) => void)} [props.onWithdrawClaim]
 * @param {string} [props.className]
 */
export const MyClaims = ({
  claims: initialClaims = DEFAULT_CLAIMS,
  onViewClaim,
  onOpenMessage,
  onWithdrawClaim,
  className = '',
}) => {
  const { currentUser } = useAuth();

  // Master claims state initialized with passed claims or defaults
  const [claimsList, setClaimsList] = useState(initialClaims);

  // Subscribe to real-time user claims from Firestore
  useEffect(() => {
    if (!currentUser?.uid) {
      setClaimsList(initialClaims);
      return;
    }

    const unsubscribe = subscribeUserClaims(
      currentUser.uid,
      (userClaims) => {
        if (userClaims && userClaims.length > 0) {
          setClaimsList(userClaims);
        } else {
          setClaimsList(initialClaims);
        }
      },
      (err) => {
        console.warn('[MyClaims] Real-time user claims subscription warning:', err);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid, initialClaims]);

  // Chat messages state
  const [chatThreads, setChatThreads] = useState(DEFAULT_MESSAGES);

  // Single Reusable Modal state: null | { type: 'withdraw' | 'details' | 'message', claim }
  const [modal, setModal] = useState(null);

  const openModal = (type, claim) => {
    setModal({ type, claim });
    if (type === 'details') onViewClaim?.(claim);
    if (type === 'message') onOpenMessage?.(claim);
    if (type === 'withdraw') onWithdrawClaim?.(claim);
  };

  const closeModal = () => {
    setModal(null);
  };

  // Toast feedback
  const [toastText, setToastText] = useState('');

  // Toolbar filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [sortBy, setSortBy] = useState('Newest First');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const showNotification = (msg) => {
    setToastText(msg);
    setTimeout(() => setToastText(''), 3500);
  };

  // Status badge renderer
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Approved
          </span>
        );
      case 'In Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            In Review
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending
          </span>
        );
      case 'Declined':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Declined
          </span>
        );
      case 'Withdrawn':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Withdrawn
          </span>
        );
    }
  };

  // Filtering & Sorting
  const filteredClaims = useMemo(() => {
    return claimsList
      .filter((claim) => {
        // Status dropdown
        if (
          statusFilter !== 'All Statuses' &&
          statusFilter !== 'All statuses' &&
          claim.status !== statusFilter
        ) {
          return false;
        }

        // Category dropdown
        if (
          categoryFilter !== 'All Categories' &&
          categoryFilter !== 'All categories' &&
          claim.category !== categoryFilter
        ) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesId = claim.id.toLowerCase().includes(q);
          const matchesTitle = claim.title.toLowerCase().includes(q);
          const matchesCategory = claim.category.toLowerCase().includes(q);
          const matchesStatus = claim.status.toLowerCase().includes(q);
          const matchesType = (claim.type || '').toLowerCase().includes(q);
          const matchesDesc = claim.description ? claim.description.toLowerCase().includes(q) : false;

          if (
            !matchesId &&
            !matchesTitle &&
            !matchesCategory &&
            !matchesStatus &&
            !matchesType &&
            !matchesDesc
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'Ticket ID') {
          return b.id.localeCompare(a.id);
        }
        if (sortBy === 'Status') {
          return a.status.localeCompare(b.status);
        }
        if (sortBy === 'Oldest First') {
          return a.id.localeCompare(b.id);
        }
        // Default: Newest First
        return 0;
      });
  }, [claimsList, statusFilter, categoryFilter, searchQuery, sortBy]);

  // Pagination calculation
  const totalClaimsCount = filteredClaims.length;
  const totalPages = Math.max(1, Math.ceil(totalClaimsCount / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalClaimsCount);
  const currentClaims = filteredClaims.slice(startIndex, endIndex);

  // Withdraw action handler
  const handleWithdrawConfirm = async (claimId, reason) => {
    const claim = claimsList.find(
      (c) => c.id === claimId || c.claimId === claimId || c.ticketId === claimId
    );

    try {
      if (claim?.reportId) {
        await withdrawClaimService({
          reportId: claim.reportId,
          claimId: claim.claimId || claim.id,
          reason,
        });
      }

      setClaimsList((prev) =>
        prev.map((c) =>
          c.id === claimId || c.claimId === claimId || c.ticketId === claimId
            ? {
                ...c,
                status: 'Withdrawn',
                declinedReason: `Withdrawn by user: ${reason}`,
                timeline: [
                  ...(c.timeline || []),
                  {
                    step: `Withdrawn: ${reason}`,
                    date: 'Just now',
                    completed: true,
                    current: true,
                  },
                ],
              }
            : c
        )
      );
      setModal((prev) => (prev ? { ...prev, claim: { ...prev.claim, status: 'Withdrawn' } } : null));
      showNotification(`Claim ${claimId} has been withdrawn.`);
    } catch (err) {
      console.error('[MyClaims] Withdraw error:', err);
      showNotification(err.message || 'Failed to withdraw claim. Please try again.');
    }
  };

  // Send message action handler
  const handleSendMessage = (claimId, text) => {
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      senderName: 'You',
      text,
      timestamp: 'Just now',
    };

    setChatThreads((prev) => {
      const existing = prev[claimId] || {
        name: modal?.claim?.contactPerson || 'Coordinator',
        role: 'Campus Staff',
        messages: [],
      };
      return {
        ...prev,
        [claimId]: {
          ...existing,
          messages: [...existing.messages, newMsg],
        },
      };
    });

    showNotification(`Message sent regarding ${claimId}`);
  };

  return (
    <div className={`flex flex-col gap-6 w-full ${className}`}>
      {/* Toast alert */}
      {toastText && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-medium animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastText}</span>
          <button
            onClick={() => setToastText('')}
            className="ml-2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
            aria-label="Dismiss toast"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Page Title & Description */}
      <div className="space-y-1.5" data-purpose="page-intro">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          My Claims
        </h1>
        <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">
          Items you are claiming that other people posted. Track each decision and handover progress here.
        </p>
      </div>

      {/* Controls / Filters Bar (Lengthened Search Bar + Filters beside it) */}
      <div
        className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3"
        data-purpose="filters-toolbar"
      >
        {/* Lengthened Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-9 py-2.5 bg-white text-sm text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-slate-400 transition"
            placeholder="Search claims, items, ticket numbers..."
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdowns beside search bar */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          {/* Category Filter */}
          <div className="relative min-w-[155px]">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none bg-white border border-slate-200 rounded-lg pl-3.5 pr-9 py-2.5 text-sm text-slate-700 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer hover:bg-slate-50 transition"
            >
              <option>All Categories</option>
              <option>Clothing & Apparel</option>
              <option>Electronics</option>
              <option>Keys & Accessories</option>
              <option>Books & Study Material</option>
              <option>Bags & Wallets</option>
              <option>Others</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative min-w-[135px]">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none bg-white border border-slate-200 rounded-lg pl-3.5 pr-9 py-2.5 text-sm text-slate-700 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer hover:bg-slate-50 transition"
            >
              <option>All Statuses</option>
              <option>Approved</option>
              <option>Pending</option>
              <option>Declined</option>
              <option>Withdrawn</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Sort Dropdown */}
          <div className="relative min-w-[145px]">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full appearance-none bg-white border border-slate-200 rounded-lg pl-3.5 pr-9 py-2.5 text-sm text-slate-700 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer hover:bg-slate-50 transition"
            >
              <option>Newest First</option>
              <option>Oldest First</option>
              <option>Ticket ID</option>
              <option>Status</option>
            </select>
            <svg
              className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="15" y2="12" />
              <line x1="4" y1="18" x2="9" y2="18" />
            </svg>
          </div>
        </div>
      </div>

      {/* Claims Table Container */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden" data-purpose="claims-table-card">
        {/* Responsive Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200/80 bg-white text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-4 pl-6 pr-4" scope="col">TICKET</th>
                <th className="py-4 px-6" scope="col">ITEM DETAILS</th>
                <th className="py-4 px-6" scope="col">TYPE</th>
                <th className="py-4 px-6" scope="col">SUBMITTED</th>
                <th className="py-4 px-6" scope="col">STATUS</th>
                <th className="py-4 pr-6 pl-4 text-right" scope="col">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {currentClaims.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-6 text-center text-slate-500">
                    <div className="max-w-sm mx-auto space-y-2">
                      <p className="font-semibold text-slate-800">No matching claims found</p>
                      <p className="text-xs text-slate-500">
                        Try adjusting your search query, status, or category filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentClaims.map((claim) => {
                  const isFound = (claim.type || '').toUpperCase().includes('FOUND');
                  const contactFirstName = (claim.contactPerson || 'Coordinator').split(' ')[0];

                  return (
                    <tr
                      key={claim.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      {/* Ticket */}
                      <td className="py-5 pl-6 pr-4 font-mono text-xs font-medium text-slate-500 whitespace-nowrap">
                        {claim.id}
                      </td>

                      {/* Item Details */}
                      <td className="py-5 px-6">
                        <h2 className="font-bold text-slate-900 text-sm leading-snug">
                          {claim.title}
                        </h2>
                        <p className="text-xs text-slate-400 font-normal mt-0.5">{claim.category}</p>
                      </td>

                      {/* Type */}
                      <td className="py-5 px-6 whitespace-nowrap">
                        {isFound ? (
                          <span className="inline-block bg-[#0f766e] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
                            FOUND
                          </span>
                        ) : (
                          <span className="inline-block bg-[#831843] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
                            LOST
                          </span>
                        )}
                      </td>

                      {/* Submitted */}
                      <td className="py-5 px-6 whitespace-nowrap text-xs text-slate-500">
                        {claim.submitted}
                      </td>

                      {/* Status */}
                      <td className="py-5 px-6 whitespace-nowrap">
                        {renderStatusBadge(claim.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-5 pr-6 pl-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => openModal('details', claim)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 transition shadow-2xs cursor-pointer"
                          type="button"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Range Info */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p className="tabular-nums">
            Showing <span className="font-medium text-slate-700">{totalClaimsCount > 0 ? startIndex + 1 : 0}</span> to{' '}
            <span className="font-medium text-slate-700">{endIndex}</span> of{' '}
            <span className="font-medium text-slate-700">{totalClaimsCount}</span> total claims
          </p>

          <div className="inline-flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className={`px-3 py-1 rounded border font-medium transition ${
                currentPage <= 1
                  ? 'border-slate-200 bg-white text-slate-300 cursor-not-allowed'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer'
              }`}
              type="button"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded font-medium transition cursor-pointer ${
                  page === currentPage
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                type="button"
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className={`px-3 py-1 rounded border font-medium transition ${
                currentPage >= totalPages
                  ? 'border-slate-200 bg-white text-slate-300 cursor-not-allowed'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer'
              }`}
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Modals in their own separate files */}
      <ModalWithdraw
        isOpen={modal?.type === 'withdraw'}
        claim={modal?.claim}
        onClose={closeModal}
        onWithdraw={handleWithdrawConfirm}
      />

      <ModalMessage
        isOpen={modal?.type === 'message'}
        claim={modal?.claim}
        messages={modal?.claim ? chatThreads[modal.claim.id]?.messages || [] : []}
        onSendMessage={handleSendMessage}
        onClose={closeModal}
      />

      <ModalViewDetails
        isOpen={modal?.type === 'details'}
        claim={modal?.claim}
        onClose={closeModal}
        onSwitchModal={openModal}
      />
    </div>
  );
};

export default MyClaims;

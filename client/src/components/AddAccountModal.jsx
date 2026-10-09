import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap,
  Briefcase,
  ChevronDown,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';

/**
 * LOGO:
 * Real ClaimIt logo image that AdminMainForm.jsx uses.
 * Declared once at top so it can be swapped in one line.
 */
export const LOGO_SRC =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDVDgS-g_QQ1iiwo6rh3nt6Q78aVoc3sGZI7kiZRt5mUI8eXsxr6fenZ-8hqsvaN0_BfyJqnKpBjT7kfJ2ftSToXWq9ayg2Is6bnPsQg7rRSlO-RBlZbxBZUpCoP7lPeeYy4Ne4f_AR25vjWlfW_HhLlcPVNr2uaU3zl2uZDvIy_xiFPkCm_bi2JnjYOODBF20XB4W85R9MC5PPnvkITwShhor84eckbUKgPP4WrsJa1zn_FHhQzuczhwHFtSpg-FuOzs4';

/**
 * Mock Data Options
 */
export const PROGRAMS = [
  'BS Information Technology',
  'BS Computer Science',
  'BS Nursing',
  'BS Education',
  'BS Accountancy',
  'BS Business Administration',
];

export const YEAR_LEVELS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
];

export const DEPARTMENTS = [
  'College of Nursing',
  'College of Engineering',
  'College of Education',
  'College of Business',
  'College of Computing',
  'College of Arts and Sciences',
];

/**
 * Fallback SVG Logo when network image fails to load
 * Exactly reproduces the mark: dark navy magnifier with handle pointing lower-left,
 * bold blue check inside lens, "laim" in dark navy (#1f2a44), "it" in bright blue (#4361ee),
 * with blue swoosh underline.
 */
function LogoFallback() {
  return (
    <svg
      viewBox="0 0 220 80"
      className="h-8 w-auto object-contain select-none overflow-visible"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ClaimIt Logo"
    >
      {/* Handle */}
      <line
        x1="20"
        y1="62"
        x2="38"
        y2="44"
        stroke="#1f2a44"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* Magnifier Lens / "C" */}
      <circle
        cx="54"
        cy="32"
        r="23"
        stroke="#1f2a44"
        strokeWidth="6"
        fill="none"
      />
      {/* Check inside lens */}
      <path
        d="M45 32 L53 39 L65 24"
        stroke="#4361ee"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* "laim" */}
      <text
        x="76"
        y="43"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontWeight="800"
        fontSize="36"
        letterSpacing="-0.5px"
        fill="#1f2a44"
      >
        laim
      </text>
      {/* "i" stem */}
      <path
        d="M165 27 L165 43"
        stroke="#4361ee"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* "i" pin dot */}
      <path
        d="M165 11 C161.8 11 159.5 13.3 159.5 16.5 C159.5 20.2 165 25 165 25 C165 25 170.5 20.2 170.5 16.5 C170.5 13.3 168.2 11 165 11 Z"
        fill="#4361ee"
      />
      <circle cx="165" cy="16" r="1.8" fill="#ffffff" />
      {/* "t" */}
      <path
        d="M180 18 L180 40 C180 42 181.5 43 184 43"
        stroke="#4361ee"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M175 26 L187 26"
        stroke="#4361ee"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Swoosh */}
      <path
        d="M72 54 C100 48 138 48 174 56"
        stroke="#4361ee"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/**
 * AddAccountModal Component
 *
 * PROPS:
 * - isOpen (boolean)
 * - onClose ()
 * - onSubmit (payload)
 * - defaultType = 'student' ('student' | 'faculty')
 */
export function AddAccountModal({
  isOpen,
  onClose,
  onSubmit,
  defaultType = 'student',
}) {
  const [role, setRole] = useState(defaultType); // 'student' | 'faculty'
  const [imgError, setImgError] = useState(false);

  // Common fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Student fields
  const [schoolId, setSchoolId] = useState('');
  const [program, setProgram] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [section, setSection] = useState('');

  // Faculty fields
  const [facultyId, setFacultyId] = useState('');
  const [department, setDepartment] = useState('');

  // Validation
  const [errors, setErrors] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Focus trap ref & dialog ref
  const modalRef = useRef(null);
  const firstInputRef = useRef(null);
  const onCloseRef = useRef(onClose);

  // Keep latest onClose in a ref to avoid unstable callback in useEffect
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Reset form whenever modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setRole(defaultType);
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setSchoolId('');
      setProgram('');
      setYearLevel('');
      setSection('');
      setFacultyId('');
      setDepartment('');
      setErrors({});
      setHasAttemptedSubmit(false);
      setIsSubmitting(false);

      // Focus first input after animation frame
      const timer = setTimeout(() => {
        if (firstInputRef.current) {
          firstInputRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, defaultType]);

  // Handle ESC, focus trap, and body scroll lock (depends strictly on isOpen)
  useEffect(() => {
    if (!isOpen) return;

    // Body scroll lock
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (onCloseRef.current) {
          onCloseRef.current();
        }
        return;
      }

      // Focus trap within modalRef
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Validation function
  const validateForm = (currentRole = role) => {
    const errs = {};

    if (!fullName.trim()) {
      errs.fullName = 'Full Name is required.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errs.email = 'Email Address is required.';
    } else if (!emailRegex.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    if (currentRole === 'student') {
      if (!schoolId.trim()) {
        errs.schoolId = 'School ID Number is required.';
      }
      if (!program) {
        errs.program = 'Program is required.';
      }
      if (!yearLevel) {
        errs.yearLevel = 'Year Level is required.';
      }
      if (!section.trim()) {
        errs.section = 'Section is required.';
      }
    } else {
      if (!facultyId.trim()) {
        errs.facultyId = 'Faculty/Employee ID Number is required.';
      }
      if (!department) {
        errs.department = 'Department is required.';
      }
    }

    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters.';
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Confirm Password is required.';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = "Passwords don't match";
    }

    return errs;
  };

  // Re-validate live once submitted at least once
  useEffect(() => {
    if (hasAttemptedSubmit) {
      setErrors(validateForm(role));
    }
  }, [
    fullName,
    email,
    role,
    schoolId,
    program,
    yearLevel,
    section,
    facultyId,
    department,
    password,
    confirmPassword,
    hasAttemptedSubmit,
  ]);

  // Handle switching Student <-> Faculty
  const handleRoleChange = (newRole) => {
    if (newRole === role) return;
    setRole(newRole);

    // Clear type-specific values on switch
    setSchoolId('');
    setProgram('');
    setYearLevel('');
    setSection('');
    setFacultyId('');
    setDepartment('');

    // Clear type-specific errors if already validated
    if (hasAttemptedSubmit) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.schoolId;
        delete next.program;
        delete next.yearLevel;
        delete next.section;
        delete next.facultyId;
        delete next.department;
        return next;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    const validationErrors = validateForm(role);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    const payload = {
      type: role,
      name: fullName.trim(),
      email: email.trim(),
      password,
      ...(role === 'student'
        ? {
            schoolId: schoolId.trim(),
            program,
            yearLevel,
            section: section.trim(),
          }
        : {
            facultyId: facultyId.trim(),
            department,
          }),
    };

    if (onSubmit) {
      onSubmit(payload);
    }

    setIsSubmitting(false);
    if (onCloseRef.current) {
      onCloseRef.current();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-modal-title"
        className="relative w-full max-w-[540px] bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-7 my-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button X at top-right */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header section with balanced vertical rhythm */}
        <div className="flex flex-col items-center text-center">
          {/* Logo container */}
          <div className="flex items-center justify-center">
            {!imgError ? (
              <img
                src={LOGO_SRC}
                alt="ClaimIt logo"
                draggable={false}
                onError={() => setImgError(true)}
                className="h-8 w-auto object-contain select-none"
              />
            ) : (
              <LogoFallback />
            )}
          </div>

          {/* Title */}
          <h2
            id="register-modal-title"
            className="mt-3 text-2xl font-bold text-[#0b1c30] tracking-tight leading-tight"
          >
            Register
          </h2>

          {/* Subtitle */}
          <p className="mt-1 text-xs text-[#736e65] font-normal">
            Join ClaimIt to report, track, and recover items across campus.
          </p>
        </div>

        {/* Form container */}
        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-3">
          {/* Row 1: Full Name & Email Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="register-fullname"
                className="block text-xs font-semibold text-[#0b1c30] mb-1"
              >
                Full Name
              </label>
              <input
                ref={firstInputRef}
                id="register-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Maria Santos"
                className={`w-full h-10 px-3.5 rounded-xl border bg-white text-xs text-[#0b1c30] placeholder:text-[#a09c94] focus:outline-none transition-colors ${
                  errors.fullName
                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                    : 'border-[#E8E4D8] focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20'
                }`}
              />
              {errors.fullName && (
                <p className="mt-0.5 text-[11px] text-red-600 font-medium">
                  {errors.fullName}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="register-email"
                className="block text-xs font-semibold text-[#0b1c30] mb-1"
              >
                Email Address
              </label>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className={`w-full h-10 px-3.5 rounded-xl border bg-white text-xs text-[#0b1c30] placeholder:text-[#a09c94] focus:outline-none transition-colors ${
                  errors.email
                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                    : 'border-[#E8E4D8] focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20'
                }`}
              />
              {errors.email && (
                <p className="mt-0.5 text-[11px] text-red-600 font-medium">
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: I am a (Segmented Radio Group) */}
          <div>
            <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
              I am a
            </label>
            <div
              role="radiogroup"
              aria-label="Account Type"
              className="w-full h-9 p-0.5 bg-[#EEF3FF] border border-[#d6e2ff] rounded-xl grid grid-cols-2 gap-1"
            >
              {/* Student radio */}
              <button
                type="button"
                role="radio"
                aria-checked={role === 'student'}
                onClick={() => handleRoleChange('student')}
                className={`h-full rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  role === 'student'
                    ? 'bg-white text-[#5170ff] shadow-xs'
                    : 'text-[#6e727e] hover:text-[#2d3139]'
                }`}
              >
                <GraduationCap
                  className={`w-3.5 h-3.5 ${
                    role === 'student' ? 'text-[#5170ff]' : 'text-[#6e727e]'
                  }`}
                />
                <span>Student</span>
              </button>

              {/* Faculty radio */}
              <button
                type="button"
                role="radio"
                aria-checked={role === 'faculty'}
                onClick={() => handleRoleChange('faculty')}
                className={`h-full rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  role === 'faculty'
                    ? 'bg-white text-[#5170ff] shadow-xs'
                    : 'text-[#6e727e] hover:text-[#2d3139]'
                }`}
              >
                <Briefcase
                  className={`w-3.5 h-3.5 ${
                    role === 'faculty' ? 'text-[#5170ff]' : 'text-[#6e727e]'
                  }`}
                />
                <span>Faculty</span>
              </button>
            </div>
          </div>

          {/* Row 3: Dynamic State Fields */}
          {role === 'student' ? (
            <>
              {/* Student Fields Row 3a: School ID Number & Program */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="student-id"
                    className="block text-xs font-semibold text-[#0b1c30] mb-1"
                  >
                    School ID Number
                  </label>
                  <input
                    id="student-id"
                    type="text"
                    value={schoolId}
                    onChange={(e) => setSchoolId(e.target.value)}
                    placeholder="e.g. 2022-01452-MN-0"
                    className={`w-full h-10 px-3.5 rounded-xl border bg-white text-xs text-[#0b1c30] placeholder:text-[#a09c94] focus:outline-none transition-colors ${
                      errors.schoolId
                        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-[#E8E4D8] focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20'
                    }`}
                  />
                  {errors.schoolId && (
                    <p className="mt-0.5 text-[11px] text-red-600 font-medium">
                      {errors.schoolId}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="student-program"
                    className="block text-xs font-semibold text-[#0b1c30] mb-1"
                  >
                    Program
                  </label>
                  <div className="relative">
                    <select
                      id="student-program"
                      value={program}
                      onChange={(e) => setProgram(e.target.value)}
                      className={`w-full h-10 pl-3.5 pr-8 appearance-none rounded-xl border bg-white text-xs focus:outline-none transition-colors cursor-pointer ${
                        !program ? 'text-[#a09c94]' : 'text-[#0b1c30]'
                      } ${
                        errors.program
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                          : 'border-[#E8E4D8] focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20'
                      }`}
                    >
                      <option value="" disabled className="text-[#a09c94]">
                        Select Program
                      </option>
                      {PROGRAMS.map((prog) => (
                        <option
                          key={prog}
                          value={prog}
                          className="text-[#0b1c30]"
                        >
                          {prog}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8a857b]" />
                  </div>
                  {errors.program && (
                    <p className="mt-0.5 text-[11px] text-red-600 font-medium">
                      {errors.program}
                    </p>
                  )}
                </div>
              </div>

              {/* Student Fields Row 3b: Year Level & Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="student-year"
                    className="block text-xs font-semibold text-[#0b1c30] mb-1"
                  >
                    Year Level
                  </label>
                  <div className="relative">
                    <select
                      id="student-year"
                      value={yearLevel}
                      onChange={(e) => setYearLevel(e.target.value)}
                      className={`w-full h-10 pl-3.5 pr-8 appearance-none rounded-xl border bg-white text-xs focus:outline-none transition-colors cursor-pointer ${
                        !yearLevel ? 'text-[#a09c94]' : 'text-[#0b1c30]'
                      } ${
                        errors.yearLevel
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                          : 'border-[#E8E4D8] focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20'
                      }`}
                    >
                      <option value="" disabled className="text-[#a09c94]">
                        Select Year Level
                      </option>
                      {YEAR_LEVELS.map((lvl) => (
                        <option
                          key={lvl}
                          value={lvl}
                          className="text-[#0b1c30]"
                        >
                          {lvl}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8a857b]" />
                  </div>
                  {errors.yearLevel && (
                    <p className="mt-0.5 text-[11px] text-red-600 font-medium">
                      {errors.yearLevel}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="student-section"
                    className="block text-xs font-semibold text-[#0b1c30] mb-1"
                  >
                    Section
                  </label>
                  <input
                    id="student-section"
                    type="text"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="e.g. A"
                    className={`w-full h-10 px-3.5 rounded-xl border bg-white text-xs text-[#0b1c30] placeholder:text-[#a09c94] focus:outline-none transition-colors ${
                      errors.section
                        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-[#E8E4D8] focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20'
                    }`}
                  />
                  {errors.section && (
                    <p className="mt-0.5 text-[11px] text-red-600 font-medium">
                      {errors.section}
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Faculty Fields Row 3: Faculty/Employee ID Number & Department */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="faculty-id"
                  className="block text-xs font-semibold text-[#0b1c30] mb-1"
                >
                  Faculty/Employee ID Number
                </label>
                <input
                  id="faculty-id"
                  type="text"
                  value={facultyId}
                  onChange={(e) => setFacultyId(e.target.value)}
                  placeholder="e.g. FAC-2018-883"
                  className={`w-full h-10 px-3.5 rounded-xl border bg-white text-xs text-[#0b1c30] placeholder:text-[#a09c94] focus:outline-none transition-colors ${
                    errors.facultyId
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      : 'border-[#E8E4D8] focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20'
                  }`}
                />
                {errors.facultyId && (
                  <p className="mt-0.5 text-[11px] text-red-600 font-medium">
                    {errors.facultyId}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="faculty-dept"
                  className="block text-xs font-semibold text-[#0b1c30] mb-1"
                >
                  Department
                </label>
                <div className="relative">
                  <select
                    id="faculty-dept"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className={`w-full h-10 pl-3.5 pr-8 appearance-none rounded-xl border bg-white text-xs focus:outline-none transition-colors cursor-pointer ${
                      !department ? 'text-[#a09c94]' : 'text-[#0b1c30]'
                    } ${
                      errors.department
                        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-[#E8E4D8] focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20'
                    }`}
                  >
                    <option value="" disabled className="text-[#a09c94]">
                      Select Department
                    </option>
                    {DEPARTMENTS.map((dept) => (
                      <option
                        key={dept}
                        value={dept}
                        className="text-[#0b1c30]"
                      >
                        {dept}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8a857b]" />
                </div>
                {errors.department && (
                  <p className="mt-0.5 text-[11px] text-red-600 font-medium">
                    {errors.department}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Row 4: Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="register-password"
                className="block text-xs font-semibold text-[#0b1c30] mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className={`w-full h-10 pl-3.5 pr-10 rounded-xl border bg-white text-xs text-[#0b1c30] placeholder:text-[#a09c94] focus:outline-none transition-colors ${
                    errors.password
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      : 'border-[#E8E4D8] focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a857b] hover:text-[#0b1c30] p-1 cursor-pointer transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-0.5 text-[11px] text-red-600 font-medium">
                  {errors.password}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="register-confirmpassword"
                className="block text-xs font-semibold text-[#0b1c30] mb-1"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="register-confirmpassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className={`w-full h-10 pl-3.5 pr-10 rounded-xl border bg-white text-xs text-[#0b1c30] placeholder:text-[#a09c94] focus:outline-none transition-colors ${
                    errors.confirmPassword
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      : 'border-[#E8E4D8] focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={
                    showConfirmPassword ? 'Hide password' : 'Show password'
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a857b] hover:text-[#0b1c30] p-1 cursor-pointer transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-0.5 text-[11px] text-red-600 font-medium">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* Row 5: Full-width Register Button */}
          <div className="pt-1.5">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 sm:h-11 rounded-xl bg-[#5170ff] hover:bg-[#4362ea] disabled:bg-[#8da3ff] disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-[#5170ff]/30 shadow-xs"
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddAccountModal;

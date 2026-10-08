import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../api';
import { EVENTS } from '../constants';

const EMPTY_FORM = {
  fullName: '',
  dob: '',
  category: '',
  schoolName: '',
  parentNames: ['', ''],
  contactNumber: '',
  participation: []
};

// Same age bands the server uses (the server's value is the one that is saved)
const calculateCategory = (year, month, day) => {
  const birthDate = new Date(Number(year), Number(month) - 1, Number(day));
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;

  if (age < 10) return 'Sub Junior (Below 10 years)';
  if (age <= 15) return 'Junior (10 - 15 years)';
  return 'Senior (Above 15 years)';
};

const generateCaptcha = () => {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 5 }, () => charset.charAt(Math.floor(Math.random() * charset.length))).join('');
};

const validate = (formData, captchaInput, captcha) => {
  const errors = {};
  if (formData.fullName.trim().length < 2) errors.fullName = 'Enter the student\'s full name.';
  if (!formData.dob) errors.dob = 'Select year, month and day of birth.';
  if (formData.schoolName.trim().length < 2) errors.schoolName = 'Enter the school / institution name.';
  if (!/^(\+?91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}$/.test(formData.contactNumber.trim())) {
    errors.contactNumber = 'Enter a valid 10-digit mobile number.';
  }
  if (formData.participation.length === 0) errors.participation = 'Select at least one event.';
  if (captchaInput.trim().toUpperCase() !== captcha) errors.captcha = 'The code does not match. Please try again.';
  return errors;
};

const RegistrationForm = ({ stats, onRegistered }) => {
  const [dobDetails, setDobDetails] = useState({ year: '', month: '', day: '' });
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [captcha, setCaptcha] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const panelRef = useRef(null);

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaInput('');
  };

  useEffect(refreshCaptcha, []);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleDobSelect = (field, value) => {
    const updated = { ...dobDetails, [field]: value };

    // If the chosen day doesn't exist in the new month/year (e.g. 31 → Feb), clear it
    if (updated.year && updated.month && updated.day) {
      const maxDay = new Date(Number(updated.year), Number(updated.month), 0).getDate();
      if (Number(updated.day) > maxDay) updated.day = '';
    }
    setDobDetails(updated);

    const complete = updated.year && updated.month && updated.day;
    setFormData((prev) => ({
      ...prev,
      dob: complete ? `${updated.year}-${updated.month.padStart(2, '0')}-${updated.day.padStart(2, '0')}` : '',
      category: complete ? calculateCategory(updated.year, updated.month, updated.day) : ''
    }));
    setErrors((prev) => ({ ...prev, dob: undefined }));
  };

  const handleParentNameChange = (index, value) => {
    const parentNames = [...formData.parentNames];
    parentNames[index] = value;
    setFormData((prev) => ({ ...prev, parentNames }));
  };

  const toggleEvent = (eventName) => {
    setFormData((prev) => ({
      ...prev,
      participation: prev.participation.includes(eventName)
        ? prev.participation.filter((e) => e !== eventName)
        : [...prev.participation, eventName]
    }));
    setErrors((prev) => ({ ...prev, participation: undefined }));
  };

  const resetForm = () => {
    setDobDetails({ year: '', month: '', day: '' });
    setFormData(EMPTY_FORM);
    setErrors({});
    refreshCaptcha();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    const clientErrors = validate(formData, captchaInput, captcha);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      setFeedback({ type: 'danger', message: 'Please correct the highlighted fields.' });
      if (clientErrors.captcha) refreshCaptcha();
      return;
    }

    setIsSubmitting(true);
    const { ok, data } = await apiRequest('/api/register', { method: 'POST', body: formData });
    setIsSubmitting(false);

    if (ok) {
      setFeedback({
        type: 'success',
        message: `Registration successful! Registration ID: ${data.data.id}. Please keep this ID for reference.`
      });
      resetForm();
      onRegistered?.();
    } else {
      setErrors(data.errors || {});
      setFeedback({ type: 'danger', message: data.message || 'Registration failed. Please try again.' });
      refreshCaptcha();
    }

    panelRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Dropdown options: Year → Month → Day
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 25 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: new Date(2000, i).toLocaleString('en', { month: 'short' })
  }));
  const daysInMonth = dobDetails.year && dobDetails.month
    ? new Date(Number(dobDetails.year), Number(dobDetails.month), 0).getDate()
    : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));

  const inputClass = (field, base = 'form-control') => `${base} ${errors[field] ? 'is-invalid' : ''}`;
  const fieldError = (field) => (errors[field] ? <div className="field-error">{errors[field]}</div> : null);

  if (stats && !stats.open) {
    return (
      <div className="panel" ref={panelRef}>
        <h2 className="panel-title">Student Registration Form</h2>
        <div className="panel-body">
          <div className="form-alert danger mb-0">
            Registration is closed. All {stats.max} seats have been filled. Thank you for your interest.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel" ref={panelRef}>
      <h2 className="panel-title">Student Registration Form</h2>
      <div className="panel-body">
        <p className="text-muted-soft small mb-3">
          Fields marked <span className="required">*</span> are mandatory.
        </p>

        {feedback.message && (
          <div className={`form-alert ${feedback.type}`} role={feedback.type === 'danger' ? 'alert' : 'status'}>
            {feedback.message}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* ---------- Student details ---------- */}
          <fieldset className="form-section">
            <legend>1. Student Details</legend>

            <div className="mb-3">
              <label htmlFor="fullName" className="form-label">
                Student Full Name <span className="required">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                className={inputClass('fullName')}
                maxLength={100}
                autoComplete="name"
                value={formData.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
              />
              {fieldError('fullName')}
            </div>

            <div className="row g-3 mb-3">
              <div className="col-12 col-md-8">
                <label className="form-label" id="dob-label">
                  Date of Birth <span className="required">*</span>
                </label>
                <div className="row g-2" role="group" aria-labelledby="dob-label">
                  <div className="col-4">
                    <select
                      aria-label="Year of birth"
                      className={inputClass('dob', 'form-select')}
                      value={dobDetails.year}
                      onChange={(e) => handleDobSelect('year', e.target.value)}
                    >
                      <option value="">Year</option>
                      {years.map((yr) => <option key={yr} value={yr}>{yr}</option>)}
                    </select>
                  </div>
                  <div className="col-4">
                    <select
                      aria-label="Month of birth"
                      className={inputClass('dob', 'form-select')}
                      value={dobDetails.month}
                      onChange={(e) => handleDobSelect('month', e.target.value)}
                    >
                      <option value="">Month</option>
                      {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                  <div className="col-4">
                    <select
                      aria-label="Day of birth"
                      className={inputClass('dob', 'form-select')}
                      value={dobDetails.day}
                      onChange={(e) => handleDobSelect('day', e.target.value)}
                    >
                      <option value="">Day</option>
                      {days.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                {fieldError('dob')}
              </div>

              <div className="col-12 col-md-4">
                <label htmlFor="category" className="form-label">Age Category</label>
                <input
                  id="category"
                  type="text"
                  className="form-control"
                  value={formData.category}
                  placeholder="Auto-detected"
                  readOnly
                />
              </div>
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-7">
                <label htmlFor="schoolName" className="form-label">
                  School / Institution Name <span className="required">*</span>
                </label>
                <input
                  id="schoolName"
                  type="text"
                  className={inputClass('schoolName')}
                  maxLength={150}
                  value={formData.schoolName}
                  onChange={(e) => updateField('schoolName', e.target.value)}
                />
                {fieldError('schoolName')}
              </div>
              <div className="col-12 col-md-5">
                <label htmlFor="contactNumber" className="form-label">
                  Mobile Number <span className="required">*</span>
                </label>
                <input
                  id="contactNumber"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  className={inputClass('contactNumber')}
                  placeholder="10-digit mobile number"
                  maxLength={16}
                  value={formData.contactNumber}
                  onChange={(e) => updateField('contactNumber', e.target.value)}
                />
                {fieldError('contactNumber')}
              </div>
            </div>
          </fieldset>

          {/* ---------- Parent details ---------- */}
          <fieldset className="form-section">
            <legend>2. Accompanying Parents / Guardians</legend>
            <div className="row g-3">
              {[0, 1].map((index) => (
                <div className="col-12 col-md-6" key={index}>
                  <label htmlFor={`parent${index}`} className="form-label">
                    Parent / Guardian {index + 1} <span className="text-muted-soft fw-normal">(optional)</span>
                  </label>
                  <input
                    id={`parent${index}`}
                    type="text"
                    className={inputClass('parentNames')}
                    maxLength={100}
                    value={formData.parentNames[index]}
                    onChange={(e) => handleParentNameChange(index, e.target.value)}
                  />
                </div>
              ))}
            </div>
            {fieldError('parentNames')}
            <div className="form-hint">Maximum two parents / guardians may accompany the student.</div>
          </fieldset>

          {/* ---------- Events ---------- */}
          <fieldset className="form-section">
            <legend>3. Participation <span className="required">*</span></legend>
            <p className="form-hint mt-0 mb-2">Select one or both events.</p>
            <div className="row g-3">
              {EVENTS.map((event) => {
                const checked = formData.participation.includes(event.name);
                return (
                  <div className="col-12 col-md-6" key={event.name}>
                    <label className={`event-option ${checked ? 'checked' : ''}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleEvent(event.name)} />
                      <span>
                        <strong>{event.name}</strong>
                        <small>{event.description}</small>
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
            {fieldError('participation')}
          </fieldset>

          {/* ---------- Captcha ---------- */}
          <fieldset className="form-section">
            <legend>4. Verification</legend>
            <label htmlFor="captchaInput" className="form-label">
              Enter the code shown <span className="required">*</span>
            </label>
            <div className="captcha-row">
              <span className="captcha-code" aria-label={`Captcha code: ${captcha.split('').join(' ')}`}>
                {captcha}
              </span>
              <button type="button" className="btn-outline-main btn-sm-plain" onClick={refreshCaptcha}>
                ↻ New code
              </button>
              <input
                id="captchaInput"
                type="text"
                className={inputClass('captcha')}
                autoComplete="off"
                maxLength={5}
                value={captchaInput}
                onChange={(e) => {
                  setCaptchaInput(e.target.value);
                  setErrors((prev) => ({ ...prev, captcha: undefined }));
                }}
              />
            </div>
            {fieldError('captcha')}
          </fieldset>

          <div className="d-flex flex-wrap gap-2">
            <button type="submit" className="btn-main" disabled={isSubmitting}>
              {isSubmitting && <span className="spinner-border spinner-border-sm" aria-hidden="true" />}
              {isSubmitting ? 'Submitting…' : 'Submit Registration'}
            </button>
            <button type="button" className="btn-outline-main" onClick={resetForm} disabled={isSubmitting}>
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationForm;

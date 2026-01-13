import React, { useState, useEffect } from 'react';
import { X, Bug, Lightbulb, Send, AlertCircle, CheckCircle, Clock, Image, Trash2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

// ⚙️ CONFIGURABLE RATE LIMITS (easy to edit)
const RATE_LIMITS = {
  bugReport: 5 * 60 * 1000,        // 5 minutes in milliseconds
  featureRequest: 60 * 60 * 1000,  // 1 hour in milliseconds
};

const STORAGE_KEYS = {
  lastBugReport: 'poe_analyzer_last_bug_report',
  lastFeatureRequest: 'poe_analyzer_last_feature_request',
};

const ReportModal = ({ isOpen, onClose, gameConfig }) => {
  const { t } = useLanguage();
  const [reportType, setReportType] = useState(null); // 'bug' or 'feature'
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Bot trap
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState({ bug: 0, feature: 0 });
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);

  // Check rate limits on mount and when modal opens
  useEffect(() => {
    if (isOpen) {
      updateTimeRemaining();
      const interval = setInterval(updateTimeRemaining, 1000); // Update every second
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Paste event listener for screenshots from clipboard
  useEffect(() => {
    if (!isOpen || reportType !== 'bug') return;

    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      // Find image in clipboard
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.type.startsWith('image/')) {
          e.preventDefault();

          const blob = item.getAsFile();
          if (!blob) return;

          // Validate file size (5MB max)
          const maxSize = 5 * 1024 * 1024;
          if (blob.size > maxSize) {
            setSubmitStatus({ type: 'error', message: t('reportModal.imageTooLarge') });
            return;
          }

          // Create a File object from the blob
          const file = new File([blob], `pasted-screenshot-${Date.now()}.png`, {
            type: blob.type,
          });

          setScreenshot(file);

          // Create preview
          const reader = new FileReader();
          reader.onloadend = () => {
            setScreenshotPreview(reader.result);
          };
          reader.readAsDataURL(file);
          setSubmitStatus({ type: 'success', message: t('reportModal.screenshotPasted') });

          // Clear success message after 2 seconds
          setTimeout(() => {
            setSubmitStatus(null);
          }, 2000);

          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [isOpen, reportType]);

  const updateTimeRemaining = () => {
    const now = Date.now();
    const lastBug = parseInt(localStorage.getItem(STORAGE_KEYS.lastBugReport) || '0');
    const lastFeature = parseInt(localStorage.getItem(STORAGE_KEYS.lastFeatureRequest) || '0');

    const bugRemaining = Math.max(0, RATE_LIMITS.bugReport - (now - lastBug));
    const featureRemaining = Math.max(0, RATE_LIMITS.featureRequest - (now - lastFeature));

    setTimeRemaining({
      bug: bugRemaining,
      feature: featureRemaining,
    });
  };

  const formatTimeRemaining = (ms) => {
    if (ms === 0) return null;

    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const canSubmit = (type) => {
    return type === 'bug' ? timeRemaining.bug === 0 : timeRemaining.feature === 0;
  };

  if (!isOpen) return null;

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSubmitStatus({ type: 'error', message: t('reportModal.imageTypeError') });
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setSubmitStatus({ type: 'error', message: t('reportModal.imageTooLarge') });
      return;
    }

    setScreenshot(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotPreview(reader.result);
    };
    reader.readAsDataURL(file);
    setSubmitStatus(null);
  };

  const handleRemoveScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
  };

  const handleBugReport = async (e) => {
    e.preventDefault();

    // Check honeypot (bot detection)
    if (honeypot) {
      console.log('Bot detected via honeypot');
      setSubmitStatus({ type: 'error', message: t('reportModal.invalidSubmission') });
      return;
    }

    // Check rate limit
    if (!canSubmit('bug')) {
      setSubmitStatus({
        type: 'error',
        message: `${t('reportModal.waitMessage')} ${formatTimeRemaining(timeRemaining.bug)} ${t('reportModal.beforeSubmitting')} ${t('reportModal.bugReport')}`
      });
      return;
    }

    if (description.trim().length < 10) {
      setSubmitStatus({ type: 'error', message: t('reportModal.minLengthError') });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Use FormData to send both text and file
      const formData = new FormData();
      formData.append('description', description.trim());
      formData.append('email', email.trim());
      formData.append('browser', navigator.userAgent);
      formData.append('game', gameConfig?.selectedGame || 'unknown');
      formData.append('league', gameConfig?.selectedLeague || 'unknown');
      formData.append('url', window.location.href);

      if (screenshot) {
        formData.append('screenshot', screenshot);
      }

      // Use proxy server URL in development, relative path in production
      const apiUrl = process.env.NODE_ENV === 'development'
        ? 'http://localhost:3001/api/report-bug'
        : '/api/report-bug';

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData // No Content-Type header - browser will set it with boundary
      });

      const data = await response.json();

      if (response.ok) {
        // Save timestamp to localStorage
        localStorage.setItem(STORAGE_KEYS.lastBugReport, Date.now().toString());

        setSubmitStatus({ type: 'success', message: data.message || t('reportModal.successMessage') });
        setDescription('');
        setEmail('');
        setScreenshot(null);
        setScreenshotPreview(null);
        setTimeout(() => {
          onClose();
          setSubmitStatus(null);
          setReportType(null);
        }, 2000);
      } else {
        setSubmitStatus({ type: 'error', message: data.error || t('reportModal.errorMessage') });
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitStatus({ type: 'error', message: t('reportModal.networkError') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeatureRequest = () => {
    // Check rate limit
    if (!canSubmit('feature')) {
      setSubmitStatus({
        type: 'error',
        message: `${t('reportModal.waitMessage')} ${formatTimeRemaining(timeRemaining.feature)} ${t('reportModal.beforeSubmitting')} ${t('reportModal.featureRequest')}`
      });
      setReportType(null);
      return;
    }

    // Save timestamp to localStorage
    localStorage.setItem(STORAGE_KEYS.lastFeatureRequest, Date.now().toString());

    const title = encodeURIComponent('Feature Request: ');
    const body = encodeURIComponent(`
**Feature Description:**
[Describe the feature you'd like to see]

**Why is this useful?**
[Explain the use case]

**Game:** ${gameConfig?.selectedGame || 'N/A'}
**League:** ${gameConfig?.selectedLeague || 'N/A'}
    `);

    const githubUrl = `https://github.com/mariocere17/POE-BUILD-ANALYZER/issues/new?title=${title}&body=${body}`;

    // Try to open in new window
    const newWindow = window.open(githubUrl, '_blank', 'noopener,noreferrer');

    // Check if popup was blocked
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      // Popup blocked - use direct navigation as fallback
      console.warn('Popup blocked, using direct navigation');
      window.location.href = githubUrl;
    } else {
      // Success - close modal after short delay
      setTimeout(() => {
        onClose();
        setReportType(null);
        setSubmitStatus(null);
      }, 300);
    }
  };

  const handleClose = () => {
    onClose();
    setReportType(null);
    setDescription('');
    setEmail('');
    setHoneypot('');
    setSubmitStatus(null);
    setScreenshot(null);
    setScreenshotPreview(null);
  };

  const handleSelectReportType = (type) => {
    console.log('Report type selected:', type, 'Can submit:', type === 'bug' ? canSubmit('bug') : canSubmit('feature'));

    if (type === 'feature') {
      // Feature request opens GitHub immediately
      if (canSubmit('feature')) {
        handleFeatureRequest();
      } else {
        setSubmitStatus({
          type: 'error',
          message: `${t('reportModal.waitMessage')} ${formatTimeRemaining(timeRemaining.feature)} ${t('reportModal.beforeSubmitting')} ${t('reportModal.featureRequest')}`
        });
      }
    } else {
      // Bug report opens form
      if (canSubmit('bug')) {
        setReportType(type);
      } else {
        setSubmitStatus({
          type: 'error',
          message: `${t('reportModal.waitMessage')} ${formatTimeRemaining(timeRemaining.bug)} ${t('reportModal.beforeSubmitting')} ${t('reportModal.bugReport')}`
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-orange-400">{t('reportModal.title')}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!reportType ? (
            // Selection Screen
            <div className="space-y-4">
              <p className="text-gray-300 mb-6">
                {t('reportModal.subtitle')}
              </p>

              {/* Bug Report Option */}
              <button
                onClick={() => handleSelectReportType('bug')}
                disabled={!canSubmit('bug')}
                className={`w-full p-6 bg-gray-800 border-2 rounded-lg transition-all group ${
                  canSubmit('bug')
                    ? 'hover:bg-gray-750 border-red-500 hover:border-red-400'
                    : 'opacity-60 cursor-not-allowed border-gray-600'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <Bug size={32} className={canSubmit('bug') ? 'text-red-500 group-hover:text-red-400' : 'text-gray-600'} />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">{t('reportModal.bugReportTitle')}</h3>
                    <p className="text-gray-400">
                      {t('reportModal.bugReportDesc')}
                    </p>
                    {!canSubmit('bug') && (
                      <div className="flex items-center space-x-2 mt-3 text-yellow-500">
                        <Clock size={16} />
                        <span className="text-sm font-medium">
                          {t('reportModal.availableIn')} {formatTimeRemaining(timeRemaining.bug)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>

              {/* Feature Request Option */}
              <button
                onClick={() => handleSelectReportType('feature')}
                disabled={!canSubmit('feature')}
                className={`w-full p-6 bg-gray-800 border-2 rounded-lg transition-all group ${
                  canSubmit('feature')
                    ? 'hover:bg-gray-750 border-blue-500 hover:border-blue-400'
                    : 'opacity-60 cursor-not-allowed border-gray-600'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <Lightbulb size={32} className={canSubmit('feature') ? 'text-blue-500 group-hover:text-blue-400' : 'text-gray-600'} />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">{t('reportModal.featureRequestTitle')}</h3>
                    <p className="text-gray-400">
                      {t('reportModal.featureRequestDesc')}
                    </p>
                    {!canSubmit('feature') && (
                      <div className="flex items-center space-x-2 mt-3 text-yellow-500">
                        <Clock size={16} />
                        <span className="text-sm font-medium">
                          {t('reportModal.availableIn')} {formatTimeRemaining(timeRemaining.feature)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>

              {/* Rate Limit Error Display */}
              {submitStatus && (
                <div className="flex items-start space-x-3 p-4 rounded-lg bg-red-900 bg-opacity-30 border border-red-700">
                  <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{submitStatus.message}</p>
                </div>
              )}
            </div>
          ) : reportType === 'bug' ? (
            // Bug Report Form
            <form onSubmit={handleBugReport} className="space-y-4">
              {/* Honeypot Field - Hidden from users, visible to bots */}
              <div style={{ position: 'absolute', left: '-9999px', opacity: 0 }} aria-hidden="true">
                <label htmlFor="website">Website (leave blank)</label>
                <input
                  type="text"
                  id="website"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex="-1"
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('reportModal.describeBug')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('reportModal.bugPlaceholder')}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  rows="6"
                  required
                  minLength="10"
                  disabled={isSubmitting}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {t('reportModal.minimumChars')} ({description.length}/10)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('reportModal.emailLabel')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('reportModal.emailPlaceholder')}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={isSubmitting}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {t('reportModal.emailHelp')}
                </p>
              </div>

              {/* Screenshot Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('reportModal.screenshotLabel')}
                </label>

                {!screenshotPreview ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotChange}
                        className="hidden"
                        id="screenshot-input"
                        disabled={isSubmitting}
                      />
                      <label
                        htmlFor="screenshot-input"
                        className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-orange-500 hover:text-orange-500 transition-colors cursor-pointer"
                      >
                        <Image size={20} />
                        <span>{t('reportModal.screenshotUpload')}</span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      {t('reportModal.screenshotTip')}
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={screenshotPreview}
                      alt="Screenshot preview"
                      className="w-full h-48 object-contain bg-gray-800 rounded-lg border border-gray-600"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveScreenshot}
                      className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      disabled={isSubmitting}
                      title={t('reportModal.removeScreenshot')}
                    >
                      <Trash2 size={16} />
                    </button>
                    <p className="text-sm text-gray-400 mt-2">
                      {screenshot.name} ({(screenshot.size / 1024).toFixed(1)} KB)
                    </p>
                  </div>
                )}
                {!screenshotPreview && (
                  <p className="text-sm text-gray-500 mt-1">
                    {t('reportModal.screenshotHelp')}
                  </p>
                )}
              </div>

              {/* Status Messages */}
              {submitStatus && (
                <div className={`flex items-start space-x-3 p-4 rounded-lg ${
                  submitStatus.type === 'success'
                    ? 'bg-green-900 bg-opacity-30 border border-green-700'
                    : 'bg-red-900 bg-opacity-30 border border-red-700'
                }`}>
                  {submitStatus.type === 'success' ? (
                    <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <p className={`text-sm ${
                    submitStatus.type === 'success' ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {submitStatus.message}
                  </p>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-400">
                  <strong className="text-gray-300">{t('reportModal.autoCapture')}</strong> {t('reportModal.autoCaptureDesc')}
                   ({gameConfig?.selectedGame}), {t('itemList.league').toLowerCase()} ({gameConfig?.selectedLeague}),
                  {t('reportModal.autoCaptureSuffix')}
                </p>
              </div>

              {/* Buttons */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setReportType(null)}
                  className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {t('reportModal.back')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting || description.trim().length < 10}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>{t('reportModal.sending')}</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>{t('reportModal.submitReport')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ReportModal;

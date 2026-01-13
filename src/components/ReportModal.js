import React, { useState, useEffect } from 'react';
import { X, Bug, Lightbulb, Send, AlertCircle, CheckCircle, Clock } from 'lucide-react';

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
  const [reportType, setReportType] = useState(null); // 'bug' or 'feature'
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Bot trap
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState({ bug: 0, feature: 0 });

  // Check rate limits on mount and when modal opens
  useEffect(() => {
    if (isOpen) {
      updateTimeRemaining();
      const interval = setInterval(updateTimeRemaining, 1000); // Update every second
      return () => clearInterval(interval);
    }
  }, [isOpen]);

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

  const handleBugReport = async (e) => {
    e.preventDefault();

    // Check honeypot (bot detection)
    if (honeypot) {
      console.log('Bot detected via honeypot');
      setSubmitStatus({ type: 'error', message: 'Invalid submission detected' });
      return;
    }

    // Check rate limit
    if (!canSubmit('bug')) {
      setSubmitStatus({
        type: 'error',
        message: `Please wait ${formatTimeRemaining(timeRemaining.bug)} before submitting another bug report`
      });
      return;
    }

    if (description.trim().length < 10) {
      setSubmitStatus({ type: 'error', message: 'Please provide at least 10 characters' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('/api/report-bug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: description.trim(),
          email: email.trim(),
          browser: navigator.userAgent,
          game: gameConfig?.selectedGame || 'unknown',
          league: gameConfig?.selectedLeague || 'unknown',
          url: window.location.href
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Save timestamp to localStorage
        localStorage.setItem(STORAGE_KEYS.lastBugReport, Date.now().toString());

        setSubmitStatus({ type: 'success', message: data.message || 'Report submitted successfully!' });
        setDescription('');
        setEmail('');
        setTimeout(() => {
          onClose();
          setSubmitStatus(null);
          setReportType(null);
        }, 2000);
      } else {
        setSubmitStatus({ type: 'error', message: data.error || 'Failed to submit report' });
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitStatus({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeatureRequest = () => {
    // Check rate limit
    if (!canSubmit('feature')) {
      setSubmitStatus({
        type: 'error',
        message: `Please wait ${formatTimeRemaining(timeRemaining.feature)} before submitting another feature request`
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
          message: `Please wait ${formatTimeRemaining(timeRemaining.feature)} before submitting another feature request`
        });
      }
    } else {
      // Bug report opens form
      if (canSubmit('bug')) {
        setReportType(type);
      } else {
        setSubmitStatus({
          type: 'error',
          message: `Please wait ${formatTimeRemaining(timeRemaining.bug)} before submitting another bug report`
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-orange-400">Report an Issue</h2>
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
                How can we help improve PoE Build Analyzer?
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
                    <h3 className="text-xl font-semibold text-white mb-2">Report a Bug</h3>
                    <p className="text-gray-400">
                      Something not working? Let us know about technical issues, errors, or broken features.
                    </p>
                    {!canSubmit('bug') && (
                      <div className="flex items-center space-x-2 mt-3 text-yellow-500">
                        <Clock size={16} />
                        <span className="text-sm font-medium">
                          Available in {formatTimeRemaining(timeRemaining.bug)}
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
                    <h3 className="text-xl font-semibold text-white mb-2">Request a Feature</h3>
                    <p className="text-gray-400">
                      Have an idea? Suggest new features or improvements (opens GitHub Issues).
                    </p>
                    {!canSubmit('feature') && (
                      <div className="flex items-center space-x-2 mt-3 text-yellow-500">
                        <Clock size={16} />
                        <span className="text-sm font-medium">
                          Available in {formatTimeRemaining(timeRemaining.feature)}
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
                  Describe the bug <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What happened? What did you expect to happen? Include steps to reproduce if possible..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  rows="6"
                  required
                  minLength="10"
                  disabled={isSubmitting}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Minimum 10 characters ({description.length}/10)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={isSubmitting}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Optional - if you want us to follow up with you
                </p>
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
                  <strong className="text-gray-300">Auto-captured info:</strong> Browser version,
                  current game ({gameConfig?.selectedGame}), league ({gameConfig?.selectedLeague}),
                  and page URL will be included in the report.
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
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting || description.trim().length < 10}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Submit Report</span>
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

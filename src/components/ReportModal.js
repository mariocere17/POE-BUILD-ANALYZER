import React, { useState } from 'react';
import { X, Bug, Lightbulb, Send, AlertCircle, CheckCircle } from 'lucide-react';

const ReportModal = ({ isOpen, onClose, gameConfig }) => {
  const [reportType, setReportType] = useState(null); // 'bug' or 'feature'
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', or null

  if (!isOpen) return null;

  const handleBugReport = async (e) => {
    e.preventDefault();

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
    const title = encodeURIComponent('Feature Request: ');
    const body = encodeURIComponent(`
**Feature Description:**
[Describe the feature you'd like to see]

**Why is this useful?**
[Explain the use case]

**Game:** ${gameConfig?.selectedGame || 'N/A'}
**League:** ${gameConfig?.selectedLeague || 'N/A'}
    `);

    window.open(
      `https://github.com/mariocere17/POE-BUILD-ANALYZER/issues/new?title=${title}&body=${body}`,
      '_blank'
    );

    // Close modal after opening GitHub
    setTimeout(() => {
      onClose();
      setReportType(null);
    }, 500);
  };

  const handleClose = () => {
    onClose();
    setReportType(null);
    setDescription('');
    setEmail('');
    setSubmitStatus(null);
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
                onClick={() => setReportType('bug')}
                className="w-full p-6 bg-gray-800 hover:bg-gray-750 border-2 border-red-500 hover:border-red-400 rounded-lg transition-all group"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <Bug size={32} className="text-red-500 group-hover:text-red-400" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">Report a Bug</h3>
                    <p className="text-gray-400">
                      Something not working? Let us know about technical issues, errors, or broken features.
                    </p>
                  </div>
                </div>
              </button>

              {/* Feature Request Option */}
              <button
                onClick={() => setReportType('feature')}
                className="w-full p-6 bg-gray-800 hover:bg-gray-750 border-2 border-blue-500 hover:border-blue-400 rounded-lg transition-all group"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <Lightbulb size={32} className="text-blue-500 group-hover:text-blue-400" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">Request a Feature</h3>
                    <p className="text-gray-400">
                      Have an idea? Suggest new features or improvements (opens GitHub Issues).
                    </p>
                  </div>
                </div>
              </button>
            </div>
          ) : reportType === 'bug' ? (
            // Bug Report Form
            <form onSubmit={handleBugReport} className="space-y-4">
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
          ) : (
            // Feature Request (redirects to GitHub)
            <div className="text-center py-8">
              <Lightbulb size={64} className="text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Opening GitHub Issues...</h3>
              <p className="text-gray-400">
                You'll be redirected to GitHub to submit your feature request.
              </p>
              <button
                onClick={() => setReportType(null)}
                className="mt-6 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportModal;

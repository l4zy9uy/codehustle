import { useState, useEffect, useRef, useCallback } from 'react';
import { listSubmissions, getSubmission } from '../lib/api/submissions';
import { submitProblem } from '../lib/api/problems';
import { transformSubmissionData } from '../utils/submissionUtils';

export function useProblemSubmission(problemId, defaultLang) {
  const [submissions, setSubmissions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [lang, setLang] = useState(defaultLang ?? null);
  const [source, setSource] = useState("");
  const pollingIntervalsRef = useRef({});

  // Fetch submissions for this problem
  useEffect(() => {
    if (!problemId) return;
    
    // Clean up any existing polling intervals before loading new submissions
    Object.values(pollingIntervalsRef.current).forEach((interval) => {
      clearInterval(interval);
    });
    pollingIntervalsRef.current = {};
    
    listSubmissions({ problem_id: problemId })
      .then((res) => {
        // Transform submissions to match expected format
        const formattedSubmissions = (res.submissions || []).map((s) => {
          const base = {
            id: s.id,
            when: s.submitted_at || s.submittedAt ? new Date(s.submitted_at || s.submittedAt).toLocaleString() : new Date().toLocaleString(),
          };
          
          // Transform additional fields using the transformation function
          const transformed = transformSubmissionData(s);
          
          return { ...base, ...transformed };
        });
        
        setSubmissions(formattedSubmissions);
        
        // Start polling for any pending or running submissions
        formattedSubmissions.forEach((sub) => {
          if (sub.status === 'PENDING' || sub.status === 'RUNNING') {
            pollSubmissionStatus(sub.id);
          }
        });
      })
      .catch((error) => {
        console.error('Failed to fetch submissions:', error);
        setSubmissions([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemId]);

  // Update a submission in the list
  const updateSubmissionInList = useCallback((submissionId, updates) => {
    setSubmissions((prev) => {
      const submissionIdStr = String(submissionId);
      const found = prev.find((sub) => String(sub.id) === submissionIdStr);
      
      if (!found) {
        console.warn('Submission not found in list:', submissionId, 'Available IDs:', prev.map(s => s.id));
        return prev;
      }
      
      const updated = prev.map((sub) => {
        if (String(sub.id) === submissionIdStr) {
          const merged = { ...sub, ...updates };
          console.log('Updating submission:', sub.id, 'Status:', sub.status, '->', merged.status);
          return merged;
        }
        return sub;
      });
      
      console.log('Updated submissions list. Count:', updated.length);
      return updated;
    });
  }, []);

  // Poll submission status until it's complete
  const pollSubmissionStatus = useCallback((submissionId) => {
    // Clear any existing polling for this submission
    if (pollingIntervalsRef.current[submissionId]) {
      clearInterval(pollingIntervalsRef.current[submissionId]);
    }

    const poll = async () => {
      try {
        const submission = await getSubmission(submissionId);
        console.log('Polling submission:', submissionId, 'Raw response:', submission);
        
        // Transform the API response to UI format
        const updates = transformSubmissionData(submission);
        
        console.log('Updating submission with:', updates);
        
        // Update submission in list
        updateSubmissionInList(submissionId, updates);
        
        // Stop polling if status is not pending or running
        const status = updates.status;
        if (status !== 'PENDING' && status !== 'RUNNING') {
          console.log('Stopping polling for submission:', submissionId, 'Final status:', status);
          if (pollingIntervalsRef.current[submissionId]) {
            clearInterval(pollingIntervalsRef.current[submissionId]);
            delete pollingIntervalsRef.current[submissionId];
          }
        }
      } catch (error) {
        console.error('Failed to poll submission status:', error);
        // Stop polling on error
        if (pollingIntervalsRef.current[submissionId]) {
          clearInterval(pollingIntervalsRef.current[submissionId]);
          delete pollingIntervalsRef.current[submissionId];
        }
      }
    };

    // Poll immediately, then every 1.5 seconds
    poll();
    pollingIntervalsRef.current[submissionId] = setInterval(poll, 1500);
  }, [updateSubmissionInList]);

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      // Clear all polling intervals
      Object.values(pollingIntervalsRef.current).forEach((interval) => {
        clearInterval(interval);
      });
      pollingIntervalsRef.current = {};
    };
  }, []);

  const handleSubmit = useCallback(async (onSubmit) => {
    // Validate inputs
    if (!lang || !source.trim() || !problemId) {
      console.error('Missing required fields for submission');
      return;
    }

    // Call parent onSubmit if provided (for compatibility)
    if (typeof onSubmit === "function") onSubmit({ lang, source, problem: { id: problemId } });

    // Set submitting state
    setSubmitting(true);

    try {
      // Submit to API
      const submission = await submitProblem(problemId, { lang, source });
      
      // Transform submission to match expected format
      const base = {
        id: submission.id,
        when: submission.submitted_at || submission.submittedAt ? new Date(submission.submitted_at || submission.submittedAt).toLocaleString() : new Date().toLocaleString(),
      };
      
      // Transform additional fields using the transformation function
      const transformed = transformSubmissionData(submission);
      
      // Ensure source is set (use submitted source if API doesn't return it)
      if (!transformed.source && source) {
        transformed.source = source;
      }
      
      const formattedSubmission = { ...base, ...transformed };
      
      // Add submission to list
      setSubmissions((prev) => [formattedSubmission, ...prev]);
      
      // Start polling for status updates if status is pending or running
      if (formattedSubmission.status === 'PENDING' || formattedSubmission.status === 'RUNNING') {
        pollSubmissionStatus(submission.id);
      }

      return formattedSubmission;
    } catch (error) {
      console.error('Submission failed:', error);
      // Still add a pending submission to show something happened
      const created = {
        id: `local_${Date.now()}`,
        when: new Date().toLocaleString(),
        lang,
        status: 'ERROR',
        source,
      };
      setSubmissions((prev) => [created, ...prev]);
      throw error;
    } finally {
      setSubmitting(false);
    }
  }, [lang, source, problemId, pollSubmissionStatus]);

  return {
    submissions,
    submitting,
    lang,
    setLang,
    source,
    setSource,
    handleSubmit,
  };
}


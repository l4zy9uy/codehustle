// Submission transformation utilities

// Normalize status to uppercase to match component expectations
export function normalizeStatus(status) {
  if (!status) return 'PENDING';
  const upper = status.toUpperCase();
  // Map common status formats
  if (upper === 'PENDING' || upper === 'QUEUED') return 'PENDING';
  if (upper === 'RUNNING') return 'RUNNING';
  if (upper === 'ACCEPTED' || upper === 'AC') return 'AC';
  if (upper === 'WRONG_ANSWER' || upper === 'WA') return 'WA';
  if (upper === 'TIME_LIMIT_EXCEEDED' || upper === 'TLE') return 'TLE';
  if (upper === 'COMPILATION_ERROR' || upper === 'CE') return 'CE';
  if (upper === 'RUNTIME_ERROR' || upper === 'RTE') return 'RTE';
  if (upper === 'MEMORY_LIMIT_EXCEEDED' || upper === 'MLE') return 'MLE';
  if (upper === 'PARTIAL') return 'PARTIAL';
  if (upper === 'SYSTEM_ERROR') return 'SYSTEM_ERROR';
  return upper;
}

// Helper function to transform API submission to UI format
export function transformSubmissionData(submission) {
  let status = normalizeStatus(submission.status);
  const transformed = {
    status,
  };
  
  // Basic fields
  if (submission.language || submission.lang) {
    transformed.lang = submission.language || submission.lang;
  }
  if (submission.code || submission.source) {
    transformed.source = submission.code || submission.source;
  }
  
  // Compilation error log
  if (submission.compile_log) {
    transformed.compileLog = submission.compile_log;
    // If there's a compile log, status should be CE
    status = 'CE';
  }
  
  // Runtime error - map run_log to runtimeError (StatusRTE expects runtimeError)
  if (submission.run_log) {
    transformed.runtimeError = submission.run_log;
    // If there's a run_log and no compile_log, treat as RTE
    // (backend might return "wrong_answer" for runtime errors)
    if (!submission.compile_log) {
      status = 'RTE';
    }
  }
  
  // Update status in transformed object
  transformed.status = status;
  
  // Test case results - transform to failedCases format for WA
  if (submission.test_case_results && Array.isArray(submission.test_case_results)) {
    // Store raw test case results
    transformed.testCaseResults = submission.test_case_results;
    
    // For wrong_answer status (and not RTE/CE), create failedCases from test_case_results
    if (status === 'WA') {
      transformed.failedCases = submission.test_case_results
        .filter(tc => {
          const tcStatus = tc.status?.toLowerCase();
          return tcStatus !== 'accepted' && tcStatus !== 'passed';
        })
        .map((tc, idx) => ({
          id: String(tc.id || tc.test_case_id || `tc_${idx}`),
          summary: tc.test_case?.name || `Test case ${idx + 1}`,
          input: tc.input || '',
          your: tc.your_output || tc.output || '',
          expected: tc.expected_output || '',
          diffLines: tc.diff_lines || { left: [], right: [] },
        }));
    }
  }
  
  // Summary and stats
  if (submission.summary) {
    transformed.summary = submission.summary;
  }
  if (submission.score !== undefined) {
    transformed.score = submission.score;
  }
  if (submission.execution_time !== undefined) {
    transformed.executionTime = submission.execution_time;
  }
  if (submission.memory_usage !== undefined) {
    transformed.memoryUsage = submission.memory_usage;
  }
  if (submission.code_size_bytes !== undefined) {
    transformed.codeSizeBytes = submission.code_size_bytes;
  }
  
  return transformed;
}




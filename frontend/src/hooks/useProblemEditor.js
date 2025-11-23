import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export function useProblemEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = id !== 'new';

  const [problemData, setProblemData] = useState({
    title: '',
    difficulty: 'medium',
    timeLimit: 1000,
    memoryLimit: 256,
    encoding: 'UTF-8',
    description: {
      legend: '',
      inputFormat: '',
      outputFormat: '',
      notes: '',
    },
    tags: [],
  });

  const [loading, setLoading] = useState(false);
  const [testCases, setTestCases] = useState([
    { id: 1, inputFile: null, outputFile: null }
  ]);

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      setTimeout(() => {
        setProblemData({
          title: 'A+B Problem',
          difficulty: 'easy',
          timeLimit: 1000,
          memoryLimit: 256,
          encoding: 'UTF-8',
          description: {
            legend: 'You are given two integers $a$ and $b$. Print $a+b$.',
            inputFormat: 'The only line of the input contains integers $a$ and $b$ ($-100 \\le a,b \\le 100$).',
            outputFormat: 'Print $a+b$.',
            notes: 'In the first example, $a=7$ and $b=8$. Thus, the answer is $a+b=7+8=15$.',
          },
          tags: ['math', 'implementation'],
        });
        setLoading(false);
      }, 1000);
    }
  }, [id, isEdit]);

  const handleSave = async () => {
    setLoading(true);
    try {
      console.log('Saving problem:', problemData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      navigate('/problems');
    } catch (error) {
      console.error('Error saving problem:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDescription = (field, value) => {
    setProblemData(prev => ({
      ...prev,
      description: {
        ...prev.description,
        [field]: value
      }
    }));
  };

  const addTestCase = () => {
    const newId = testCases.length > 0 ? Math.max(...testCases.map(tc => tc.id)) + 1 : 1;
    setTestCases(prev => [...prev, { id: newId, inputFile: null, outputFile: null }]);
  };

  const deleteTestCase = (id) => {
    setTestCases(prev => prev.filter(tc => tc.id !== id));
  };

  const updateTestCaseFile = (id, fileType, file) => {
    setTestCases(prev => prev.map(tc => 
      tc.id === id ? { ...tc, [fileType]: file } : tc
    ));
  };

  return {
    problemData,
    setProblemData,
    loading,
    testCases,
    isEdit,
    handleSave,
    updateDescription,
    addTestCase,
    deleteTestCase,
    updateTestCaseFile,
  };
}


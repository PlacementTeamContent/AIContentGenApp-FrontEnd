import { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import './TestCases.css';

// Define the outlined styles for TextField
const outlinedStyles = {
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: '#001A4B',
      borderWidth: '2px',
      boxShadow: 'none', 
    },
    '&:hover fieldset': {
      borderColor: '#001A4B',
      borderWidth: '2px',
      boxShadow: 'none', 
    },
    '&.Mui-focused fieldset': {
      borderColor: '#001A4B',
      borderWidth: '2px',
      boxShadow: 'none', 
    },
    boxShadow: 'none', 
  },
  '& .MuiInputLabel-root': {
    color: '#001A4B',
    '&.Mui-focused': {
      color: '#001A4B',
      fontWeight: '600',
    },
    fontWeight: '500',
  },
  boxShadow: 'none', 
};

const TestCases = ({ questionsData, currentQuestionIndex, isJsonParsed }) => {
  const [testCases, setTestCases] = useState([
    {
      id: 1,
      input: 'There was a mango tree in garden',
      output: '4',
      type: 'NORMAL_CASE',
      visible: true
    },
    {
      id: 2,
      input: 'There was a mango tree in garden',
      output: '4',
      type: 'NORMAL_CASE',
      visible: true
    },
    {
      id: 3,
      input: 'There was a mango tree in garden',
      output: '4',
      type: 'NORMAL_CASE',
      visible: false
    },
    {
      id: 4,
      input: 'There was a mango tree in garden',
      output: '4',
      type: 'NORMAL_CASE',
      visible: false
    },
    {
      id: 5,
      input: 'There was a mango tree in garden',
      output: '4',
      type: 'NORMAL_CASE',
      visible: false
    },
    {
      id: 6,
      input: '5\nThere was a mango tree in garden\nThere was a mango tree in garden\nThere was a mango tree in garden\nThere was a mango tree in garden\nThere was a mango tree in garden',
      output: '4\n4\n4\n4\n4',
      type: 'NORMAL_CASE',
      visible: false
    }
  ]);

  // Update test cases when JSON data changes
  useEffect(() => {
    if (isJsonParsed && questionsData.length > 0 && currentQuestionIndex < questionsData.length) {
      const currentQuestion = questionsData[currentQuestionIndex];
      if (currentQuestion.input_output && currentQuestion.input_output.length > 0) {
        const inputOutputData = currentQuestion.input_output[0]; // Get the first input_output object
        if (inputOutputData.input && Array.isArray(inputOutputData.input)) {
          const jsonTestCases = inputOutputData.input.map((testCase, index) => ({
            id: testCase.t_id || index + 1,
            input: testCase.input || '',
            output: testCase.output || '',
            type: testCase.testcase_type || 'NORMAL_CASE',
            visible: !testCase.is_hidden
          }));
          setTestCases(jsonTestCases);
        }
      }
    }
  }, [questionsData, currentQuestionIndex, isJsonParsed]);

  const typeOptions = ['NORMAL_CASE', 'EDGE_CASE', 'CORNER_CASE'];

  const updateTestCase = (id, field, value) => {
    setTestCases(prevCases =>
      prevCases.map(testCase =>
        testCase.id === id ? { ...testCase, [field]: value } : testCase
      )
    );
  };

  const handleDownload = () => { }

  return (
    <div className="test-cases-container">
      {/* Header Section */}
      <div className="test-cases-header">
        <h1 className="test-cases-title">TEST CASES</h1>
      </div>

      {/* Test Cases List */}
      <div className="test-cases-list">
        {testCases.map((testCase) => (
          <div key={testCase.id} className="test-case-row">
            {/* Test Case Number */}
            <div className="test-case-number">
              <span className="number">{testCase.id}</span>
            </div>

            {/* Test Case Fields */}
            <div className="test-case-fields">
              {/* Input Field */}
              <div className="field-group output-field">
                <TextField
                  value={testCase.input}
                  onChange={(e) => updateTestCase(testCase.id, 'input', e.target.value)}
                  placeholder="Input"
                  label="Input"
                  variant="outlined"
                  fullWidth
                  multiline
                  minRows={1}
                  maxRows={5}
                  sx={outlinedStyles}
                />
              </div>

              {/* Output Field */}
              <div className="field-group output-field">
                <TextField
                  value={testCase.output}
                  onChange={(e) => updateTestCase(testCase.id, 'output', e.target.value)}
                  placeholder="Output"
                  label="Output"
                  variant="outlined"
                  fullWidth
                  multiline
                  minRows={1}
                  maxRows={5}
                  sx={outlinedStyles}
                />
              </div>

              {/* Type Field */}
              <div className="field-group type-field">
                <TextField
                  value={testCase.type}
                  onChange={(e) => updateTestCase(testCase.id, 'type', e.target.value)}
                  placeholder="Type"
                  label="Type"
                  variant="outlined"
                  fullWidth
                  sx={outlinedStyles}
                />
              </div>

              {/* Visible Field */}
              <div className="field-group visible-field">
                <TextField
                  select
                  value={testCase.visible}
                  onChange={(e) => updateTestCase(testCase.id, 'visible', e.target.value === 'true')}
                  label="Visible"
                  variant="outlined"
                  fullWidth
                  sx={outlinedStyles}
                >
                  <MenuItem value={true}>True</MenuItem>
                  <MenuItem value={false}>False</MenuItem>
                </TextField>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestCases;
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import "./ContentLoop.css";
import "../ContentQuestions/ContentQuestions.css";
import "../TestCases/TestCases.css";
import Navbar from "../Navbar/navbar";
import { authFetch } from "../../utils/authFetch";

const ContentLoop = () => {
  const navigate = useNavigate();

  // JSON handling states
  const [jsonTextInput, setJsonTextInput] = useState("");
  const [questionsData, setQuestionsData] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isJsonParsed, setIsJsonParsed] = useState(false);

  // ContentReplication states
  const [jsonData, setJsonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [error, setError] = useState(null);
  const [jsonResponse, setJsonResponse] = useState({});
  const [selectedQuestionKey, setSelectedQuestionKey] = useState(null);

  // ContentQuestions states
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [shortText, setShortText] = useState("");
  const [problemText, setProblemText] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [makeDefault, setMakeDefault] = useState(false);
  const [prefilledCode, setPrefilledCode] = useState("");
  const [solutionCode, setSolutionCode] = useState("");
  const [backendCode, setBackendCode] = useState("");
  const [userChangedLanguage, setUserChangedLanguage] = useState(false);
  const [userEditingBackendCode, setUserEditingBackendCode] = useState(false);

  // TestCases states
  const [testCases, setTestCases] = useState([]);

  // Computed values
  const displayQuestionsData =
    isJsonParsed && questionsData.length > 0
      ? {
          questions: questionsData.map((q, index) => ({
            id: `q${index}`,
            name: q.short_text || `Question ${index + 1}`,
          })),
          total: questionsData.length,
        }
      : {
          questions: [],
          total: 0,
        };

  const currentQuestionData =
    isJsonParsed && questionsData.length > 0
      ? questionsData[currentQuestionIndex]
      : null;

  // ContentReplication computed values
  const questionsForKey = selectedQuestionKey
    ? jsonResponse[selectedQuestionKey] || []
    : [];

  const currentQuestionFromResponse =
    questionsForKey.length > 0 ? questionsForKey[currentQuestionIndex] : null;

  // Helper function to convert language codes to display names (moved before useMemo)
  const getLanguageDisplayName = (langCode) => {
    const languageMap = {
      PYTHON39: "Python",
      JAVA: "Java",
      CPP: "C++",
      C: "C",
      JAVASCRIPT: "JavaScript",
      GO: "Go",
      RUST: "Rust",
      C_SHARP: "C#",
    };
    return languageMap[langCode] || langCode;
  };

  // Helper function to convert display names back to language codes
  const getLanguageCode = (displayName) => {
    const reverseLanguageMap = {
      "Python": "PYTHON39",
      "Java": "JAVA",
      "C++": "CPP",
      "C": "C",
      "JavaScript": "JAVASCRIPT",
      "Go": "GO",
      "Rust": "RUST",
      "C#": "C_SHARP",
    };
    return reverseLanguageMap[displayName] || displayName;
  };

  // Helper function to get file content from language_code_repository_details
  const getFileContentForLanguage = (questionData, language) => {
    if (!questionData || !questionData.language_code_repository_details || !language) {
      return "";
    }

    const langCode = getLanguageCode(language);
    const languageDetail = questionData.language_code_repository_details.find(
      (detail) => detail.language === langCode
    );

    if (languageDetail && languageDetail.code_repository && languageDetail.code_repository.length > 0) {
      // Get the first file's content (usually main.py, Main.java, etc.)
      const firstFile = languageDetail.code_repository[0];
      if (firstFile && firstFile.file_content) {
        try {
          // Decode base64 content
          return decodeBase64(firstFile.file_content);
        } catch (error) {
          console.error("Error decoding file content:", error);
          return firstFile.file_content; // Return as-is if decoding fails
        }
      }
    }

    return "";
  };

  // Dynamic languages array based on current question's code_metadata
  const languages = useMemo(() => {
    if (currentQuestionData && currentQuestionData.code_metadata) {
      return currentQuestionData.code_metadata.map((meta) =>
        getLanguageDisplayName(meta.language)
      );
    } else if (
      currentQuestionFromResponse &&
      currentQuestionFromResponse.code_metadata
    ) {
      return currentQuestionFromResponse.code_metadata.map((meta) =>
        getLanguageDisplayName(meta.language)
      );
    }
    // Fallback to default languages
    return ["Python", "JavaScript", "Java", "C++", "Go", "Rust", "C#"];
  }, [currentQuestionData, currentQuestionFromResponse]);

  // Helper functions from ContentReplication
  const decodeBase64 = (str) => {
    try {
      return atob(str);
    } catch {
      return "";
    }
  };

  const encodeBase64 = (str) => {
    try {
      return btoa(str);
    } catch {
      return "";
    }
  };

  // Update local state when question changes (from ContentQuestions)
  useEffect(() => {
    const questionData = currentQuestionFromResponse || currentQuestionData;

    if (questionData) {
      setShortText(questionData.short_text || "");
      setProblemText(questionData.question_text || "");

      // Only set language automatically if user hasn't manually changed it
      if (!userChangedLanguage) {
        // Find default language from code_metadata
        const defaultCodeMeta = questionData.code_metadata?.find(
          (meta) => meta.default_code === true
        );
        if (defaultCodeMeta) {
          setSelectedLanguage(getLanguageDisplayName(defaultCodeMeta.language));
          setPrefilledCode(defaultCodeMeta.code_data || "");
          setMakeDefault(true); // Set checkbox to true for default language
        } else if (
          questionData.code_metadata &&
          questionData.code_metadata.length > 0
        ) {
          // If no default language, set the first one
          const firstMeta = questionData.code_metadata[0];
          setSelectedLanguage(getLanguageDisplayName(firstMeta.language));
          setPrefilledCode(firstMeta.code_data || "");
          setMakeDefault(firstMeta.default_code || false);
        } else {
          setSelectedLanguage("");
          setPrefilledCode("");
          setMakeDefault(false);
        }
      }

      // Set solution code from solutions
      if (questionData.solutions && questionData.solutions.length > 0) {
        const solution = questionData.solutions[0];
        if (solution.code_details && solution.code_details.length > 0) {
          setSolutionCode(solution.code_details[0].code_content || "");
        } else {
          setSolutionCode("");
        }
      } else {
        setSolutionCode("");
      }

      // Set backend code from language_code_repository_details
      if (selectedLanguage && !userEditingBackendCode) {
        const fileContent = getFileContentForLanguage(questionData, selectedLanguage);
        setBackendCode(fileContent);
      } else if (!selectedLanguage) {
        setBackendCode("");
      }
    } else {
      // Reset all fields if no question data
      setShortText("");
      setProblemText("");
      if (!userChangedLanguage) {
        setSelectedLanguage("");
      }
      setPrefilledCode("");
      setSolutionCode("");
      setBackendCode("");
      setMakeDefault(false);
    }
  }, [
    currentQuestionData,
    currentQuestionFromResponse,
    currentQuestionIndex,
    selectedQuestionKey,
    userChangedLanguage,
    userEditingBackendCode,
  ]);

  // Update backend code when language changes
  useEffect(() => {
    if (selectedLanguage && !userEditingBackendCode) {
      const questionData = currentQuestionData || currentQuestionFromResponse;
      if (questionData) {
        const fileContent = getFileContentForLanguage(questionData, selectedLanguage);
        setBackendCode(fileContent);
      }
    }
  }, [selectedLanguage, currentQuestionData, currentQuestionFromResponse]);

  // Update test cases when JSON data changes (from TestCases)
  useEffect(() => {
    if (
      isJsonParsed &&
      questionsData.length > 0 &&
      currentQuestionIndex < questionsData.length
    ) {
      const currentQuestion = questionsData[currentQuestionIndex];
      if (
        currentQuestion.input_output &&
        currentQuestion.input_output.length > 0
      ) {
        const inputOutputData = currentQuestion.input_output[0];
        if (inputOutputData.input && Array.isArray(inputOutputData.input)) {
          const jsonTestCases = inputOutputData.input.map(
            (testCase, index) => ({
              id: testCase.t_id || index + 1,
              input: testCase.input || "",
              output: testCase.output || "",
              type: testCase.testcase_type || "NORMAL_CASE",
              visible: !testCase.is_hidden,
              is_hidden: testCase.is_hidden || false,
            })
          );
          setTestCases(jsonTestCases);
        }
      }
    }
  }, [questionsData, currentQuestionIndex, isJsonParsed]);

  // Additional useEffect hooks from ContentReplication
  useEffect(() => {
    if (apiError) {
      const timer = setTimeout(() => {
        setApiError(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [apiError]);

  useEffect(() => {
    setCurrentQuestionIndex(0);
    setUserChangedLanguage(false); // Reset language flag when switching question keys
  }, [selectedQuestionKey]);

  // Auto-sync UI changes back to JSON data whenever key fields change
  useEffect(() => {
    if (selectedQuestionKey && currentQuestionFromResponse) {
      // Auto-update the jsonResponse when UI fields change
      const questions = [...(jsonResponse[selectedQuestionKey] || [])];
      if (questions[currentQuestionIndex]) {
        const updatedQuestion = { ...questions[currentQuestionIndex] };

        // Update basic fields
        updatedQuestion.short_text = shortText;
        updatedQuestion.question_text = problemText;

        questions[currentQuestionIndex] = updatedQuestion;
        setJsonResponse((prev) => ({
          ...prev,
          [selectedQuestionKey]: questions,
        }));
      }
    } else if (currentQuestionData && isJsonParsed) {
      // Auto-update the questionsData when UI fields change
      const updatedData = [...questionsData];
      if (updatedData[currentQuestionIndex]) {
        const updatedQuestion = { ...updatedData[currentQuestionIndex] };

        // Update basic fields
        updatedQuestion.short_text = shortText;
        updatedQuestion.question_text = problemText;

        updatedData[currentQuestionIndex] = updatedQuestion;
        setQuestionsData(updatedData);

        // Also update the JSON text input
        setJsonTextInput(JSON.stringify(updatedData, null, 2));
      }
    }
  }, [shortText, problemText]); // Only trigger on text changes

  // Auto-sync code-related changes
  useEffect(() => {
    if (
      selectedLanguage &&
      (currentQuestionData || currentQuestionFromResponse)
    ) {
      const questionData = currentQuestionData || currentQuestionFromResponse;
      if (questionData && questionData.code_metadata) {
        // Auto-update code metadata when language or code changes
        const syncCodeChanges = () => {
          if (selectedQuestionKey && currentQuestionFromResponse) {
            const questions = [...(jsonResponse[selectedQuestionKey] || [])];
            if (questions[currentQuestionIndex]) {
              const updatedQuestion = { ...questions[currentQuestionIndex] };

              if (updatedQuestion.code_metadata) {
                updatedQuestion.code_metadata =
                  updatedQuestion.code_metadata.map((meta) => {
                    if (
                      getLanguageDisplayName(meta.language) === selectedLanguage
                    ) {
                      return {
                        ...meta,
                        code_data: prefilledCode,
                        default_code: makeDefault,
                      };
                    }
                    return {
                      ...meta,
                      default_code: makeDefault ? false : meta.default_code,
                    };
                  });
              }

              // Update solution code
              if (updatedQuestion.solutions && updatedQuestion.solutions[0] && updatedQuestion.solutions[0].code_details && updatedQuestion.solutions[0].code_details[0]) {
                updatedQuestion.solutions[0].code_details[0] = {
                  ...updatedQuestion.solutions[0].code_details[0],
                  code_content: solutionCode
                };
              }

              // Update language_code_repository_details with backend code
              if (updatedQuestion.language_code_repository_details && backendCode) {
                const langCode = getLanguageCode(selectedLanguage);
                updatedQuestion.language_code_repository_details = 
                  updatedQuestion.language_code_repository_details.map((langDetail) => {
                    if (langDetail.language === langCode && langDetail.code_repository && langDetail.code_repository.length > 0) {
                      const updatedCodeRepo = [...langDetail.code_repository];
                      if (updatedCodeRepo[0]) {
                        updatedCodeRepo[0] = {
                          ...updatedCodeRepo[0],
                          file_content: encodeBase64(backendCode)
                        };
                      }
                      return {
                        ...langDetail,
                        code_repository: updatedCodeRepo
                      };
                    }
                    return langDetail;
                  });
              }

              questions[currentQuestionIndex] = updatedQuestion;
              setJsonResponse((prev) => ({
                ...prev,
                [selectedQuestionKey]: questions,
              }));
            }
          } else if (currentQuestionData && isJsonParsed) {
            const updatedData = [...questionsData];
            if (updatedData[currentQuestionIndex]) {
              const updatedQuestion = { ...updatedData[currentQuestionIndex] };

              if (updatedQuestion.code_metadata) {
                updatedQuestion.code_metadata =
                  updatedQuestion.code_metadata.map((meta) => {
                    if (
                      getLanguageDisplayName(meta.language) === selectedLanguage
                    ) {
                      return {
                        ...meta,
                        code_data: prefilledCode,
                        default_code: makeDefault,
                      };
                    }
                    return {
                      ...meta,
                      default_code: makeDefault ? false : meta.default_code,
                    };
                  });
              }

              // Update solution code
              if (updatedQuestion.solutions && updatedQuestion.solutions[0] && updatedQuestion.solutions[0].code_details && updatedQuestion.solutions[0].code_details[0]) {
                updatedQuestion.solutions[0].code_details[0] = {
                  ...updatedQuestion.solutions[0].code_details[0],
                  code_content: solutionCode
                };
              }

              // Update language_code_repository_details with backend code
              if (updatedQuestion.language_code_repository_details && backendCode) {
                const langCode = getLanguageCode(selectedLanguage);
                updatedQuestion.language_code_repository_details = 
                  updatedQuestion.language_code_repository_details.map((langDetail) => {
                    if (langDetail.language === langCode && langDetail.code_repository && langDetail.code_repository.length > 0) {
                      const updatedCodeRepo = [...langDetail.code_repository];
                      if (updatedCodeRepo[0]) {
                        updatedCodeRepo[0] = {
                          ...updatedCodeRepo[0],
                          file_content: encodeBase64(backendCode)
                        };
                      }
                      return {
                        ...langDetail,
                        code_repository: updatedCodeRepo
                      };
                    }
                    return langDetail;
                  });
              }

              updatedData[currentQuestionIndex] = updatedQuestion;
              setQuestionsData(updatedData);
              setJsonTextInput(JSON.stringify(updatedData, null, 2));
            }
          }
        };

        syncCodeChanges();
      }
    }
  }, [selectedLanguage, prefilledCode, makeDefault, solutionCode, backendCode]);

  // Auto-sync test cases changes
  useEffect(() => {
    const syncTestCases = () => {
      if (selectedQuestionKey && currentQuestionFromResponse) {
        const questions = [...(jsonResponse[selectedQuestionKey] || [])];
        if (questions[currentQuestionIndex]) {
          const updatedQuestion = { ...questions[currentQuestionIndex] };

          if (
            updatedQuestion.input_output &&
            updatedQuestion.input_output[0] &&
            updatedQuestion.input_output[0].input
          ) {
            const updatedInputOutput = { ...updatedQuestion.input_output[0] };
            const updatedTestCasesData = testCases.map((testCase, index) => {
              if (updatedInputOutput.input[index]) {
                return {
                  ...updatedInputOutput.input[index],
                  input: testCase.input,
                  output: testCase.output,
                  testcase_type: testCase.type,
                  is_hidden:
                    testCase.is_hidden !== undefined
                      ? testCase.is_hidden
                      : !testCase.visible,
                };
              }
              return updatedInputOutput.input[index];
            });
            updatedInputOutput.input = updatedTestCasesData;
            updatedQuestion.input_output = [updatedInputOutput];

            questions[currentQuestionIndex] = updatedQuestion;
            setJsonResponse((prev) => {
              const updated = {
                ...prev,
                [selectedQuestionKey]: questions,
              };
              // Update JSON text area when working with generated questions
              if (selectedQuestionKey && questions.length > 0) {
                setJsonTextInput(JSON.stringify(updated, null, 2));
              }
              return updated;
            });
          }
        }
      } else if (currentQuestionData && isJsonParsed) {
        const updatedData = [...questionsData];
        if (updatedData[currentQuestionIndex]) {
          const updatedQuestion = { ...updatedData[currentQuestionIndex] };

          if (
            updatedQuestion.input_output &&
            updatedQuestion.input_output[0] &&
            updatedQuestion.input_output[0].input
          ) {
            const updatedInputOutput = { ...updatedQuestion.input_output[0] };
            const updatedTestCasesData = testCases.map((testCase, index) => {
              if (updatedInputOutput.input[index]) {
                return {
                  ...updatedInputOutput.input[index],
                  input: testCase.input,
                  output: testCase.output,
                  testcase_type: testCase.type,
                  is_hidden:
                    testCase.is_hidden !== undefined
                      ? testCase.is_hidden
                      : !testCase.visible,
                };
              }
              return updatedInputOutput.input[index];
            });
            updatedInputOutput.input = updatedTestCasesData;
            updatedQuestion.input_output = [updatedInputOutput];

            updatedData[currentQuestionIndex] = updatedQuestion;
            setQuestionsData(updatedData);
            setJsonTextInput(JSON.stringify(updatedData, null, 2));
          }
        }
      }
    };

    syncTestCases();
  }, [testCases]); // Trigger when test cases change

  const validateAndParseJson = (jsonString) => {
    try {
      const parsedData = JSON.parse(jsonString);
      if (Array.isArray(parsedData)) {
        setQuestionsData(parsedData);
        setCurrentQuestionIndex(0);
        setIsJsonParsed(true);
        setUserChangedLanguage(false); // Reset language flag when parsing new JSON
        console.log("JSON parsed successfully:", parsedData);
        return true;
      } else {
        alert("JSON should be an array of questions");
        setIsJsonParsed(false);
        return false;
      }
    } catch (error) {
      alert("Invalid JSON format. Please check your JSON and try again.");
      console.error("JSON parsing error:", error);
      setIsJsonParsed(false);
      return false;
    }
  };

  const handleTextChange = (e) => {
    const text = e.target.value;
    setJsonTextInput(text);

    // Validate JSON on every change and update components accordingly
    if (text.trim() !== "") {
      try {
        const parsed = JSON.parse(text);
        setJsonData(parsed);

        if (Array.isArray(parsed)) {
          setQuestionsData(parsed);
          setCurrentQuestionIndex(0);
          setIsJsonParsed(true);

          // ContentReplication states
          setJsonResponse({
            Base_Question: parsed,
          });
          setSelectedQuestionKey("Base_Question");
        } else {
          setJsonResponse({
            Base_Question: [parsed],
          });
          setSelectedQuestionKey("Base_Question");
          setQuestionsData([parsed]);
          setCurrentQuestionIndex(0);
          setIsJsonParsed(true);
        }
        setError(null);
      } catch {
        setError("Invalid JSON text.");
        setJsonData(null);
        setJsonResponse({});
        setSelectedQuestionKey(null);
        setIsJsonParsed(false);
        setQuestionsData([]);
      }
    } else {
      setIsJsonParsed(false);
      setQuestionsData([]);
      setJsonData(null);
      setJsonResponse({});
      setSelectedQuestionKey(null);
      setError(null);
    }
  };

  const handleFileUpload = (e) => {
    // Prevent file upload during generation
    if (loading) {
      e.preventDefault();
      return;
    }

    setError(null);
    setApiError(null);

    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (
        !file.name.toLowerCase().endsWith(".json") &&
        !file.type.toLowerCase().includes("json")
      ) {
        setError("Please upload a JSON file with .json extension.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;

        try {
          const parsed = JSON.parse(content);

          if (typeof parsed !== "object" || parsed === null) {
            setError("Invalid JSON structure: expected an object or array.");
            setJsonData(null);
            setJsonResponse({});
            setSelectedQuestionKey(null);
            return;
          }

          // Reset all UI states before setting new data
          setCurrentQuestionIndex(0);
          setCurrentQuestion(0);
          setShortText("");
          setProblemText("");
          setSelectedLanguage("");
          setMakeDefault(false);
          setPrefilledCode("");
          setSolutionCode("");
          setBackendCode("");
          setUserChangedLanguage(false); // Reset language flag for new data

          // Set states for both ContentLoop and ContentReplication functionality
          setJsonData(parsed);
          setJsonTextInput(content);

          if (Array.isArray(parsed)) {
            setQuestionsData(parsed);
            setIsJsonParsed(true);

            // ContentReplication states
            setJsonResponse({
              Base_Question: parsed,
            });
            setSelectedQuestionKey("Base_Question");
          } else {
            setJsonResponse({
              Base_Question: [parsed],
            });
            setSelectedQuestionKey("Base_Question");
            setQuestionsData([parsed]);
            setIsJsonParsed(true);
          }

          console.log("JSON file uploaded successfully:", parsed);
        } catch (error) {
          setError("Invalid JSON format. Please upload a valid JSON file.");
          console.error("JSON parsing error:", error);
          setJsonData(null);
          setJsonResponse({});
          setSelectedQuestionKey(null);
          setIsJsonParsed(false);
          setQuestionsData([]);
          // Clear the file input
          e.target.value = "";
        }
      };
      reader.readAsText(file);
    }
  };

  // Function to handle question navigation from ContentQuestions
  const handleQuestionChange = (index) => {
    setCurrentQuestionIndex(index);
    setUserChangedLanguage(false); // Reset the flag when changing questions
    setUserEditingBackendCode(false); // Reset backend editing flag
  };

  // ContentQuestions navigation functions
  const handleQuestionClick = (index) => {
    handleQuestionChange(index);
    setCurrentQuestion(index);
  };

  const handlePrevious = () => {
    if (selectedQuestionKey && questionsForKey.length > 0) {
      // For generated questions navigation
      const newIndex = Math.max(0, currentQuestionIndex - 1);
      setCurrentQuestionIndex(newIndex);
      setUserChangedLanguage(false); // Reset the flag when navigating
    } else {
      // For regular questions navigation
      const newIndex =
        currentQuestion > 0 ? currentQuestion - 1 : currentQuestion;
      handleQuestionChange(newIndex);
      setCurrentQuestion(newIndex);
    }
  };

  const handleNext = () => {
    if (selectedQuestionKey && questionsForKey.length > 0) {
      // For generated questions navigation
      const newIndex = Math.min(
        questionsForKey.length - 1,
        currentQuestionIndex + 1
      );
      setCurrentQuestionIndex(newIndex);
      setUserChangedLanguage(false); // Reset the flag when navigating
    } else {
      // For regular questions navigation
      const maxIndex = displayQuestionsData.questions.length - 1;
      const newIndex =
        currentQuestion < maxIndex ? currentQuestion + 1 : currentQuestion;
      handleQuestionChange(newIndex);
      setCurrentQuestion(newIndex);
    }
  };

  // Handler for language selection change
  const handleLanguageChange = (selectedLang) => {
    setSelectedLanguage(selectedLang);
    setUserChangedLanguage(true); // Mark that user has manually changed the language
    setUserEditingBackendCode(false); // Reset backend editing flag when language changes

    // Find the corresponding code metadata for the selected language
    const questionData = currentQuestionData || currentQuestionFromResponse;
    if (questionData && questionData.code_metadata) {
      const selectedMeta = questionData.code_metadata.find(
        (meta) => getLanguageDisplayName(meta.language) === selectedLang
      );

      if (selectedMeta) {
        setPrefilledCode(selectedMeta.code_data || "");
        setMakeDefault(selectedMeta.default_code || false);
      }
    }

    // Update backend code based on selected language
    if (questionData) {
      const fileContent = getFileContentForLanguage(questionData, selectedLang);
      setBackendCode(fileContent);
    }
  };

  // Handler for backend code changes
  const handleBackendCodeChange = (newCode) => {
    setUserEditingBackendCode(true);
    setBackendCode(newCode);
    
    // Clear any existing timeout
    if (window.backendCodeTimeout) {
      clearTimeout(window.backendCodeTimeout);
    }
    
    // Set a timeout to reset the editing flag after user stops typing
    window.backendCodeTimeout = setTimeout(() => {
      setUserEditingBackendCode(false);
    }, 1000); // 1 second delay
  };

  // TestCases functions
  const updateTestCase = (id, field, value) => {
    setTestCases((prevCases) =>
      prevCases.map((testCase) => {
        if (testCase.id === id) {
          if (field === "is_hidden") {
            return {
              ...testCase,
              [field]: value,
              visible: !value, // Update visible when is_hidden changes
            };
          }
          return { ...testCase, [field]: value };
        }
        return testCase;
      })
    );
  };

  // ContentReplication update functions
  const updateQuestionField = (key, index, field, value) => {
    setJsonResponse((prev) => {
      const updated = { ...prev };
      updated[key] = [...updated[key]];
      updated[key][index] = { ...updated[key][index], [field]: value };
      return updated;
    });
  };

  const updateInputOutputField = (key, qIndex, ioIndex, field, value) => {
    setJsonResponse((prev) => {
      const updated = { ...prev };
      const questions = [...updated[key]];
      const question = { ...questions[qIndex] };

      if (
        !question.input_output ||
        question.input_output.length === 0 ||
        !question.input_output[0].input
      )
        return prev;

      const ioList = [...question.input_output[0].input];
      ioList[ioIndex] = { ...ioList[ioIndex], [field]: value };

      const newInputOutput0 = { ...question.input_output[0], input: ioList };
      question.input_output = [newInputOutput0];

      questions[qIndex] = question;
      updated[key] = questions;
      return updated;
    });
  };

  const updateCodeMetadataField = (key, qIndex, metaIndex, field, value) => {
    setJsonResponse((prev) => {
      const updated = { ...prev };
      const questions = [...updated[key]];
      const question = { ...questions[qIndex] };

      const codeMeta = question.code_metadata
        ? [...question.code_metadata]
        : [];
      if (codeMeta.length <= metaIndex) return prev;

      codeMeta[metaIndex] = { ...codeMeta[metaIndex], [field]: value };
      question.code_metadata = codeMeta;

      questions[qIndex] = question;
      updated[key] = questions;
      return updated;
    });
  };

  const updateCodeDetailsField = (key, qIndex, detailIndex, field, value) => {
    setJsonResponse((prev) => {
      const updated = { ...prev };
      const questions = [...updated[key]];
      const question = { ...questions[qIndex] };

      const codeDetails =
        question.solutions && question.solutions[0]?.code_details
          ? [...question.solutions[0].code_details]
          : [];

      if (codeDetails.length <= detailIndex) return prev;

      codeDetails[detailIndex] = {
        ...codeDetails[detailIndex],
        [field]: value,
      };

      if (question.solutions && question.solutions[0]) {
        question.solutions[0].code_details = codeDetails;
      }

      questions[qIndex] = question;
      updated[key] = questions;
      return updated;
    });
  };

  const updateCodeRepoField = (
    key,
    qIndex,
    metaIndex,
    fileIndex,
    field,
    value
  ) => {
    setJsonResponse((prev) => {
      const updated = { ...prev };
      const questions = [...updated[key]];
      const question = { ...questions[qIndex] };

      const repoDetails = question.language_code_repository_details
        ? [...question.language_code_repository_details]
        : [];
      if (repoDetails.length <= metaIndex) return prev;

      const repoMeta = { ...repoDetails[metaIndex] };
      const codeRepo = repoMeta.code_repository
        ? [...repoMeta.code_repository]
        : [];
      if (codeRepo.length <= fileIndex) return prev;

      let updatedFile = { ...codeRepo[fileIndex] };

      if (field === "file_content") {
        updatedFile.file_content = encodeBase64(value);
      } else {
        updatedFile[field] = value;
      }

      codeRepo[fileIndex] = updatedFile;
      repoMeta.code_repository = codeRepo;
      repoDetails[metaIndex] = repoMeta;

      question.language_code_repository_details = repoDetails;
      questions[qIndex] = question;
      updated[key] = questions;
      return updated;
    });
  };

  // Function to sync current UI state back to JSON data
  const syncUIStateToJSON = () => {
    let updatedJsonResponse = { ...jsonResponse };
    let updatedQuestionsData = [...questionsData];

    // If we're working with generated questions (selectedQuestionKey exists)
    if (selectedQuestionKey && currentQuestionFromResponse) {
      const questions = [...(updatedJsonResponse[selectedQuestionKey] || [])];
      if (questions[currentQuestionIndex]) {
        const currentQ = { ...questions[currentQuestionIndex] };

        // Update basic question fields
        currentQ.short_text = shortText;
        currentQ.problem_text = problemText; // Use problem_text consistently

        // Update code metadata based on selected language
        if (currentQ.code_metadata && selectedLanguage) {
          const updatedCodeMetadata = currentQ.code_metadata.map((meta) => {
            if (getLanguageDisplayName(meta.language) === selectedLanguage) {
              return {
                ...meta,
                prefilled_code: prefilledCode,
                make_default: makeDefault,
              };
            }
            return {
              ...meta,
              make_default: false, // Set others to false if current is true
            };
          });
          currentQ.code_metadata = updatedCodeMetadata;
        }

        // Update solution code
        if (
          currentQ.solutions &&
          currentQ.solutions[0] &&
          currentQ.solutions[0].code_details
        ) {
          const updatedSolution = { ...currentQ.solutions[0] };
          if (updatedSolution.code_details[0]) {
            updatedSolution.code_details[0] = {
              ...updatedSolution.code_details[0],
              code_content: solutionCode,
            };
          }
          currentQ.solutions = [updatedSolution];
        }

        // Update language_code_repository_details with backend code
        if (currentQ.language_code_repository_details && backendCode && selectedLanguage) {
          const langCode = getLanguageCode(selectedLanguage);
          currentQ.language_code_repository_details = 
            currentQ.language_code_repository_details.map((langDetail) => {
              if (langDetail.language === langCode && langDetail.code_repository && langDetail.code_repository.length > 0) {
                const updatedCodeRepo = [...langDetail.code_repository];
                if (updatedCodeRepo[0]) {
                  updatedCodeRepo[0] = {
                    ...updatedCodeRepo[0],
                    file_content: encodeBase64(backendCode)
                  };
                }
                return {
                  ...langDetail,
                  code_repository: updatedCodeRepo
                };
              }
              return langDetail;
            });
        }

        // Update test cases
        if (
          currentQ.input_output &&
          currentQ.input_output[0] &&
          currentQ.input_output[0].input
        ) {
          const updatedInputOutput = { ...currentQ.input_output[0] };
          const updatedTestCases = testCases.map((testCase, index) => {
            if (updatedInputOutput.input[index]) {
              return {
                ...updatedInputOutput.input[index],
                input: testCase.input,
                output: testCase.output,
                testcase_type: testCase.type,
                is_hidden:
                  testCase.is_hidden !== undefined
                    ? testCase.is_hidden
                    : !testCase.visible,
              };
            }
            return updatedInputOutput.input[index];
          });
          updatedInputOutput.input = updatedTestCases;
          currentQ.input_output = [updatedInputOutput];
        }

        questions[currentQuestionIndex] = currentQ;
        updatedJsonResponse[selectedQuestionKey] = questions;
      }
    }
    // If we're working with original JSON data
    else if (currentQuestionData && isJsonParsed) {
      if (updatedQuestionsData[currentQuestionIndex]) {
        const currentQ = { ...updatedQuestionsData[currentQuestionIndex] };

        // Update basic question fields
        currentQ.short_text = shortText;
        currentQ.problem_text = problemText; // Use problem_text consistently

        // Update code metadata based on selected language
        if (currentQ.code_metadata && selectedLanguage) {
          const updatedCodeMetadata = currentQ.code_metadata.map((meta) => {
            if (getLanguageDisplayName(meta.language) === selectedLanguage) {
              return {
                ...meta,
                prefilled_code: prefilledCode,
                make_default: makeDefault,
              };
            }
            return {
              ...meta,
              make_default: false, // Set others to false if current is true
            };
          });
          currentQ.code_metadata = updatedCodeMetadata;
        }

        // Update solution code
        if (
          currentQ.solutions &&
          currentQ.solutions[0] &&
          currentQ.solutions[0].code_details
        ) {
          const updatedSolution = { ...currentQ.solutions[0] };
          if (updatedSolution.code_details[0]) {
            updatedSolution.code_details[0] = {
              ...updatedSolution.code_details[0],
              code_content: solutionCode,
            };
          }
          currentQ.solutions = [updatedSolution];
        }

        // Update language_code_repository_details with backend code
        if (currentQ.language_code_repository_details && backendCode && selectedLanguage) {
          const langCode = getLanguageCode(selectedLanguage);
          currentQ.language_code_repository_details = 
            currentQ.language_code_repository_details.map((langDetail) => {
              if (langDetail.language === langCode && langDetail.code_repository && langDetail.code_repository.length > 0) {
                const updatedCodeRepo = [...langDetail.code_repository];
                if (updatedCodeRepo[0]) {
                  updatedCodeRepo[0] = {
                    ...updatedCodeRepo[0],
                    file_content: encodeBase64(backendCode)
                  };
                }
                return {
                  ...langDetail,
                  code_repository: updatedCodeRepo
                };
              }
              return langDetail;
            });
        }

        // Update test cases
        if (
          currentQ.input_output &&
          currentQ.input_output[0] &&
          currentQ.input_output[0].input
        ) {
          const updatedInputOutput = { ...currentQ.input_output[0] };
          const updatedTestCases = testCases.map((testCase, index) => {
            if (updatedInputOutput.input[index]) {
              return {
                ...updatedInputOutput.input[index],
                input: testCase.input,
                output: testCase.output,
                testcase_type: testCase.type,
                is_hidden:
                  testCase.is_hidden !== undefined
                    ? testCase.is_hidden
                    : !testCase.visible,
              };
            }
            return updatedInputOutput.input[index];
          });
          updatedInputOutput.input = updatedTestCases;
          currentQ.input_output = [updatedInputOutput];
        }

        updatedQuestionsData[currentQuestionIndex] = currentQ;

        // Update jsonResponse to include the original data with modifications
        updatedJsonResponse = {
          ...updatedJsonResponse,
          Base_Question: updatedQuestionsData,
        };
      }
    }

    return { updatedJsonResponse, updatedQuestionsData };
  };

  // Update JSON text input whenever questionsData changes
  useEffect(() => {
    if (questionsData.length > 0) {
      const updatedJsonText = JSON.stringify(questionsData, null, 2);
      setJsonTextInput(updatedJsonText);
    }
  }, [questionsData]);

  const handleDownloadZip = async () => {
    // Sync all UI changes back to JSON data before downloading
    const { updatedJsonResponse, updatedQuestionsData } = syncUIStateToJSON();

    // Update states with synced data
    if (updatedQuestionsData) {
      setQuestionsData(updatedQuestionsData);
    }
    if (updatedJsonResponse) {
      setJsonResponse(updatedJsonResponse);
    }

    const zip = new JSZip();
    const folder = zip.folder("Coding Questions");

    if (!folder) {
      setError("Failed to create ZIP folder.");
      return;
    }

    // Use the updated JSON response with all UI changes
    Object.entries(updatedJsonResponse).forEach(([key, questions]) => {
      const fileName = `${key}.json`;
      const content = JSON.stringify(questions, null, 2);
      folder.file(fileName, content);
    });

    try {
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "Coding_Questions.zip");
      console.log("ZIP downloaded with all UI changes included");
    } catch {
      setError("Failed to generate ZIP file.");
    }
  };

  const handleGenerate = async () => {
    // Sync all UI changes before generating
    const { updatedJsonResponse, updatedQuestionsData } = syncUIStateToJSON();

    setApiError(null);
    setError(null);

    // Use updated data instead of original jsonData
    const dataToGenerate =
      updatedQuestionsData.length > 0 ? updatedQuestionsData : jsonData;

    if (!dataToGenerate || !Array.isArray(dataToGenerate)) {
      setError("No valid JSON array data to generate.");
      return;
    }

    setLoading(true);

    try {
      let updatedQuestionsObj = { ...updatedJsonResponse };
      const totalQuestions = dataToGenerate.length;

      for (let i = 0; i < totalQuestions; i++) {
        const question = dataToGenerate[i];

        const response = await authFetch(
          "https://ravik00111110.pythonanywhere.com/api/content-gen/replicate/",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: [question] }),
          },
          navigate,
          900000,
          true
        );

        if (!response.ok) {
          throw new Error(
            `API error on question ${i + 1}: ${response.statusText}`
          );
        }

        const data = await response.json();

        const questionData = data.message.question1;

        updatedQuestionsObj[`Question${i + 1}`] = Array.isArray(questionData)
          ? questionData
          : [questionData];

        setJsonResponse({ ...updatedQuestionsObj });
        setJsonTextInput(JSON.stringify(updatedQuestionsObj, null, 2));
        setSelectedQuestionKey((prev) => prev || "Question1");
        setApiError(`Generated ${i + 1} / ${totalQuestions} questions`);
      }

      setApiError(null);
      setCurrentQuestionIndex(0);
    } catch (err) {
      setApiError(err.message || "API call failed.");
    } finally {
      setLoading(false);
    }
  };

  // Custom styles for outlined components (from ContentQuestions)
  const outlinedStyles = {
    "& .MuiOutlinedInput-root": {
      "& fieldset": {
        borderColor: "#001A48",
        borderWidth: "2px",
        boxShadow: "none",
      },
      "&:hover fieldset": {
        borderColor: "#001A48",
        borderWidth: "2px",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#001A48",
        borderWidth: "2px",
      },
    },
    "& .MuiInputLabel-root": {
      color: "gray",
      fontWeight: "500",
      "&.Mui-focused": {
        color: "#001A48",
        fontWeight: "700",
      },
    },
    backgroundColor: "white",
  };

  // TestCases styles
  const testCasesOutlinedStyles = {
    "& .MuiOutlinedInput-root": {
      "& fieldset": {
        borderColor: "#001A4B",
        borderWidth: "2px",
        boxShadow: "none",
      },
      "&:hover fieldset": {
        borderColor: "#001A4B",
        borderWidth: "2px",
        boxShadow: "none",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#001A4B",
        borderWidth: "2px",
        boxShadow: "none",
      },
      boxShadow: "none",
    },
    "& .MuiInputLabel-root": {
      color: "#001A4B",
      "&.Mui-focused": {
        color: "#001A4B",
        fontWeight: "600",
      },
      fontWeight: "500",
    },
    boxShadow: "none",
  };

  return (
    <>
      <Navbar />
      <div className="content-loop-container">
        <div className="content-loop-wrapper">
          <div className="text-area-container">
            <textarea
              className="json-text-area"
              placeholder="Paste your JSON here or upload a file"
              value={jsonTextInput}
              onChange={handleTextChange}
            />
          </div>
          <div className="button-container">
            <div className="file-upload-wrapper">
              <input
                type="file"
                id="file-upload"
                className="file-input"
                accept=".json"
                onChange={handleFileUpload}
                disabled={loading}
              />
              <label
                htmlFor="file-upload"
                className={`choose-file-btn ${loading ? "disabled" : ""}`}
                style={{
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                Choose File
              </label>
            </div>
            <button
              className={`generate-btn ${loading ? "loading" : ""}`}
              onClick={handleGenerate}
              disabled={loading}
              style={{
                opacity: loading ? 1 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {apiError ? apiError : (loading ? "Generating..." : "Generate")}
            </button>
          </div>

          {/* Error Messages */}
          {/*{apiError && (
            <p
              className="error-message"
              style={{ color: "red", margin: "10px 0" }}
            >
              {apiError}
            </p>
          )}*/}
          {error && (
            <p
              className="error-message"
              style={{ color: "red", margin: "10px 0" }}
            >
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Combined ContentQuestions and TestCases - only show when JSON is valid */}
      {isJsonParsed && (
        <>
          {/* ContentQuestions Section */}
          <div className="content-questions-container">
            {/* Top Navigation Bar */}
            <div className="top-navbar">
              <div className="question-tabs">
                {/* Question Keys from ContentReplication */}
                {Object.keys(jsonResponse).length > 0 &&
                  Object.keys(jsonResponse).map((key) => (
                    <button
                      key={key}
                      onClick={() => setSelectedQuestionKey(key)}
                      className={`question-tab ${
                        selectedQuestionKey === key ? "active" : ""
                      }`}
                    >
                      {key === "Base_Question" ? "Base Question" : key}
                    </button>
                  ))}

              </div>
            </div>

            {/* Main Content Area */}
            <div className="main-content">
              {/* Left Section */}
              <div className="left-section">
                <div
                  className="short-text-container"
                  style={{ marginBottom: "10px" }}
                >
                  <TextField
                    value={shortText}
                    onChange={(e) => setShortText(e.target.value)}
                    label="Short Text"
                    variant="outlined"
                    fullWidth
                    sx={{
                      ...outlinedStyles,
                      height: "45px",
                      "& .MuiInputBase-root": {
                        height: "45px",
                        minHeight: "45px",
                        maxHeight: "45px",
                      },
                      "& .MuiInputBase-input": {
                        padding: "8px 14px",
                      },
                    }}
                  />
                </div>
                <div
                  className="textarea-group"
                  style={{ height: "calc(100% - 60px)" }}
                >
                  <TextField
                    value={problemText}
                    onChange={(e) => setProblemText(e.target.value)}
                    label="Problem Text"
                    variant="outlined"
                    fullWidth
                    multiline
                    minRows={10}
                    sx={{
                      ...outlinedStyles,
                      height: "100%",
                      "& .MuiInputBase-root": {
                        height: "100%",
                        alignItems: "flex-start",
                      },
                      "& .MuiInputBase-inputMultiline": {
                        height: "100% !important",
                        overflow: "auto !important",
                      },
                    }}
                  />
                </div>
              </div>

              {/* Right Section */}
              <div className="right-section">
                {/* Question Title - similar to CodingReplication */}
                {/*(selectedQuestionKey && currentQuestionFromResponse) && (
                                                        <h3 className="question-editor-title" style={{
                                                            margin: '10px 0',
                                                            fontSize: '18px',
                                                            fontWeight: 'bold',
                                                            color: '#001A48'
                                                        }}>
                                                            {selectedQuestionKey} — Question {currentQuestionIndex + 1} of{" "}
                                                            {questionsForKey.length}
                                                        </h3>
                                                    )*/}
                {/* Navigation Controls - All in one row */}
                <div className="navigation-section">
                  <button
                    className="header-nav-button prev-button"
                    onClick={handlePrevious}
                    disabled={
                      selectedQuestionKey && questionsForKey.length > 0
                        ? currentQuestionIndex === 0
                        : currentQuestion === 0
                    }
                  >
                    Previous
                  </button>
                  <button
                    className="header-nav-button next-button"
                    onClick={handleNext}
                    disabled={
                      selectedQuestionKey && questionsForKey.length > 0
                        ? currentQuestionIndex === questionsForKey.length - 1
                        : currentQuestion ===
                          displayQuestionsData.questions.length - 1
                    }
                  >
                    Next
                  </button>
                  <div className="header-counter">
                    <span className="header-counter-text">
                      Displaying Question{" "}
                      {selectedQuestionKey && questionsForKey.length > 0
                        ? currentQuestionIndex + 1
                        : currentQuestion + 1}{" "}
                      of{" "}
                      {selectedQuestionKey && questionsForKey.length > 0
                        ? questionsForKey.length
                        : displayQuestionsData.total}
                    </span>
                  </div>
                </div>{" "}
                {/* Code Details Row: Title, Language, Checkbox */}
                <div className="code-details-row">
                  <h3 className="section-title">Code Details</h3>
                  <div className="code-details-inputs">
                    <div className="language-selector">
                      <FormControl fullWidth>
                        <InputLabel
                          sx={{
                            color: "#001A48",
                            fontWeight: 500,
                            "&.Mui-focused": {
                              color: "#001A48",
                              fontWeight: 700,
                            },
                          }}
                        >
                          Choose Language
                        </InputLabel>
                        <Select
                          value={selectedLanguage}
                          onChange={(e) => handleLanguageChange(e.target.value)}
                          label="Choose Language"
                          variant="outlined"
                          sx={{
                            minWidth: "280px",
                            height: "40px",
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#001A48",
                              borderWidth: "2px",
                              boxShadow: "none",
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#001A48",
                              borderWidth: "2px",
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#001A48",
                              borderWidth: "2px",
                            },
                            "& .MuiSelect-select": {
                              paddingTop: "12px",
                              paddingBottom: "12px",
                              color: "#001A48",
                            },
                            backgroundColor: "white",
                          }}
                        >
                          {languages.map((lang) => (
                            <MenuItem
                              key={lang}
                              value={lang}
                              sx={{
                                color: "#001A48",
                                "&.Mui-selected": {
                                  backgroundColor: "rgba(0, 26, 72, 0.08)",
                                },
                              }}
                            >
                              {lang}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </div>
                    <div className="checkbox-group">
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={makeDefault}
                            onChange={(e) => setMakeDefault(e.target.checked)}
                            sx={{
                              color: "#001A48",
                              "&.Mui-checked": {
                                color: "#001A48",
                              },
                            }}
                          />
                        }
                        label="Make it default code"
                        sx={{
                          color: "#001A48",
                          "& .MuiTypography-root": {
                            fontWeight: 500,
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="code-editors" style={{ gap: "10px" }}>
                  <div className="code-editor-group" style={{ height: "30%" }}>
                    <TextField
                      value={prefilledCode}
                      onChange={(e) => setPrefilledCode(e.target.value)}
                      label="Prefilled Code"
                      variant="outlined"
                      fullWidth
                      multiline
                      sx={{
                        ...outlinedStyles,
                        height: "100%",
                        "& .MuiInputBase-root": {
                          height: "100%",
                          alignItems: "flex-start",
                          fontFamily: "monospace",
                        },
                        "& .MuiInputBase-inputMultiline": {
                          height: "100% !important",
                          overflow: "auto !important",
                          fontFamily: "monospace",
                        },
                      }}
                    />
                  </div>
                  <div className="code-editor-group" style={{ height: "30%" }}>
                    <TextField
                      value={solutionCode}
                      onChange={(e) => setSolutionCode(e.target.value)}
                      label="Solution Code"
                      variant="outlined"
                      fullWidth
                      multiline
                      sx={{
                        ...outlinedStyles,
                        height: "100%",
                        "& .MuiInputBase-root": {
                          height: "100%",
                          alignItems: "flex-start",
                          fontFamily: "monospace",
                        },
                        "& .MuiInputBase-inputMultiline": {
                          height: "100% !important",
                          overflow: "auto !important",
                          fontFamily: "monospace",
                        },
                      }}
                    />
                  </div>
                  <div className="code-editor-group" style={{ height: "30%" }}>
                    <TextField
                      value={backendCode}
                      onChange={(e) => handleBackendCodeChange(e.target.value)}
                      label="Backend Code"
                      variant="outlined"
                      fullWidth
                      multiline
                      sx={{
                        ...outlinedStyles,
                        height: "100%",
                        "& .MuiInputBase-root": {
                          height: "100%",
                          alignItems: "flex-start",
                          fontFamily: "monospace",
                        },
                        "& .MuiInputBase-inputMultiline": {
                          height: "100% !important",
                          overflow: "auto !important",
                          fontFamily: "monospace",
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TestCases Section */}
          <div className="test-cases-container">
            {/* Header Section */}
            <div className="test-cases-header">
              <h1 className="test-cases-title">TEST CASES</h1>
            </div>

            {/* Test Cases List */}
            <div className="test-cases-list">
              {testCases.map((testCase, index) => (
                <div key={testCase.id} className="test-case-row">
                  {/* Test Case Number - Start from 1 to n */}
                  <div className="test-case-number">
                    <span className="number">{index + 1}</span>
                  </div>

                  {/* Test Case Fields */}
                  <div className="test-case-fields">
                    {/* Input Field */}
                    <div className="field-group output-field">
                      <TextField
                        value={testCase.input}
                        onChange={(e) =>
                          updateTestCase(testCase.id, "input", e.target.value)
                        }
                        placeholder="Input"
                        label="Input"
                        variant="outlined"
                        fullWidth
                        multiline
                        minRows={1}
                        maxRows={5}
                        sx={{
                          ...testCasesOutlinedStyles,
                          "& .MuiInputBase-root": {
                            fontFamily: "monospace",
                          },
                          "& .MuiInputBase-input": {
                            fontFamily: "monospace",
                          },
                          "& .MuiInputBase-inputMultiline": {
                            fontFamily: "monospace",
                          },
                        }}
                      />
                    </div>

                    {/* Output Field */}
                    <div className="field-group output-field">
                      <TextField
                        value={testCase.output}
                        onChange={(e) =>
                          updateTestCase(testCase.id, "output", e.target.value)
                        }
                        placeholder="Output"
                        label="Output"
                        variant="outlined"
                        fullWidth
                        multiline
                        minRows={1}
                        maxRows={5}
                        sx={{ 
                          ...testCasesOutlinedStyles,
                          "& .MuiInputBase-root": {
                            fontFamily: "monospace",
                            
                          },
                          "& .MuiInputBase-input": {
                            fontFamily: "monospace",
                          },
                          "& .MuiInputBase-inputMultiline": {
                            fontFamily: "monospace",
                          },
                        }}
                      />
                    </div>

                    {/* Type Field */}
                    <div className="field-group type-field">
                      <TextField
                        value={testCase.type}
                        onChange={(e) =>
                          updateTestCase(testCase.id, "type", e.target.value)
                        }
                        placeholder="Type"
                        label="Type"
                        variant="outlined"
                        fullWidth
                        sx={testCasesOutlinedStyles}
                      />
                    </div>

                    {/* Hidden Field */}
                    <div className="field-group visible-field">
                      <TextField
                        select
                        value={testCase.is_hidden?.toString() || "false"}
                        onChange={(e) =>
                          updateTestCase(
                            testCase.id,
                            "is_hidden",
                            e.target.value === "true"
                          )
                        }
                        label="Visible"
                        variant="outlined"
                        fullWidth
                        sx={testCasesOutlinedStyles}
                      >
                        <MenuItem value="true">True</MenuItem>
                        <MenuItem value="false">False</MenuItem>
                      </TextField>
                    </div>
                  </div>
                </div>
              ))}

              {/* Download ZIP Button - moved to navbar */}
              {Object.keys(jsonResponse).length > 0 && (
                <div className="btn-container" style={{ marginLeft: "auto" }}>
                  <button
                    className="download-btn"
                    onClick={handleDownloadZip}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#001A4B",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontSize: "14px",
                      width: "180px",
                      height: "50px",
                    }}
                  >
                    Download ZIP
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ContentLoop;

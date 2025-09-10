import { useState, useEffect } from "react";
import "./ContentQuestions.css";
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
} from "@mui/material";

const ContentQuestions = ({ questionsData, currentQuestionIndex, onQuestionChange, isJsonParsed }) => {
  // Mock data - you can replace this with props or API data
  console.log(isJsonParsed)
  const [mockQuestionsData] = useState({
    questions: [
      { id: "base", name: "Base Question" },
      { id: "q1", name: "Question 1" },
      { id: "q2", name: "Question 2" },
      { id: "q3", name: "Question 3" },
      { id: "q4", name: "Question 4" },
      { id: "q5", name: "Question 5" },
      { id: "q6", name: "Question 6" },
      { id: "q7", name: "Question 7" },
    ],
    currentIndex: 0,
    total: 7, // Updated to match actual number of questions
  });

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [shortText, setShortText] = useState("");
  const [problemText, setProblemText] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [makeDefault, setMakeDefault] = useState(false);
  const [prefilledCode, setPrefilledCode] = useState("");
  const [solutionCode, setSolutionCode] = useState("");
  const [backendCode, setBackendCode] = useState("");

  // Use mock data if no JSON is parsed, otherwise use actual data
  const displayQuestionsData = isJsonParsed && questionsData.length > 0 ? 
    {
      questions: questionsData.map((q, index) => ({
        id: `q${index}`,
        name: q.short_text || `Question ${index + 1}`
      })),
      total: questionsData.length
    } : mockQuestionsData;

  const currentQuestionData = isJsonParsed && questionsData.length > 0 ? 
    questionsData[currentQuestionIndex] : null;

  // Update local state when question changes
  useEffect(() => {
    if (currentQuestionData) {
      setShortText(currentQuestionData.short_text || "");
      setProblemText(currentQuestionData.question_text || "");
      
      // Find default language from code_metadata
      const defaultCodeMeta = currentQuestionData.code_metadata?.find(meta => meta.default_code === true);
      if (defaultCodeMeta) {
        setSelectedLanguage(getLanguageDisplayName(defaultCodeMeta.language));
        setPrefilledCode(defaultCodeMeta.code_data || "");
      }
      
      // Set solution code from solutions
      if (currentQuestionData.solutions && currentQuestionData.solutions.length > 0) {
        const solution = currentQuestionData.solutions[0];
        if (solution.code_details && solution.code_details.length > 0) {
          setSolutionCode(solution.code_details[0].code_content || "");
        }
      }
    }
  }, [currentQuestionData, currentQuestionIndex]);

  // Helper function to convert language codes to display names
  const getLanguageDisplayName = (langCode) => {
    const languageMap = {
      'PYTHON39': 'Python',
      'JAVA': 'Java',
      'CPP': 'C++',
      'C': 'C',
      'JAVASCRIPT': 'JavaScript',
      'GO': 'Go',
      'RUST': 'Rust',
      'C_SHARP': 'C#'
    };
    return languageMap[langCode] || langCode;
  };

  const languages = ["Python", "JavaScript", "Java", "C++", "Go", "Rust", "C#"];

  const handleQuestionClick = (index) => {
    if (isJsonParsed && onQuestionChange) {
      onQuestionChange(index);
    }
    setCurrentQuestion(index);
  };

  const handlePrevious = () => {
    const newIndex = currentQuestion > 0 ? currentQuestion - 1 : currentQuestion;
    if (isJsonParsed && onQuestionChange) {
      onQuestionChange(newIndex);
    }
    setCurrentQuestion(newIndex);
  };

  const handleNext = () => {
    const maxIndex = displayQuestionsData.questions.length - 1;
    const newIndex = currentQuestion < maxIndex ? currentQuestion + 1 : currentQuestion;
    if (isJsonParsed && onQuestionChange) {
      onQuestionChange(newIndex);
    }
    setCurrentQuestion(newIndex);
  };

  // Custom styles for outlined components
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

  return (
    <div className="content-questions-container">
      {/* Top Navigation Bar */}
      <div className="top-navbar">
        <div className="question-tabs">
          {displayQuestionsData.questions.map((question, index) => (
            <button
              key={question.id}
              className={`question-tab 
                ${currentQuestion === index ? "active" : ""} 
                ${index === 0 && currentQuestion !== 0 ? "base-inactive" : ""}`}
              onClick={() => handleQuestionClick(index)}
            >
              {question.name}
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
              sx={outlinedStyles}
            />
          </div>
          <div
            className="textarea-group"
            style={{ height: "calc(100% - 66px)" }}
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
          {/* Navigation Controls - All in one row */}
          <div className="navigation-section">
            <button
              className="header-nav-button prev-button"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              Previous
            </button>
            <button
              className="header-nav-button next-button"
              onClick={handleNext}
              disabled={currentQuestion === displayQuestionsData.questions.length - 1}
            >
              Next
            </button>
            <div className="header-counter">
              <span className="header-counter-text">
                Displaying Question {currentQuestion + 1} of{" "}
                {displayQuestionsData.total}
              </span>
            </div>
          </div>

          {/* Code Details Row: Title, Language, Checkbox */}
          <div className="code-details-row">
            <h3 className="section-title">Code Details</h3>
            <div className="code-details-inputs">
              <div className="language-selector">
                <FormControl fullWidth>
                  <InputLabel
                    sx={{
                      color: "#001A48",
                      fontWeight: 500, // Changed to 500
                      "&.Mui-focused": {
                        color: "#001A48",
                        fontWeight: 700, // Consistent when focused
                      },
                    }}
                  >
                    Choose Language
                  </InputLabel>
                  <Select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
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
                        color: "#001A48", // Added text color to match border
                      },
                      backgroundColor: "white",
                      

                    }}
                  >
                    {languages.map((lang) => (
                      <MenuItem
                        key={lang}
                        value={lang}
                        sx={{
                          color: "#001A48", // Menu items same color
                          "&.Mui-selected": {
                            backgroundColor: "rgba(0, 26, 72, 0.08)", // Light selection color
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
                        color: "#001A48", // Border color
                        "&.Mui-checked": {
                          color: "#001A48", // Fill color when checked
                        },
                      }}
                    />
                  }
                  label="Make it default code"
                  sx={{
                    color: "#001A48", // Text color
                    "& .MuiTypography-root": {
                      fontWeight: 500, // Adjust text weight if needed
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
                  },
                  "& .MuiInputBase-inputMultiline": {
                    height: "100% !important",
                    overflow: "auto !important",
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
                  },
                  "& .MuiInputBase-inputMultiline": {
                    height: "100% !important",
                    overflow: "auto !important",
                  },
                }}
              />
            </div>
            <div className="code-editor-group" style={{ height: "30%" }}>
              <TextField
                value={backendCode}
                onChange={(e) => setBackendCode(e.target.value)}
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
                  },
                  "& .MuiInputBase-inputMultiline": {
                    height: "100% !important",
                    overflow: "auto !important",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentQuestions;

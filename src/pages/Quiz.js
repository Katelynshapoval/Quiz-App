// React & Firebase Imports
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";

// Icon Imports
import { MdKeyboardArrowLeft } from "react-icons/md";
import { FiClock } from "react-icons/fi";
import { FaArrowRight } from "react-icons/fa6";

function Quiz() {
  // URL parameter to identify which quiz to load
  const { quizName } = useParams();
  const navigate = useNavigate(); // For navigation between routes

  // State Variables
  const [questions, setQuestions] = useState([]); // Stores all quiz questions
  const [loading, setLoading] = useState(true); // Loading state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // Tracks current question
  const [selectedOptions, setSelectedOptions] = useState([]); // Stores user selections
  const [showResult, SetShowResult] = useState(false); // Whether to show the result
  const [totalQuestions, setTotalQuestions] = useState(0); // Total questions (for result)
  const [correctAnswers, setCorrectAnswers] = useState(0); // Total correct answers

  // Fetch quiz data from Firestore on component mount
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const quizRef = doc(db, "quizzes", quizName);
        const quizSnap = await getDoc(quizRef);

        if (quizSnap.exists()) {
          const quizData = quizSnap.data();
          setQuestions(quizData.questions);
          setSelectedOptions(new Array(quizData.questions.length).fill(""));
        } else {
          console.error("Quiz not found!");
        }
      } catch (error) {
        console.error("Error fetching quiz:", error);
      } finally {
        setLoading(false); // Stop loading
      }
    };

    fetchQuiz();
  }, [quizName]);

  // Handle answer selection
  const handleOptionChange = (event) => {
    const newSelectedOptions = [...selectedOptions];
    newSelectedOptions[currentQuestionIndex] = event.target.value;
    setSelectedOptions(newSelectedOptions);

    // Auto-advance after 1s (except on last question)
    if (currentQuestionIndex !== questions.length - 1) {
      setTimeout(() => {
        handleNextQuestion();
      }, 1000);
    }
  };

  // Advance to next question or finish quiz
  const handleNextQuestion = () => {
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    if (isLastQuestion) {
      SetShowResult(true);
      setTotalQuestions(questions.length);

      // Count correct answers
      const correctCount = selectedOptions.filter(
        (selected, index) => selected === questions[index].answer
      ).length;

      setCorrectAnswers(correctCount);
    } else {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
    }
  };

  // Navigate to previous question or return to home
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prevIndex) => prevIndex - 1);
    } else {
      navigate("/");
    }
  };

  // Calculate quiz progress percentage
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // === Render ===

  if (loading) {
    return <p className="message">Loading quiz...</p>;
  }

  if (questions.length === 0) {
    return <p className="message">No questions found for this quiz.</p>;
  }

  return (
    <div className="Quiz">
      {!showResult ? (
        // === Quiz Interface ===
        <div className="questionContainer">
          {/* Header Section */}
          <div className="heading">
            <div className="top">
              <div id="left">
                <button
                  onClick={handlePreviousQuestion}
                  id="prevQuestionButton"
                >
                  <MdKeyboardArrowLeft />
                </button>
                <h1>
                  {quizName.charAt(0).toUpperCase() +
                    quizName.slice(1).toLowerCase()}
                </h1>
              </div>
              <div className="time">
                <FiClock />
                <p>10:00</p> {/* Static time display */}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Question Content */}
          <div className="question">
            <p>
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
            <h2>{questions[currentQuestionIndex].question}</h2>

            {/* Options */}
            <div className="options">
              {questions[currentQuestionIndex].options.map((option, index) => (
                <label
                  key={index}
                  className={`option ${
                    selectedOptions[currentQuestionIndex] === option
                      ? "checked"
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="answer"
                    value={option}
                    checked={selectedOptions[currentQuestionIndex] === option}
                    onChange={handleOptionChange}
                  />
                  {option}
                  <div
                    className={`checkmark ${
                      selectedOptions[currentQuestionIndex] === option
                        ? "checked-animate"
                        : ""
                    }`}
                  >
                    <span className="check-icon">&#10003;</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Navigation Button */}
          <button onClick={handleNextQuestion} id="nextQuestionButton">
            {currentQuestionIndex === questions.length - 1 ? (
              "Finish"
            ) : (
              <>
                Next <FaArrowRight />
              </>
            )}
          </button>
        </div>
      ) : (
        // === Results View ===
        <div className="results">
          <div className="resultsHeader">
            <h2>Results</h2>
            <p>Here are your answers along with the correct ones.</p>
          </div>

          {/* List of Questions with Answers */}
          <div className="questionsAnswers">
            {questions.map((question, questionIndex) => {
              const selectedOption = selectedOptions[questionIndex];
              const correctAnswer = question.answer;

              return (
                <div key={questionIndex} className="questionAnswer">
                  <p>
                    <strong>Question {questionIndex + 1}:</strong>{" "}
                    {question.question}
                  </p>

                  {/* Option Status (Correct / Incorrect) */}
                  <div className="optionsAnswer">
                    {question.options.map((option, optionIndex) => {
                      let optionClass = "";
                      if (option === correctAnswer) optionClass = "correct";
                      if (option === selectedOption && option !== correctAnswer)
                        optionClass = "wrong";

                      return (
                        <div
                          key={optionIndex}
                          className={`optionAnswer ${optionClass}`}
                        >
                          {option}
                        </div>
                      );
                    })}
                  </div>
                  <p>{question.explanation}</p>
                </div>
              );
            })}
          </div>

          {/* Final Score */}
          <div className="totalMarks">
            <h3>
              Total Marks: {correctAnswers}/{totalQuestions}
            </h3>
          </div>

          {/* Back to Home */}
          <button id="goToMainButton" onClick={() => navigate("/")}>
            Go to main
          </button>
        </div>
      )}
    </div>
  );
}

export default Quiz;

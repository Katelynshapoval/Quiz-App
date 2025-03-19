import { useState, useEffect } from "react";
import { MdKeyboardArrowLeft } from "react-icons/md";
import { FiClock } from "react-icons/fi";
import { FaArrowRight } from "react-icons/fa6";
import { db } from "../firebase/firebase";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { useParams } from "react-router-dom"; // Import useParams to read URL parameters
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";

function Quiz() {
  const { quizName } = useParams();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true); // Add loading state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [showResult, SetShowResult] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  const navigate = useNavigate(); // Initialize navigation

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const quizRef = doc(db, "quizzes", quizName);
        const quizSnap = await getDoc(quizRef);
        if (quizSnap.exists()) {
          setQuestions(quizSnap.data().questions);
          setSelectedOptions(
            new Array(quizSnap.data().questions.length).fill("")
          );
        } else {
          console.error("Quiz not found!");
        }
      } catch (error) {
        console.error("Error fetching quiz:", error);
      } finally {
        setLoading(false); // Stop loading after fetching quiz
      }
    };

    fetchQuiz();
  }, [quizName]);

  const handleOptionChange = (event) => {
    console.log(selectedOptions);
    const newSelectedOptions = [...selectedOptions];
    newSelectedOptions[currentQuestionIndex] = event.target.value;
    setSelectedOptions(newSelectedOptions);

    if (currentQuestionIndex !== questions.length - 1) {
      setTimeout(() => {
        handleNextQuestion();
      }, 1000);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex === questions.length - 1) {
      SetShowResult(true);
      // Update the totalQuestions state
      setTotalQuestions(questions.length);

      // Update the correctAnswers state
      setCorrectAnswers(
        selectedOptions.filter(
          (selected, index) => selected === questions[index].answer
        ).length
      );
      return;
    } else if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      alert("Quiz finished! Your answers: " + JSON.stringify(selectedOptions));
    }
  };
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      navigate("/");
    }
  };
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (loading) {
    return <p className="message">Loading quiz...</p>;
  }

  if (questions.length === 0) {
    return <p className="message">No questions found for this quiz.</p>;
  }

  return (
    <div className="Quiz">
      {!showResult ? (
        <div className="questionContainer">
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
                <p>10:00</p>
              </div>
            </div>
            {/* PROGRESS BAR */}
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="question">
            <p>
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
            <h2>{questions[currentQuestionIndex].question}</h2>
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
                    <span className="check-icon">&#10003;</span>{" "}
                    {/* Unicode checkmark */}
                  </div>
                </label>
              ))}
            </div>
          </div>
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
        <div className="results">
          <div className="resultsHeader">
            <h2>Results</h2>
            <p>Here are your answers along with the correct ones.</p>
          </div>

          <div className="questionsAnswers">
            {questions.map((question, questionIndex) => {
              const selectedOption = selectedOptions[questionIndex]; // User's chosen answer
              const correctAnswer = question.answer; // Correct answer from questions list

              return (
                <div key={questionIndex} className="questionAnswer">
                  <p>
                    <strong>Question {questionIndex + 1}:</strong>{" "}
                    {question.question}
                  </p>

                  <div className="optionsAnswer">
                    {question.options.map((option, optionIndex) => {
                      // Determine the border color:
                      let optionClass = "";
                      if (option === correctAnswer) {
                        optionClass = "correct"; // ✅ Green border for correct answer
                      }
                      if (
                        option === selectedOption &&
                        option !== correctAnswer
                      ) {
                        optionClass = "wrong"; // ❌ Red border for wrong selected answer
                      }

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
          <div className="totalMarks">
            <h3>
              Total Marks: {correctAnswers}/{totalQuestions}
            </h3>
          </div>
          <button id="goToMainButton" onClick={() => navigate("/")}>
            Go to main
          </button>
        </div>
      )}
    </div>
  );
}

export default Quiz;

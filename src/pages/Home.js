import React, { useEffect, useState, useRef } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore"; // Firestore functions
import "../css/Home.css";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { IoMdClose } from "react-icons/io";
import { IoIosCopy } from "react-icons/io";
import { MdDeleteOutline } from "react-icons/md";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function Home() {
  const [quizzes, setQuizzes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false); // New state to track if text is copied
  const [inputData, setInputData] = useState(""); // For holding raw JSON input
  const [quizName, setQuizName] = useState("");
  const [error, setError] = useState(null); // For handling JSON parse errors
  const modalRef = useRef(null); // Ref to the modal element
  const navigate = useNavigate();

  const copyToClipboard = () => {
    const textToCopy =
      "I’m preparing for my exam and need your help. I’ll provide you with my notes, and you need to generate multiple-choice questions based only on the information in my notes. The questions should be tricky and well-thought-out. The questions must be in LANGUAGE, and there should be NUMBER of them. The questions should be formatted in JSON as a list of dictionaries with the following structure: json Copy Edit [ { 'question': 'Question text here', 'options': ['Option 1', 'Option 2', 'Option 3', 'Option 4'], 'answer': 'Correct answer here', 'explanation': 'Brief explanation of why this answer is correct and others are not' }, ... ] Format Breakdown: question: The question text (it must be based on the provided notes). options: A list of 4 options in random order. answer: The correct answer as a string. explanation: A short, simple, and clear explanation of why the answer is correct and why the others are not. The questions should be challenging and only use the information from my notes. Here are my notes: [NOTES]";
    navigator.clipboard.writeText(textToCopy).then(
      () => {
        setCopied(true); // Change button text to "Copied!" after successful copy
        setTimeout(() => setCopied(false), 2000); // Reset to original text after 2 seconds
      },
      (err) => {
        console.error("Error copying text: ", err);
      }
    );
  };

  const toggleModal = () => {
    setShowModal(!showModal);
  };

  // Function to navigate to quiz page when a quiz is clicked
  const handleQuizClick = (quizId) => {
    navigate(`/${quizId}`); // Redirect to quiz page
  };

  // Close modal when clicking outside the modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowModal(false); // Close the modal if clicked outside
      }
    };

    if (showModal) {
      // Add the event listener to document
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      // Clean up the event listener when modal is closed
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      // Clean up the event listener when the component unmounts
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showModal]);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "quizzes"));
        const quizzesList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setQuizzes(quizzesList);
      } catch (error) {
        console.error("Error fetching quizzes: ", error);
      }
    };

    fetchQuizzes();
  }, []);

  // Handle input data and attempt to parse it as JSON
  const handleInputChange = (e) => {
    setInputData(e.target.value);
    setError(null); // Reset error when the user starts typing
  };

  const handleQuizNameChange = (e) => {
    setQuizName(e.target.value);
  };

  const handleAddQuestions = async (e) => {
    e.preventDefault(); // Prevent form submission from reloading the page

    try {
      // Check if the quiz name already exists
      const existingQuiz = quizzes.find(
        (quiz) => quiz.id === quizName.trim().toLowerCase().replace(/\s+/g, "-")
      );

      if (existingQuiz) {
        setError(
          "A quiz with this name already exists. Please choose a different name."
        );
        return; // Exit the function to prevent further execution
      }
      // Parse the user input (assumed to be JSON format)
      const parsedData = JSON.parse(inputData);

      // Ensure the parsed data is an array of questions
      if (Array.isArray(parsedData)) {
        // Use the quiz name as the ID for the quiz
        const quizId = quizName.trim().toLowerCase().replace(/\s+/g, "-");

        // Check if a quiz with the same name exists
        const existingQuiz = quizzes.find((quiz) => quiz.id === quizId);

        if (existingQuiz) {
          // If the quiz already exists, update it
          const quizRef = doc(db, "quizzes", quizId);
          const updatedQuestions = [...existingQuiz.questions, ...parsedData];

          await updateDoc(quizRef, {
            questions: updatedQuestions,
          });
        } else {
          // If the quiz does not exist, create a new one
          const newQuizData = {
            questions: parsedData,
          };

          // Set the new quiz with the quiz name as ID
          await setDoc(doc(db, "quizzes", quizId), newQuizData);
        }

        // Refresh the quizzes list after updating or adding
        const querySnapshot = await getDocs(collection(db, "quizzes"));
        const quizzesList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setQuizzes(quizzesList);

        // Reset the input fields after successful submission
        setInputData("");
        setQuizName("");
        setShowModal(false); // Close the modal
      } else {
        setError("The input data must be a valid array of questions.");
      }
    } catch (err) {
      setError(
        "There was an error processing the input. Please check the format."
      );
      console.error(err);
    }
  };
  const handleDeleteQuiz = async (quizId) => {
    try {
      await deleteDoc(doc(db, "quizzes", quizId)); // Delete from Firestore
      setQuizzes(quizzes.filter((quiz) => quiz.id !== quizId)); // Remove from state
    } catch (error) {
      console.error("Error deleting quiz:", error);
    }
  };

  return (
    <div className="Home">
      <div className="container">
        <div className="intro">
          <h1>Hello!</h1>
          <p>Welcome to the quiz app! Click a quiz below to start.</p>
        </div>

        <ul className="quizzes">
          {quizzes.map((quiz) => (
            <li key={quiz.id} onClick={() => handleQuizClick(quiz.id)}>
              <div>
                <h3>{quiz.id}</h3> {/* Assuming each quiz document is named */}
                <p>{quiz.questions?.length || 0} Questions</p>
              </div>
              {/* Delete */}
              <button
                className="deleteButton"
                onClick={(event) => {
                  event.stopPropagation();
                  handleDeleteQuiz(quiz.id);
                }}
              >
                <MdDeleteOutline />
              </button>
            </li>
          ))}
        </ul>

        {/* Create quiz button */}
        <button id="createQuizButton" onClick={toggleModal}>
          Create a quiz
        </button>
      </div>

      {/* Modal for creating a quiz */}
      {showModal && (
        <div className="createQuizModal" ref={modalRef}>
          <div className="modalHeader">
            <h2>Create a quiz</h2>
            <button onClick={toggleModal}>
              <IoMdClose />
            </button>
          </div>
          <p>
            Hey! So, to create a quiz you have to paste your notes into ChatGPT
            with this prompt that you can copy right below.
          </p>
          <button onClick={copyToClipboard} id="copyPromptButton">
            {copied ? "Copied!" : "Copy prompt"} <IoIosCopy />
          </button>
          <form>
            <label htmlFor="quizName">Quiz Name</label>
            <input
              type="text"
              value={quizName}
              onChange={handleQuizNameChange}
              placeholder="Enter quiz name"
            />
            <label htmlFor="question">Question</label>
            <textarea
              value={inputData}
              onChange={handleInputChange}
              placeholder="Paste your questions here in JSON format..."
            />
            {error && <p style={{ color: "red" }}>{error}</p>}
            <button
              id="addQuestionButton"
              type="submit"
              onClick={handleAddQuestions}
              disabled={!quizName || !inputData}
            >
              Add Question
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Home;

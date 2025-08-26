import React, { useState } from "react";
import "./Dashboard.css";
import BackspaceIcon from "@mui/icons-material/Backspace";
import { evaluate } from "mathjs"; // Import evaluate and type

function Calculator() {
    const [input, setInput] = useState("0");
    const [result, setResult] = useState("");

    const handleButtonClick = (value: string) => {
        if (value === "C") {
            // Reset to default state
            setInput("0");
            setResult("");
        } else if (value === "=") {
            try {
                // Safely evaluate the expression using math.js
                // It correctly handles order of operations (e.g., 2 + 3 * 4)
                const calculatedResult = evaluate(input);

                // Handle NaN and other non-finite results from invalid expressions
                if (Number.isNaN(calculatedResult) || !Number.isFinite(calculatedResult)) {
                    setResult("Error");
                    setInput("0");
                } else {
                    // Convert result to a string for display
                    const finalResult = String(calculatedResult);
                    setResult(finalResult);
                    setInput(finalResult);
                }
            } catch (error) {
                // Catch any syntax errors
                setResult("Error");
                setInput("0");
                console.error("Error during calculation:", error);
            }
        } else if (value === "⌫") {
            // Handle backspace
            setInput((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"));
        } else {
            // Handle number and operator input
            if (input === "0" && value !== ".") {
                setInput(value);
            } else {
                setInput((prev) => prev + value);
            }
        }
    };

    return (
        <div className="calculator-container">
            <h1 style={{ color: '#3f51b5' }}>Calculator</h1>
            <div className="calculator-app">
                <div className="calculator-display">
                    <div className="result">{result}</div>
                    <div className="input">{input}</div>
                </div>
                <div className="calculator-buttons">
                    <button onClick={() => handleButtonClick("C")} className="button-op-clear">C</button>
                    <button onClick={() => handleButtonClick("⌫")} className="button-op">
                        <BackspaceIcon />
                    </button>
                    <button onClick={() => handleButtonClick("%")} className="button-op">%</button>
                    <button onClick={() => handleButtonClick("/")} className="button-op">/</button>
                    <button onClick={() => handleButtonClick("7")}>7</button>
                    <button onClick={() => handleButtonClick("8")}>8</button>
                    <button onClick={() => handleButtonClick("9")}>9</button>
                    <button onClick={() => handleButtonClick("*")} className="button-op">*</button>
                    <button onClick={() => handleButtonClick("4")}>4</button>
                    <button onClick={() => handleButtonClick("5")}>5</button>
                    <button onClick={() => handleButtonClick("6")}>6</button>
                    <button onClick={() => handleButtonClick("-")} className="button-op">-</button>
                    <button onClick={() => handleButtonClick("1")}>1</button>
                    <button onClick={() => handleButtonClick("2")}>2</button>
                    <button onClick={() => handleButtonClick("3")}>3</button>
                    <button onClick={() => handleButtonClick("+")} className="button-op">+</button>
                    <button onClick={() => handleButtonClick("0")}>0</button>
                    <button onClick={() => handleButtonClick(".")}>.</button>
                    <button onClick={() => handleButtonClick("=")} className="button-equals">=</button>
                </div>
            </div>
        </div>
    );
}

export default Calculator;
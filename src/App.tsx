import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Calculator from "./pages/Calculator"; // import your Calculator page
import PrivateRoute from "./components/PrivateRoute";
import MainLayout from "./pages/MainLayout";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route
                path="/"
                element={
                    <PrivateRoute>
                        <MainLayout />
                    </PrivateRoute>
                }
            >
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="calculator" element={<Calculator />} />
            </Route>
        </Routes>
    );
}

export default App;

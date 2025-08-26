import React, { useState } from "react";
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    InputAdornment,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LockIcon from "@mui/icons-material/Lock";
import "./Login.css";

const Login: React.FC = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [usernameError, setUsernameError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async () => {
        setUsernameError("");
        setPasswordError("");

        if (username.trim() === "") {
            setUsernameError("Username is required.");
            return;
        }

        if (password.trim() === "") {
            setPasswordError("Password is required.");
            return;
        }

        try {
            const response = await fetch("http://10.55.2.48:8081/Login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userName: username,
                    userPassword: password,
                }),
            });

            const result = await response.json();

            if (result === -1) {
                setUsernameError("Username is incorrect.");
            } else if (result === -2) {
                setPasswordError("Password is incorrect.");
            } else if (result === -3) {
                setError("Database error. Please try again.");
            } else {
                sessionStorage.setItem("auth", "true");
                navigate("/dashboard");
            }
        } catch (error) {
            console.error("Login failed:", error);
            setError("Unable to connect to server.");
        }
    };

    return (
        <Box className="login-background">
            <Paper elevation={4} className="login-card">
                <Box className="login-image" />
                <Box className="login-form">
                    <Typography variant="h5" className="login-title">
                        Welcome!
                    </Typography>
                    <Typography variant="body2" className="login-subtitle">
                        Login to your account
                    </Typography>

                    <TextField
                        label="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        error={Boolean(usernameError)}
                        helperText={usernameError}
                        variant="outlined"
                        size="medium"
                        fullWidth
                        margin="normal"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <AccountCircleIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <TextField
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        error={Boolean(passwordError)}
                        helperText={passwordError}
                        variant="outlined"
                        size="medium"
                        fullWidth
                        margin="normal"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    {error && (
                        <Typography color="error" sx={{ mt: 1 }}>
                            {error}
                        </Typography>
                    )}

                    <Button
                        variant="contained"
                        onClick={handleLogin}
                        className="login-button"
                        fullWidth
                        sx={{ mt: 2 }}
                    >
                        Log In
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default Login;
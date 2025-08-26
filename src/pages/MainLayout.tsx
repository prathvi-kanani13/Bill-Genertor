// src/components/MainLayout.tsx
import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
    Drawer,
    Box,
    Avatar,
    Typography,
    Divider,
    List,
    ListItemButton,
    ListItemText,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CalculateIcon from "@mui/icons-material/Calculate";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

const drawerWidth = 240;

const MainLayout = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        sessionStorage.removeItem("auth");
        navigate("/");
    };

    return (
        <Box sx={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: {
                        width: drawerWidth,
                        boxSizing: "border-box",
                        backgroundColor: "#3f51b5",
                        color: "#fff",
                        padding: "20px 0",
                    },
                }}
            >
                <Box className="drawer-profile">
                    <Avatar className="drawer-avatar">
                        <AccountCircleIcon />
                    </Avatar>
                    <Typography variant="subtitle1" className="drawer-username">
                        Bankai Infotech
                    </Typography>
                    <Typography variant="caption" className="drawer-email">
                        Bankaiinformatics@gmail.com
                    </Typography>
                </Box>

                <Divider className="drawer-divider" />

                <List>
                    <ListItemButton className="drawer-item" onClick={() => navigate('/dashboard')}>
                        <DashboardIcon className="drawer-icon" />
                        <ListItemText primary="Dashboard" />
                    </ListItemButton>
                    <ListItemButton className="drawer-item" onClick={() => navigate('/calculator')}>
                        <CalculateIcon className="drawer-icon" />
                        <ListItemText primary="Calculator" />
                    </ListItemButton>
                </List>

                <Box sx={{ flexGrow: 1 }} />

                <List>
                    <ListItemButton className="drawer-item" onClick={handleLogout}>
                        <LogoutIcon className="drawer-icon" />
                        <ListItemText primary="Logout" />
                    </ListItemButton>
                </List>
            </Drawer>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    backgroundColor: "#f5f7ff",
                    overflowY: "auto",
                    height: "100vh"
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
};

export default MainLayout;

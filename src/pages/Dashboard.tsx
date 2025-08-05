import React, { useState, useEffect } from "react";
import {
    Typography,
    Drawer,
    List,
    ListItemButton,
    ListItemText,
    Button,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Avatar,
    Divider,
    CircularProgress
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CalculateIcon from '@mui/icons-material/Calculate';
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import Swal from 'sweetalert2';
import { Bill } from "../types/bill";
import EditBillDialog from "../components/EditBillDialog";
import ViewDocumentDialog from "../components/ViewDocumentdialog";
import "./Dashboard.css";
import { getMimePrefix } from "../utils/getMimePrefix";

const drawerWidth = 240;

// interface InvoiceRaw {
//     invoiceFileName?: string;
//     invoiceFile?: string;
//     invoiceType?: "S" | "V";
// }

const Dashboard: React.FC = () => {
    const [bills, setBills] = useState<Bill[]>([]);

    //managing the Add/Edit Bill modal
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
    const [dialogMode, setDialogMode] = useState<"add" | "edit">("edit");
    const [fromDate, setFromDate] = useState<Dayjs | null>(null);
    const [toDate, setToDate] = useState<Dayjs | null>(null);
    const [viewDocumentOpen, setViewDocumentOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    //DocumentFiles stores the array of uploaded files for the selected bill
    const [viewDocumentFiles, setViewDocumentFiles] = useState<{ name: string; url: string; type: "sales" | "voucher" }[]>([]);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchBills = async () => {
            setLoading(true);
            try {
                const response = await fetch("http://10.55.2.48:8081/Bills");
                const rawData = await response.json();

                const processedBills = rawData.map((bill: any, index: number) => {
                    const invoices = Array.isArray(bill.invoice)
                        ? bill.invoice.map((inv: any, i: number) => ({
                            name: inv.invoiceFileName || `Invoice-${bill.billNo || index + 1}-${i + 1}.pdf`,
                            url: inv.invoiceFile.startsWith("data:")
                                ? inv.invoiceFile
                                : `${getMimePrefix(inv.invoiceFile)}${inv.invoiceFile}`,
                            type: inv.invoiceType === "S" ? "sales" : "voucher",
                            invoiceId: inv.invoiceId,
                        }))
                        : [];

                    return {
                        ...bill,
                        id: index + 1,
                        date: bill.billDate || bill.date || "",
                        invoices,
                    };
                });

                setBills(processedBills);
            } catch (error) {
                console.error("Error fetching bills:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBills();
    }, []);

    // logout
    const handleLogout = () => {
        sessionStorage.removeItem("auth");
        navigate("/");
    };

    // Opens EditBillDialog pre-filling the selected bill for editing
    const handleEdit = (bill: Bill) => {
        setSelectedBill(bill);
        setDialogMode("edit");
        setOpenEditDialog(true);
    };

    // Save Edited Bill
    const handleSaveEditedBill = async (updatedBill: Bill) => {
        try {
            const invoiceArray = (updatedBill.invoices || []).map((inv) => {
                const base64Data = inv.url.includes(",") ? inv.url.split(",")[1] : inv.url;

                return {
                    bill: {
                        billNo: updatedBill.billNo?.trim() || "", // ensure string
                    },
                    invoiceType: inv.type === "sales" ? "S" : "V",
                    invoiceFileName: inv.name?.trim() || "",
                    invoiceFileType: `.${inv.name?.split(".").pop() || ""}`,
                    invoiceFile: base64Data, // base64 only
                };
            });

            const payload = {
                billNo: updatedBill.billNo?.trim(),
                billDate: updatedBill.date?.trim(),
                partyName: updatedBill.partyName?.trim(),
                invoice: invoiceArray,
                tax: updatedBill.tax?.toString().trim(),
                amount: updatedBill.amount?.toString().trim(),
            };

            //  Log for debugging
            console.log("Sending payload:", payload);

            //  Check for required fields before sending
            if (!payload.billNo || !payload.billDate || !payload.partyName || !payload.amount || !payload.tax) {
                console.error("Missing required fields in payload", payload);
                return;
            }

            const response = await fetch("http://10.55.2.48:8081/addBill", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Server returned error:", errorText);
                return;
            }

            // Update frontend
            setBills((prevBills) => {
                const updatedInvoices = (updatedBill.invoices || []).map((inv, index) => ({
                    name: inv.name,
                    url: inv.url.startsWith("data:") ? inv.url : `${getMimePrefix(inv.url)}${inv.url}`,
                    type: inv.type === "sales" || inv.type === "voucher" ? inv.type : "sales",
                    invoiceId: inv.invoiceId || index + 1,
                }));

                const newBill = {
                    ...updatedBill,
                    invoices: updatedInvoices,
                };

                return prevBills.some((b) => b.id === updatedBill.id)
                    ? prevBills.map((b) => (b.id === updatedBill.id ? newBill : b))
                    : [...prevBills, { ...newBill, id: prevBills.length + 1 }];
            });

        } catch (error) {
            console.error("Failed to save bill:", error);
        }
    };

    // view uploaded document
    const handleViewDocument = (bill: Bill) => {
        if (bill.invoices && bill.invoices.length > 0) {
            setViewDocumentFiles(
                bill.invoices.map((inv) => ({
                    name: inv.name,
                    url: inv.url.startsWith("data:")
                        ? inv.url
                        : `${getMimePrefix(inv.url)}${inv.url}`,
                    type: inv.type === "sales" || inv.type === "voucher" ? inv.type : "sales", // Fallback to 'sales'
                }))
            );
            setViewDocumentOpen(true);
        } else {
            Swal.fire({
                icon: 'warning',
                text: 'No document uploaded for this bill.',
                confirmButtonColor: '#3f51b5',
                confirmButtonText: 'OK'
            });
        }
    };

    // Delete a bill by id
    const handleDeleteBill = (id: number) => {
        const billToDelete = bills.find(bill => bill.id === id);
        if (!billToDelete) return;

        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to delete this bill?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    // Only include invoiceId in the delete payload (based on your API)
                    const invoiceArray = (billToDelete.invoices || []).map(inv => ({
                        invoiceId: inv.invoiceId,
                        invoiceType: inv.type === "sales" ? "S" : "V",
                        invoiceFileName: inv.name,
                        invoiceFileType: `.${inv.name.split(".").pop() || ""}`,
                        invoiceFile: inv.url.split(",")[1], // base64 body only
                        bill: {
                            billNo: billToDelete.billNo
                        }
                    }));

                    const payload = {
                        billNo: billToDelete.billNo,
                        billDate: billToDelete.date,
                        partyName: billToDelete.partyName,
                        invoice: invoiceArray,
                        tax: billToDelete.tax,
                        amount: billToDelete.amount
                    };

                    const res = await fetch("http://10.55.2.48:8081/deleteBill", {
                        method: "DELETE",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(payload)
                    });

                    if (!res.ok) {
                        throw new Error(`Server responded with ${res.status}`);
                    }

                    setBills(prev => prev.filter(bill => bill.id !== id));
                    Swal.fire("Deleted!", "The bill has been deleted.", "success");
                } catch (error) {
                    console.error("Failed to delete bill:", error);
                    Swal.fire("Error", "Failed to delete bill. Please try again.", "error");
                }
            }
        });
    };

    // filter date 
    const filteredBills = bills.filter((bill) => { // .filter on your bills array to test each bill
        const formattedDate = dayjs(bill.date, ["DD-MM-YYYY", "MM/DD/YYYY", "YYYY-MM-DD"], true); // Converts bill.date (string) to a dayjs object so you can compare dates easily
        const afterFrom = fromDate ? formattedDate.isSame(fromDate, "day") || formattedDate.isAfter(fromDate, "day") : true;//select same day ya after
        const beforeTo = toDate ? formattedDate.isSame(toDate, "day") || formattedDate.isBefore(toDate, "day") : true; // select same day ya before
        return afterFrom && beforeTo;
    });

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box className="dashboard-root">
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
                    open
                >
                    <Box className="drawer-profile">
                        <Avatar className="drawer-avatar">
                            <AccountCircleIcon />
                        </Avatar>
                        <Typography variant="subtitle1" className="drawer-username">
                            John Doe
                        </Typography>
                        <Typography variant="caption" className="drawer-email">
                            john@example.com
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

                <Box component="main" className="dashboard-main">
                    <Box className="dashboard-header">
                        <Typography variant="h5" className="text">
                            Bill Generate
                        </Typography>
                        <Button
                            variant="contained"
                            className="button"
                            onClick={() => {
                                setSelectedBill({
                                    id: bills.length + 1,
                                    billNo: "",
                                    partyName: "",
                                    date: new Date().toISOString().slice(0, 10),
                                    invoice: "",
                                    tax: "",
                                    amount: ""
                                });
                                setDialogMode("add");
                                setOpenEditDialog(true);
                            }}
                        >
                            Add
                        </Button>
                    </Box>

                    {/* date filter */}
                    <Box
                        sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 2,
                            alignItems: "center",
                            mt: 2,
                            mb: 2,
                        }}>
                        <DatePicker
                            label="From Date"
                            value={fromDate}
                            onChange={(newValue) => setFromDate(newValue)}
                            format="YYYY-MM-DD"
                            slotProps={{
                                textField: {
                                    sx: { width: { xs: "100%", sm: "200px" } }
                                }
                            }}
                        />
                        <DatePicker
                            label="To Date"
                            value={toDate}
                            onChange={(newValue) => setToDate(newValue)}
                            format="YYYY-MM-DD"
                            slotProps={{
                                textField: {
                                    sx: { width: { xs: "100%", sm: "200px" } }
                                }
                            }}
                        />
                        <Button
                            variant="contained"
                            className="button"
                            onClick={() => {
                                setFromDate(null);
                                setToDate(null);
                            }}
                        >
                            Clear
                        </Button>
                    </Box>

                    {/* table */}
                    <TableContainer component={Paper} className="bills-table-container">
                        <Table className="bills-table">
                            <TableHead>
                                <TableRow>
                                    <TableCell align="center">Sr No</TableCell>
                                    <TableCell align="center">Bill No</TableCell>
                                    <TableCell align="center">Party Name</TableCell>
                                    <TableCell align="center">Date</TableCell>
                                    <TableCell align="center">View Document</TableCell>
                                    <TableCell align="center">Edit</TableCell>
                                    <TableCell align="center">Delete</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center">
                                            <Box sx={{ py: 4 }}>
                                                <CircularProgress sx={{ color: "#3f51b5" }} />
                                                <Typography variant="body2" sx={{ mt: 1, fontSize: "16px" }}>
                                                    Loading bills...
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredBills.length > 0 ? (
                                    filteredBills.map((bill, index) => (
                                        <TableRow key={bill.id}>
                                            <TableCell align="center">{index + 1}</TableCell>
                                            <TableCell align="center">{bill.billNo}</TableCell>
                                            <TableCell align="center">{bill.partyName}</TableCell>
                                            <TableCell align="center">{bill.date}</TableCell>
                                            <TableCell align="center">
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={<VisibilityIcon />}
                                                    onClick={() => handleViewDocument(bill)}
                                                >
                                                    View
                                                </Button>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={<EditIcon />}
                                                    onClick={() => handleEdit(bill)}
                                                >
                                                    Edit
                                                </Button>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDeleteBill(bill.id)}
                                                >
                                                    Delete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center">
                                            <Box sx={{ py: 10, color: "text.secondary", fontSize: "24px" }}>
                                                No bills found.
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>

                        </Table>
                    </TableContainer>

                    <EditBillDialog
                        open={openEditDialog}
                        onClose={() => setOpenEditDialog(false)}
                        bill={selectedBill}
                        onSave={handleSaveEditedBill}
                        mode={dialogMode}
                    />

                    <ViewDocumentDialog
                        open={viewDocumentOpen}
                        onClose={() => setViewDocumentOpen(false)}
                        documentFiles={viewDocumentFiles}
                    />

                </Box>
            </Box>
        </LocalizationProvider>
    );
};

export default Dashboard;
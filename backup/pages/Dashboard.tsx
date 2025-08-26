import React, { useState, useEffect } from "react";
import {
    Typography,
    Button,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    TextField,
    InputAdornment,
} from "@mui/material";
import Swal from 'sweetalert2';
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CancelIcon from '@mui/icons-material/Cancel';
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { Bill } from "../types/bill";
import { getMimePrefix } from "../utils/getMimePrefix";
// import AddBillDialog from "../components/AddBillDialog";
// import ViewDocumentDialog from "../components/ViewDocumentdialog";
import UploadDialog from '../components/UploadDialog';
import "./Dashboard.css";

const Dashboard: React.FC = () => {
    const [bills, setBills] = useState<Bill[]>([]);
    // const [openAddDialog, setOpenAddDialog] = useState(false);
    const [fromDate, setFromDate] = useState<Dayjs | null>(null);
    const [toDate, setToDate] = useState<Dayjs | null>(null);
    // const [viewDocumentOpen, setViewDocumentOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    // const [viewDocumentFiles, setViewDocumentFiles] = useState<{ name: string; url: string; type: "sales" | "voucher" }[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingBillId, setEditingBillId] = useState<number | null>(null);
    const [editedBillData, setEditedBillData] = useState<Partial<Bill>>({});
    const [openUpload, setOpenUpload] = useState(false);
    const [billFiles, setBillFiles] = useState<Record<string, { fileName: string; file: File }[]>>({});
    const [currentUploadBillId, setCurrentUploadBillId] = useState<number | null>(null);
    const [isAddingNew, setIsAddingNew] = useState(false);


    useEffect(() => {
        const fetchBills = async () => {
            setLoading(true);
            try {
                const response = await fetch("http://10.55.2.48:8081/Bills");
                const rawData = await response.json();

                const processedBills = rawData.map((bill: any, index: number) => {
                    const invoices = Array.isArray(bill.invoice)
                        ? bill.invoice.map((inv: any, i: number) => ({
                            name: inv.invoiceFileName || inv.invoiceName || `Invoice-${bill.billNo || index + 1}-${i + 1}`,
                            url: inv.invoiceFile.startsWith("data:")
                                ? inv.invoiceFile
                                : `data:${inv.invoiceFileType === ".pdf" ? "application/pdf" : inv.invoiceFileType === ".png" ? "image/png" : "image/jpeg"};base64,${inv.invoiceFile}`,
                            invoiceId: inv.invoiceId || i + 1
                        }))
                        : [];

                    return {
                        ...bill,
                        id: bill.billId || index + 1, // use backend id if available
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


    // Opens AddBillDialog for creating a new bill
    // const handleAddBill = () => {
    //     setOpenAddDialog(true);
    // };

    const handleFilesUploaded = (files: { fileName: string; file: File }[]) => {
        if (currentUploadBillId !== null) {
            setBillFiles(prev => ({
                ...prev,
                [currentUploadBillId]: files, // store only for this bill
            }));
        }
        setOpenUpload(false);
    };

    // Save New Bill
    const handleSaveNewBill = async (updatedBill: Bill) => {
        try {
            if (!updatedBill.id) {
                console.error("Bill ID is missing");
                return;
            }

            // Convert uploaded files to Base64
            const invoiceArray = await Promise.all(
                (billFiles[updatedBill.id] || []).map((f) => {
                    return new Promise<any>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            const url = reader.result as string;
                            resolve({
                                invoiceFileName: f.fileName.trim(),
                                invoiceName: f.fileName.split(".")[0],
                                invoiceFileType: `.${f.fileName.split(".").pop() || ""}`,
                                invoiceFile: url.split(",")[1], // base64 only
                            });
                        };
                        reader.onerror = (err) => reject(err);
                        reader.readAsDataURL(f.file);
                    });
                })
            );

            const payload = {
                billNo: updatedBill.billNo?.trim(),
                billDate: updatedBill.date?.trim(),
                partyName: updatedBill.partyName?.trim(),
                invoice: invoiceArray,
                tax: updatedBill.tax?.toString().trim(),
                amount: updatedBill.amount?.toString().trim(),
            };

            console.log("Sending payload:", payload);

            if (!payload.billNo || !payload.billDate || !payload.partyName || !payload.amount || !payload.tax) {
                console.error("Missing required fields in payload", payload);
                return;
            }

            const response = await fetch("http://10.55.2.48:8081/addBill", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Server returned error:", errorText);
                return;
            }

            // Update frontend bills with uploaded invoices
            setBills((prevBills) => {
                const updatedInvoices = invoiceArray.map((inv, index) => ({
                    name: inv.invoiceFileName,
                    url: `data:${inv.invoiceFileType === ".pdf" ? "application/pdf" : inv.invoiceFileType === ".png" ? "image/png" : "image/jpeg"};base64,${inv.invoiceFile}`,
                    invoiceId: inv.invoiceId || index + 1
                }));


                const newBill: Bill = {
                    ...updatedBill,
                    invoices: updatedInvoices,
                    id: updatedBill.id,
                    billNo: updatedBill.billNo || "",
                    partyName: updatedBill.partyName || "",
                    date: updatedBill.date || "",
                    tax: updatedBill.tax,
                    amount: updatedBill.amount,
                };

                return prevBills.some((b) => b.id === updatedBill.id)
                    ? prevBills.map((b) => (b.id === updatedBill.id ? newBill : b))
                    : [...prevBills, newBill];
            });
        } catch (error) {
            console.error("Failed to save bill:", error);
        }
    };



    // view uploaded document
    // const handleViewDocument = (bill: Bill) => {
    //     if (bill.invoices && bill.invoices.length > 0) {
    //         setViewDocumentFiles(
    //             bill.invoices.map((inv) => ({
    //                 name: inv.name,
    //                 url: inv.url.startsWith("data:")
    //                     ? inv.url
    //                     : `${getMimePrefix(inv.url)}${inv.url}`,
    //                 type: inv.type === "sales" || inv.type === "voucher" ? inv.type : "sales", // Fallback to 'sales'
    //             }))
    //         );
    //         setViewDocumentOpen(true);
    //     } else {
    //         Swal.fire({
    //             icon: 'warning',
    //             text: 'No document uploaded for this bill.',
    //             confirmButtonColor: '#3f51b5',
    //             confirmButtonText: 'OK'
    //         });
    //     }
    // };

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
                    const invoiceArray = (billToDelete.invoices || []).map(inv => ({
                        invoiceFileName: inv.name,
                        invoiceName: inv.name.split(".")[0],
                        invoiceFileType: `.${inv.name.split(".").pop() || ""}`,
                        invoiceFile: inv.url.split(",")[1], // base64 only
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
                        headers: { "Content-Type": "application/json" },
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

        const afterFrom = fromDate
            ? formattedDate.isSame(fromDate, "day") || formattedDate.isAfter(fromDate, "day")
            : true;  //select same day ya after

        const beforeTo = toDate
            ? formattedDate.isSame(toDate, "day") || formattedDate.isBefore(toDate, "day")
            : true; // select same day ya before

        const matchesDate = afterFrom && beforeTo;

        const matchesSearch =
            bill.billNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bill.partyName.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesDate && matchesSearch;
    });

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box className="dashboard-root">
                <Box component="main" className="dashboard-main">
                    <Box className="dashboard-header">
                        <Typography variant="h5" className="text">
                            Bill Generate
                        </Typography>
                        <Button
                            variant="contained"
                            className="button"
                            onClick={() => {
                                const newId = bills.length + 1;
                                setBills(prev => [...prev, {
                                    id: newId,
                                    billNo: "",
                                    partyName: "",
                                    date: dayjs().format("YYYY-MM-DD"),
                                    amount: "",
                                    tax: "",
                                    invoices: []
                                }]);
                                setEditingBillId(newId);
                                setEditedBillData({
                                    billNo: "",
                                    partyName: "",
                                    date: dayjs().format("YYYY-MM-DD"),
                                    amount: "",
                                    tax: ""
                                });
                                setIsAddingNew(true);
                            }}
                        >
                            Add
                        </Button>
                    </Box>

                    <Box
                        sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mt: 2,
                            mb: 2,
                            gap: 2,
                        }}
                    >
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                            <DatePicker
                                label="From Date"
                                value={fromDate}
                                onChange={(newValue) => setFromDate(newValue)}
                                format="DD-MM-YYYY"
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
                                format="DD-MM-YYYY"
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

                        <TextField
                            label="Search Bills"
                            variant="outlined"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>

                    <TableContainer component={Paper} className="bills-table-container">
                        <Table className="bills-table">
                            <TableHead>
                                <TableRow>
                                    <TableCell align="center">Sr No</TableCell>
                                    <TableCell align="center">Bill No</TableCell>
                                    <TableCell align="center">Party Name</TableCell>
                                    <TableCell align="center">Date</TableCell>
                                    <TableCell align="center">Amount</TableCell>
                                    <TableCell align="center">Tax</TableCell>
                                    <TableCell align="center">Upload</TableCell>
                                    <TableCell align="center">Edit/Save</TableCell>
                                    <TableCell align="center">Delete</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={9}> {/* adjust colSpan to match your table columns */}
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    minHeight: '200px' // ensures enough height for vertical centering
                                                }}
                                            >
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

                                            <TableCell align="center">
                                                {editingBillId === bill.id ? (
                                                    <TextField
                                                        variant="standard"
                                                        value={editedBillData.billNo}
                                                        onChange={(e) =>
                                                            setEditedBillData({ ...editedBillData, billNo: e.target.value })
                                                        }
                                                    />
                                                ) : (
                                                    bill.billNo
                                                )}
                                            </TableCell>

                                            <TableCell align="center">
                                                {editingBillId === bill.id ? (
                                                    <TextField
                                                        variant="standard"
                                                        value={editedBillData.partyName}
                                                        onChange={(e) =>
                                                            setEditedBillData({ ...editedBillData, partyName: e.target.value })
                                                        }
                                                    />
                                                ) : (
                                                    bill.partyName
                                                )}
                                            </TableCell>

                                            <TableCell align="center">
                                                {editingBillId === bill.id ? (
                                                    <TextField
                                                        type="date"
                                                        variant="standard"
                                                        value={dayjs(editedBillData.date).format("YYYY-MM-DD")}
                                                        onChange={(e) =>
                                                            setEditedBillData({ ...editedBillData, date: e.target.value })
                                                        }
                                                    />
                                                ) : dayjs(bill.date).isValid() ? (
                                                    dayjs(bill.date).format("DD-MM-YYYY")
                                                ) : (
                                                    "Invalid Date"
                                                )}
                                            </TableCell>

                                            <TableCell align="center">
                                                {editingBillId === bill.id ? (
                                                    <TextField
                                                        variant="standard"
                                                        type="number"
                                                        value={editedBillData.amount}
                                                        onChange={(e) =>
                                                            setEditedBillData({ ...editedBillData, amount: e.target.value })
                                                        }
                                                    />
                                                ) : (
                                                    bill.amount
                                                )}
                                            </TableCell>

                                            <TableCell align="center">
                                                {editingBillId === bill.id ? (
                                                    <TextField
                                                        variant="standard"
                                                        type="number"
                                                        value={editedBillData.tax}
                                                        onChange={(e) =>
                                                            setEditedBillData({ ...editedBillData, tax: e.target.value })
                                                        }
                                                    />
                                                ) : (
                                                    bill.tax
                                                )}
                                            </TableCell>

                                            <TableCell align="center">
                                                <Button
                                                    variant="outlined"
                                                    onClick={() => {
                                                        setCurrentUploadBillId(bill.id); // <-- track bill id
                                                        setOpenUpload(true);
                                                    }}
                                                    startIcon={<UploadFileIcon />}
                                                    size="small"
                                                >
                                                    Upload
                                                </Button>
                                            </TableCell>

                                            <TableCell align="center">
                                                <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                                                    {editingBillId === bill.id ? (
                                                        <>
                                                            <Button
                                                                onClick={async () => {
                                                                    const updated = {
                                                                        ...bill,
                                                                        ...editedBillData,
                                                                    };
                                                                    await handleSaveNewBill(updated);
                                                                    setEditingBillId(null);
                                                                    setEditedBillData({});
                                                                    setIsAddingNew(false);
                                                                }}
                                                                color="success"
                                                                variant="outlined"
                                                                startIcon={<SaveIcon />}
                                                                size="small"
                                                            >
                                                                Save
                                                            </Button>

                                                            <Button
                                                                onClick={() => {
                                                                    if (isAddingNew) {
                                                                        setBills(prev => prev.filter(b => b.id !== bill.id));
                                                                    }
                                                                    setEditingBillId(null);
                                                                    setEditedBillData({});
                                                                    setIsAddingNew(false);
                                                                }}
                                                                color="warning"
                                                                variant="outlined"
                                                                startIcon={<CancelIcon />}
                                                                size="small"
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                onClick={() => {
                                                                    setEditingBillId(bill.id);
                                                                    setEditedBillData({
                                                                        billNo: bill.billNo,
                                                                        partyName: bill.partyName,
                                                                        date: dayjs(bill.date).format("YYYY-MM-DD"),
                                                                        tax: bill.tax,
                                                                        amount: bill.amount,
                                                                    });
                                                                }}
                                                                color="primary"
                                                                variant="outlined"
                                                                startIcon={<EditIcon />}
                                                                size="small"
                                                            >
                                                                Edit
                                                            </Button>
                                                        </>
                                                    )}
                                                </Box>
                                            </TableCell>

                                            <TableCell align="center">
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<DeleteIcon />}
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDeleteBill(bill.id)}
                                                    disabled={editingBillId === bill.id}
                                                >
                                                    Delete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7}>
                                            <Box
                                                sx={{
                                                    py: 10,
                                                    pl: 50,
                                                    textAlign: "center",
                                                    color: "text.secondary",
                                                    fontSize: "24px"
                                                }}>
                                                No bills found.
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <UploadDialog
                        open={openUpload}
                        onClose={() => setOpenUpload(false)}
                        onSubmit={handleFilesUploaded}
                        value={currentUploadBillId !== null ? billFiles[currentUploadBillId] || [] : []}
                        billId={currentUploadBillId ? currentUploadBillId.toString() : ""} // <--- pass billId here
                    />


                    {/* <ViewDocumentDialog
                        open={viewDocumentOpen}
                        onClose={() => setViewDocumentOpen(false)}
                        documentFiles={viewDocumentFiles}
                    /> */}

                </Box>
            </Box>
        </LocalizationProvider>
    );
};

export default Dashboard;
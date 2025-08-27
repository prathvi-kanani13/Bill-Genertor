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
  TextField,
  InputAdornment,
  CircularProgress,
  TablePagination
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import SearchIcon from "@mui/icons-material/Search";
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SaveIcon from "@mui/icons-material/Save";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CancelIcon from '@mui/icons-material/Cancel';
import UploadDialog from "../components/UploadDialog";
import { getMimePrefix } from "../utils/getMimePrefix";
import "./Dashboard.css";

interface Bill {
  id: number;
  billNo: string;
  partyName: string;
  date: string;
  amount: string | number;
  tax: string | number;
  uploadedFiles?: {
    fileName: string;
    fileType: string;
    url: string;
    invoiceName?: string;
    invoiceId?: number;
    invoiceFileName?: string;
    invoiceFileType?: string;
    invoiceFile?: string;
  }[];
}

const Dashboard: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [editingBillId, setEditingBillId] = useState<number | null>(null);
  const [editedBillData, setEditedBillData] = useState<Partial<Bill>>({});
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [currentBillId, setCurrentBillId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch bills from API
  useEffect(() => {
    const fetchBills = async () => {
      try {
        setLoading(true);
        const res = await fetch("http://10.55.2.48:8081/Bills");
        const data = await res.json();

        const mappedBills: Bill[] = data.map((b: any, index: number) => ({
          id: index + 1,
          billNo: b.billNo,
          partyName: b.partyName,
          date: b.billDate,
          amount: b.amount,
          tax: b.tax,
          uploadedFiles: b.invoice?.map((inv: any) => ({
            invoiceId: inv.invoiceId,
            invoiceName: inv.invoiceName,
            invoiceFileName: inv.invoiceFileName,
            invoiceFileType: inv.invoiceFileType,
            invoiceFile: inv.invoiceFile,
            fileName: inv.invoiceFileName,
            fileType: inv.invoiceFileType,
            url: `${getMimePrefix(inv.invoiceFile)}${inv.invoiceFile}`,
          })) || []
        }));

        setBills(mappedBills);
      } catch (error) {
        console.error("Failed to fetch bills", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBills();
  }, []);

  const handleAddBill = () => {
    const newId = bills.length + 1;
    const newBill: Bill = {
      id: newId,
      billNo: "",
      partyName: "",
      date: dayjs().format("YYYY-MM-DD"),
      amount: "",
      tax: "",
      uploadedFiles: [],
    };
    setBills(prev => [...prev, newBill]);
    setEditingBillId(newId);
    setEditedBillData(newBill);
    // Move to the last page when a new bill is added
    setPage(Math.floor(bills.length / rowsPerPage));
  };

  const handleSaveBill = async (id: number) => {
    const billToSave = bills.find((b) => b.id === id);
    if (!billToSave) return;

    try {
      const invoices = billToSave.uploadedFiles?.map((file) => {
        const base64Data = file.url.includes(",") ? file.url.split(",")[1] : file.url;
        return {
          invoiceFileName: file.fileName.trim(),
          invoiceName: file.invoiceName,
          invoiceFileType: `.${file.fileName.split(".").pop() || ""}`,
          invoiceFile: base64Data,
        };
      }) || [];

      const payload = {
        billNo: (editedBillData.billNo ?? billToSave.billNo)?.trim(),
        billDate: (editedBillData.date ?? billToSave.date)?.trim(),
        partyName: (editedBillData.partyName ?? billToSave.partyName)?.trim(),
        amount: (editedBillData.amount ?? billToSave.amount)?.toString().trim(),
        tax: (editedBillData.tax ?? billToSave.tax)?.toString().trim(),
        invoice: invoices,
      };

      console.log("Sending payload:", payload);

      if (!payload.billNo || !payload.billDate || !payload.partyName || !payload.amount || !payload.tax) {
        console.error("Missing required fields in payload", payload);
        return;
      }

      const res = await fetch("http://10.55.2.48:8081/addBill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to save bill: ${errorText}`);
      }

      const savedBill = await res.json();
      console.log("Saved bill from backend:", savedBill);

      const updatedBill: Bill = {
        id,
        billNo: savedBill.billNo,
        partyName: savedBill.partyName,
        date: savedBill.billDate,
        amount: savedBill.amount,
        tax: savedBill.tax,
        uploadedFiles:
          savedBill.invoice?.map((inv: any) => ({
            fileName: inv.invoiceFileName,
            fileType: inv.invoiceFileType,
            url: `data:${getMimePrefix(inv.invoiceFile)};base64,${inv.invoiceFile}`,
          })) || [],
      };

      setBills((prev) => prev.map((b) => (b.id === id ? updatedBill : b)));
      setEditingBillId(null);
      setEditedBillData({});
    } catch (error) {
      console.error("Error saving bill:", error);
    }
  };

  const handleCancelEdit = (id: number) => {
    const isNew = bills.find(b => b.id === id && !b.billNo);
    if (isNew) setBills(prev => prev.filter(b => b.id !== id));
    setEditingBillId(null);
    setEditedBillData({});
  };

  const handleDeleteBill = async (id: number) => {
    const billToDelete = bills.find(b => b.id === id);
    if (!billToDelete) return;

    try {
      const res = await fetch("http://10.55.2.48:8081/deleteBill", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billNo: billToDelete.billNo,
          billDate: billToDelete.date,
          partyName: billToDelete.partyName,
          tax: billToDelete.tax,
          amount: billToDelete.amount,
          invoice: billToDelete.uploadedFiles?.map(file => ({
            invoiceFileName: file.fileName,
            invoiceName: file.fileName,
            invoiceFileType: file.fileType,
            invoiceFile: file.url.split(",")[1],
          })) || []
        }),
      });

      if (!res.ok) throw new Error("Failed to delete bill");

      setBills(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      console.error("Error deleting bill:", error);
    }
  };

  const handleOpenUpload = (billId: string) => {
    setCurrentBillId(billId);
    setUploadDialogOpen(true);
  };

  const handleDeleteInvoice = async (invoiceId: number, billId: string) => {
    try {
      const res = await fetch("http://10.55.2.48:8081/deleteInvoice", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });

      if (!res.ok) throw new Error("Failed to delete invoice");

      setBills((prevBills) =>
        prevBills.map((bill) =>
          bill.id.toString() === billId
            ? {
              ...bill,
              uploadedFiles: bill.uploadedFiles?.filter(
                (file) => file.invoiceId !== invoiceId
              ),
            }
            : bill
        )
      );
    } catch (err) {
      console.error("Delete invoice error:", err);
    }
  };

  const handleDeleteAllInvoices = async (invoiceIds: number[], billId: string) => {
    try {
      const payload = bills
        .find(b => b.id.toString() === billId)
        ?.uploadedFiles
        ?.filter(f => invoiceIds.includes(f.invoiceId!))
        .map(f => ({
          invoiceId: f.invoiceId,
          invoiceName: f.invoiceName,
          invoiceFileName: f.invoiceFileName,
          invoiceFileType: f.invoiceFileType,
          invoiceFile: f.invoiceFile ? f.invoiceFile.split(",")[1] : ""
        }));

      if (!payload || payload.length === 0) return;

      const res = await fetch("http://10.55.2.48:8081/deleteAllInvoice", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to delete all invoices");
      }

      setBills(prevBills =>
        prevBills.map(bill =>
          bill.id.toString() === billId
            ? { ...bill, uploadedFiles: [] }
            : bill
        )
      );

    } catch (err) {
      console.error("Delete all invoices error:", err);
    }
  };

  const handleUploadSubmit = (files: { fileName: string; file: File; invoiceName: string }[], billId: string) => {
    const filesWithBase64Promises = files.map(f =>
      new Promise<{
        fileName: string;
        fileType: string;
        url: string;
        invoiceName?: string;
      }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({
          fileName: f.fileName,
          fileType: f.file.name.slice(f.file.name.lastIndexOf('.')),
          url: reader.result as string,
          invoiceName: f.invoiceName,
        });
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(f.file);
      })
    );

    Promise.all(filesWithBase64Promises).then(results => {
      setBills(prev =>
        prev.map(b =>
          b.id.toString() === billId
            ? { ...b, uploadedFiles: [...(b.uploadedFiles || []), ...results] }
            : b
        )
      );
    });
  };

  // Filter bills based on search query and date range
  const filteredBills = bills.filter(bill => {
    const billDate = dayjs(bill.date);
    const afterFrom = fromDate ? billDate.isSame(fromDate, "day") || billDate.isAfter(fromDate, "day") : true;
    const beforeTo = toDate ? billDate.isSame(toDate, "day") || billDate.isBefore(toDate, "day") : true;
    const matchesSearch = bill.billNo.toLowerCase().includes(searchQuery.toLowerCase()) || bill.partyName.toLowerCase().includes(searchQuery.toLowerCase());
    return afterFrom && beforeTo && matchesSearch;
  });

  // Apply pagination to the filtered bills
  const paginatedBills = filteredBills.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Pagination change handlers
  const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box className="dashboard-root">
        <Box component="main" className="dashboard-main">
          <Box className="dashboard-header">
            <Typography variant="h5" className="text">Bill Generate</Typography>
            <Button variant="contained" className="button" onClick={handleAddBill}>Add</Button>
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", mt: 2, mb: 2, gap: 2 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              <DatePicker label="From Date" value={fromDate} onChange={setFromDate} format="DD-MM-YYYY" slotProps={{ textField: { sx: { width: { xs: "100%", sm: "200px" } } } }} />
              <DatePicker label="To Date" value={toDate} onChange={setToDate} format="DD-MM-YYYY" slotProps={{ textField: { sx: { width: { xs: "100%", sm: "200px" } } } }} />
              <Button variant="contained" className="button" onClick={() => { setFromDate(null); setToDate(null); }}>Clear</Button>
            </Box>
            <TextField
              label="Search Bills"
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{ endAdornment: (<InputAdornment position="end"><SearchIcon /></InputAdornment>) }}
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
                    <TableCell colSpan={9} align="center">
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: '200px',
                        }}
                      >
                        <CircularProgress sx={{ color: "#3f51b5" }} />
                        <Typography variant="body2" sx={{ mt: 1, fontSize: "16px" }}>
                          Loading bills...
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : paginatedBills.length > 0 ? (
                  paginatedBills.map((bill, index) => (
                    <TableRow key={bill.id}>
                      <TableCell align="center">{(page * rowsPerPage) + index + 1}</TableCell>
                      <TableCell align="center">
                        {editingBillId === bill.id ? (
                          <TextField
                            variant="standard"
                            value={editedBillData.billNo || ""}
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
                            value={editedBillData.partyName || ""}
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
                            value={editedBillData.date}
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
                            type="number"
                            variant="standard"
                            value={editedBillData.amount || ""}
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
                            type="number"
                            variant="standard"
                            value={editedBillData.tax || ""}
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
                          startIcon={<UploadFileIcon />}
                          size="small"
                          onClick={() => handleOpenUpload(bill.id.toString())}
                          disabled={editingBillId !== bill.id}
                        >
                          Upload ({bill.uploadedFiles?.length || 0})
                        </Button>
                      </TableCell>
                      <TableCell align="center">
                        {editingBillId === bill.id ? (
                          <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                            <Button
                              color="success"
                              variant="outlined"
                              startIcon={<SaveIcon />}
                              size="small"
                              onClick={() => handleSaveBill(bill.id)}
                            >
                              Save
                            </Button>
                            <Button
                              color="warning"
                              variant="outlined"
                              startIcon={<CancelIcon />}
                              size="small"
                              onClick={() => handleCancelEdit(bill.id)}
                            >
                              Cancel
                            </Button>
                          </Box>
                        ) : (
                          <Button
                            color="primary"
                            variant="outlined"
                            startIcon={<EditIcon />}
                            size="small"
                            onClick={() => {
                              setEditingBillId(bill.id);
                              setEditedBillData({
                                billNo: bill.billNo,
                                partyName: bill.partyName,
                                date: dayjs(bill.date).format("YYYY-MM-DD"),
                                amount: bill.amount,
                                tax: bill.tax,
                              });
                            }}
                          >
                            Edit
                          </Button>
                        )}
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
                  <TableRow sx={{ height: 300 }}>
                    <TableCell colSpan={9} align="center" sx={{ fontSize: "25px", color: "gray" }}>
                      No bills found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredBills.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>

          <UploadDialog
            open={uploadDialogOpen}
            onClose={() => setUploadDialogOpen(false)}
            onSubmit={handleUploadSubmit}
            value={bills.find(b => b.id.toString() === currentBillId)?.uploadedFiles}
            billId={currentBillId}
            onDeleteInvoice={handleDeleteInvoice}
            onDeleteAllInvoices={handleDeleteAllInvoices}
          />
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default Dashboard;
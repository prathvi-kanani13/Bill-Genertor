import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItemButton,
    ListItemText,
    Typography
} from '@mui/material';
import { renderAsync } from 'docx-preview';

interface ViewDocumentDialogProps {
    open: boolean;
    onClose: () => void;
    documentFiles: { name: string; url: string; type: "sales" | "voucher" }[];
}

const ViewDocumentDialog: React.FC<ViewDocumentDialogProps> = ({
    open,
    onClose,
    documentFiles
}) => {
    const [selectedFile, setSelectedFile] = useState<{
        name: string;
        url: string;
        type: "sales" | "voucher";
    } | null>(null);

    useEffect(() => {
        if (documentFiles.length > 0) {
            setSelectedFile(documentFiles[0]);
        } else {
            setSelectedFile(null);
        }
    }, [documentFiles, open]);

    useEffect(() => {
        const loadDocx = async () => {
            if (
                selectedFile &&
                selectedFile.name.toLowerCase().endsWith(".docx")
            ) {
                const base64 = selectedFile.url.split(",")[1]; // remove "data:..." prefix
                const binary = atob(base64);
                const byteArray = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    byteArray[i] = binary.charCodeAt(i);
                }

                const container = document.getElementById("docx-preview");
                if (container) {
                    container.innerHTML = "";
                    await renderAsync(byteArray.buffer, container);
                }
            }
        };

        loadDocx();
    }, [selectedFile]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>View Uploaded Documents</DialogTitle>
            <DialogContent>
                {documentFiles.length === 0 ? (
                    <Typography>No documents available.</Typography>
                ) : (
                    <>
                        {documentFiles.length > 1 && (
                            <>
                                <Typography sx={{ mb: 1 }}>Select a document to view:</Typography>
                                <List dense>
                                    {documentFiles.map((file, idx) => (
                                        <ListItemButton
                                            key={idx}
                                            onClick={() => setSelectedFile(file)}
                                            selected={selectedFile?.name === file.name}
                                        >
                                            <ListItemText
                                                primary={file.name}
                                                secondary={`Type: ${file.type === "sales" ? "Sales" : "Voucher"}`}
                                            />
                                        </ListItemButton>
                                    ))}
                                </List>
                            </>
                        )}

                        {selectedFile && (
                            <>
                                <Typography sx={{ fontWeight: "bold", mt: 2 }}>
                                    {selectedFile.name}
                                </Typography>
                                <Typography sx={{ mb: 1 }}>
                                    Type: {selectedFile.type === "sales" ? "Sales" : "Voucher"}
                                </Typography>

                                {selectedFile.name.toLowerCase().endsWith(".pdf") ||
                                selectedFile.name.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/) ? (
                                    <embed
                                        src={selectedFile.url}
                                        title={selectedFile.name}
                                        style={{
                                            width: "100%",
                                            height: "75vh",
                                            border: "1px solid #ccc",
                                            marginTop: "0.5rem"
                                        }}
                                    />
                                ) : selectedFile.name.toLowerCase().endsWith(".docx") ? (
                                    <div
                                        id="docx-preview"
                                        style={{
                                            height: "75vh",
                                            overflow: "auto",
                                            border: "1px solid #ccc",
                                            padding: "1rem",
                                            marginTop: "0.5rem"
                                        }}
                                    />
                                ) : (
                                    <Typography>Unsupported file type.</Typography>
                                )}
                            </>
                        )}
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={onClose}
                    variant="contained"
                    sx={{ bgcolor: "#3f51b5", "&:hover": { bgcolor: "#303f9f" } }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ViewDocumentDialog;
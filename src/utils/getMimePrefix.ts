export const getMimePrefix = (base64: string): string => {
    if (typeof base64 !== "string" || !base64) {
        return "data:application/octet-stream;base64,";
    }

    if (base64.startsWith("JVBER")) return "data:application/pdf;base64,"; //PDF
    if (base64.startsWith("iVBOR")) return "data:image/png;base64,"; // PNG
    if (base64.startsWith("/9j/")) return "data:image/jpeg;base64,"; // JPEG
    if (base64.startsWith("UEsDB")) return "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"; // DOCX

    return "data:application/octet-stream;base64,"; // fallback for unknown formats
};
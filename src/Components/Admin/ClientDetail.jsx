import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import Navbar from "../Navbar/Navbar.jsx";
import CameraInput from "./CameraInput.jsx";
import "./Admin.css";

const VITE_API_URL_FORM = import.meta.env.VITE_API_URL_FORM;
const DOCUMENT_CAPTURE_FIELDS = [
  { documentType: "AadhaarFront", label: "Aadhaar Front" },
  { documentType: "AadhaarBack", label: "Aadhaar Back" },
  { documentType: "PANCard", label: "PAN Card" },
  { documentType: "PassportFront", label: "Passport Front" },
  { documentType: "PassportBack", label: "Passport Back" },
  { documentType: "DrivingLicenseFront", label: "License Front" },
  { documentType: "DrivingLicenseBack", label: "License Back" },
  { documentType: "VoterCardFront", label: "Voter Card Front" },
  { documentType: "VoterCardBack", label: "Voter Card Back" },
  { documentType: "MarksheetFront", label: "Marksheet Front" },
  { documentType: "MarksheetBack", label: "Marksheet Back" },
  { documentType: "CVPage1", label: "CV Page 1" },
  { documentType: "CVPage2", label: "CV Page 2" },
];

const ClientDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [client, setClient] = useState(location.state?.client || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(!client);
  const [newPhotoPreview, setNewPhotoPreview] = useState(null);
  const [documentEditState, setDocumentEditState] = useState({});
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    fetchClientDetail();
  }, [id]);

  const fetchClientDetail = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${VITE_API_URL_FORM}/${id}`);
      setClient(res.data.client || res.data);
    } catch (err) {
      console.error("Error fetching client:", err);
      toast.error("❌ Failed to load client details");
    } finally {
      setLoading(false);
    }
  };

  // ✅ ENHANCED PDF Download Function with All Documents (Multi-Page)
  // ✅ ENHANCED PDF Download Function with All Documents (Multi-Page)
  const handleDownloadPDF = async () => {
    try {
      toast.info("📄 Generating comprehensive PDF...");
      const doc = new jsPDF("p", "mm", "a4");
      let currentPage = 1;

      // Helper function to add image to PDF with error handling
      const addImageToPDF = async (imageUrl, x, y, width, height) => {
        try {
          const response = await fetch(imageUrl, { mode: 'cors' });
          const blob = await response.blob();
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              try {
                doc.addImage(reader.result, "JPEG", x, y, width, height);
                resolve(true);
              } catch (err) {
                console.error("Error adding image:", err);
                resolve(false);
              }
            };
            reader.onerror = () => resolve(false);
            reader.readAsDataURL(blob);
          });
        } catch (err) {
          console.error("Error fetching image:", err);
          return false;
        }
      };

      // ===== PAGE 1: HEADER & BASIC INFO =====
      doc.setFillColor(102, 126, 234);
      doc.rect(0, 0, 210, 30, "F");

      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("CLIENT INFORMATION FORM", 105, 20, { align: "center" });

      // Passport Photo
      const photoX = 155;
      const photoY = 60;
      const photoWidth = 40;
      const photoHeight = 50;

      if (client.photo) {
        await addImageToPDF(client.photo, photoX, photoY, photoWidth, photoHeight);
        doc.setDrawColor(102, 126, 234);
        doc.setLineWidth(1);
        doc.rect(photoX - 1, photoY - 1, photoWidth + 2, photoHeight + 2);
      } else {
        doc.setDrawColor(148, 163, 184);
        doc.rect(photoX, photoY, photoWidth, photoHeight);
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text("No Photo", photoX + 10, photoY + 25);
      }

      let y = 45;
      const labelX = 15;
      const valueX = 70;

      const addRow = (label, value) => {
        if (y > 270) {
          doc.addPage();
          currentPage++;
          y = 20;
        }
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "normal");
        doc.text(label, labelX, y);

        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "bold");
        const lines = doc.splitTextToSize(value || "N/A", 75);
        doc.text(lines, valueX, y);
        y += 7 * lines.length;
      };

      const addSection = (title) => {
        if (y > 260) {
          doc.addPage();
          currentPage++;
          y = 20;
        }
        y += 5;
        doc.setFontSize(13);
        doc.setTextColor(102, 126, 234);
        doc.setFont("helvetica", "bold");
        doc.text(title, 15, y);
        doc.setDrawColor(102, 126, 234);
        doc.setLineWidth(0.5);
        doc.line(15, y + 2, 195, y + 2);
        y += 8;
      };

      // BASIC INFORMATION
      addSection("BASIC INFORMATION");
      addRow("Client Name:", client.clientName || "N/A");
      addRow("Surname:", client.surname || "N/A");
      addRow("Contact:", client.contact || "N/A");
      addRow("Email:", client.email || "N/A");
      addRow("Gender:", client.gender || "N/A");
      addRow("Date of Birth:", client.dob ? new Date(client.dob).toLocaleDateString('en-IN') : "N/A");
      addRow("Age:", client.age?.toString() || "N/A");
      addRow("Nationality:", client.nationality || "N/A");
      addRow("Marital Status:", client.maritalStatus || "N/A");
      addRow("Education:", client.education || "N/A");
      addRow("Occupation:", client.occupation || "N/A");
      addRow("Family Members:", client.familyMembersCount?.toString() || "0");

      if (client.address) {
        addRow("Address:", client.address);
      }

      // DOCUMENT NUMBERS
      addSection("DOCUMENT NUMBERS");
      addRow("Aadhaar Card No:", client.aadhaarCardNo || "N/A");
      addRow("PAN Card No:", client.panCardNo || "N/A");
      addRow("Passport No:", client.passportNo || "N/A");
      addRow("Driving License No:", client.drivingLicenseNo || "N/A");
      addRow("Voter Card No:", client.voterCardNo || "N/A");

      // FAMILY DETAILS - FATHER
      addSection("FATHER DETAILS");
      addRow("Father Name:", `${client.fatherName || ""} ${client.fatherSurname || ""}`);
      addRow("Father Phone:", client.fatherPhone || "N/A");
      addRow("Father Email:", client.fatherEmail || "N/A");

      // FAMILY DETAILS - MOTHER
      addSection("MOTHER DETAILS");
      addRow("Mother Name:", `${client.motherName || ""} ${client.motherSurname || ""}`);
      addRow("Mother Phone:", client.motherPhone || "N/A");
      addRow("Mother Email:", client.motherEmail || "N/A");

      // SPOUSE DETAILS
      if (client.maritalStatus === "Married") {
        addSection("SPOUSE DETAILS");
        addRow("Spouse Name:", `${client.spouseName || ""} ${client.spouseSurname || ""}`);
        addRow("Spouse Phone:", client.spousePhone || "N/A");
        addRow("Spouse Email:", client.spouseEmail || "N/A");
      }

      // ===== PAGES 2-N: CAPTURED DOCUMENTS (GROUPED BY TYPE) =====
      if (client.documents && client.documents.length > 0) {
        const documentGroups = [
          {
            title: "Aadhaar Card",
            types: ["AadhaarFront", "AadhaarBack"],
            perPage: 2
          },
          {
            title: "PAN Card",
            types: ["PANCard"],
            perPage: 1
          },
          {
            title: "Passport",
            types: ["PassportFront", "PassportBack"],
            perPage: 2
          },
          {
            title: "Driving License",
            types: ["DrivingLicenseFront", "DrivingLicenseBack"],
            perPage: 2
          },
          {
            title: "Voter Card",
            types: ["VoterCardFront", "VoterCardBack"],
            perPage: 2
          },
          {
            title: "Marksheet",
            types: ["MarksheetFront", "MarksheetBack"],
            perPage: 2
          },
          {
            title: "CV / Resume",
            types: ["CVPage1", "CVPage2"],
            perPage: 2
          }
        ];

        const cardX = 18;
        const cardWidth = 174;
        const imageWidth = 170;
        const imageHeight = 94;
        const titleYSlots = [38, 168]; // For 2 docs per page
        const singleDocTitleY = 90; // For 1 doc per page
        const singleDocImageY = 100;

        const toReadableDocTitle = (value) => {
          if (!value) return "Document";
          return value
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
            .trim();
        };

        // Process each document group
        for (const group of documentGroups) {
          // Find documents matching this group
          const groupDocs = client.documents.filter(doc =>
            group.types.includes(doc.documentType)
          );

          // Skip if no documents in this group
          if (groupDocs.length === 0) continue;

          // Add new page for this group
          doc.addPage();
          currentPage++;

          // Page header with group title
          doc.setFillColor(51, 65, 85);
          doc.rect(0, 0, 210, 24, "F");
          doc.setFontSize(15);
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.text(group.title, 105, 15, { align: "center" });

          // Add documents to page
          for (let i = 0; i < groupDocs.length; i++) {
            const document = groupDocs[i];

            let titleY, imageY;
            const imageX = cardX + 2;

            if (group.perPage === 1) {
              // Single document - centered
              titleY = singleDocTitleY;
              imageY = singleDocImageY;
            } else {
              // Multiple documents (2 per page)
              titleY = titleYSlots[i];
              imageY = titleY + 10;
            }

            // Document title
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 41, 59);
            doc.text(toReadableDocTitle(document.documentType), cardX, titleY);

            // Document image
            if (document.imageUrl) {
              const success = await addImageToPDF(
                document.imageUrl,
                imageX,
                imageY,
                imageWidth,
                imageHeight
              );

              if (success) {
                doc.setDrawColor(203, 213, 225);
                doc.setLineWidth(0.8);
                doc.rect(cardX, imageY - 2, cardWidth, imageHeight + 4);
              } else {
                doc.setDrawColor(203, 213, 225);
                doc.rect(cardX, imageY - 2, cardWidth, imageHeight + 4);
                doc.setFontSize(10);
                doc.setTextColor(148, 163, 184);
                doc.setFont("helvetica", "normal");
                doc.text("Document unavailable", 105, imageY + 48, { align: "center" });
              }
            } else {
              doc.setDrawColor(203, 213, 225);
              doc.rect(cardX, imageY - 2, cardWidth, imageHeight + 4);
              doc.setFontSize(10);
              doc.setTextColor(148, 163, 184);
              doc.setFont("helvetica", "normal");
              doc.text("No document captured", 105, imageY + 48, { align: "center" });
            }
          }
        }
      }

      // ===== FOOTER ON EACH PAGE =====
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(15, 285, 195, 285);

        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Generated on ${new Date().toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}`,
          105,
          290,
          { align: "center" }
        );

        doc.text(
          `Page ${i} of ${totalPages}`,
          195,
          290,
          { align: "right" }
        );

        doc.setFontSize(7);
        doc.text(
          `Client: ${client.clientName || 'N/A'} ${client.surname || ''}`,
          15,
          290
        );
      }

      doc.save(`${client.clientName || 'Client'}_Complete_Form.pdf`);
      toast.success(`📄 Complete PDF with ${client.documents?.length || 0} documents downloaded!`);

    } catch (error) {
      console.error("PDF Error:", error);
      toast.error("❌ PDF generation failed: " + error.message);
    }
  };

  const handleEditStart = () => {
    setEditData({ ...client });
    setNewPhotoPreview(null);
    setActiveTab("details");
    const initialDocs =
      client?.documents?.reduce((acc, doc) => {
        if (doc?.documentType) {
          acc[doc.documentType] = {
            imageUrl: doc.imageUrl || "",
            file: null,
            previewUrl: "",
          };
        }
        return acc;
      }, {}) || {};
    setDocumentEditState(initialDocs);
    setIsEditing(true);
  };

  const calculateAgeFromDOB = (dob) => {
    if (!dob) return "";
    const birthDate = new Date(dob);
    const today = new Date();
    if (isNaN(birthDate.getTime())) return "";
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? age.toString() : "";
  };

  const handleInputChange = (field, value) => {
    setEditData({
      ...editData,
      [field]: value,
    });
    if (field === 'dob' && value) {
      const calculatedAge = calculateAgeFromDOB(value);
      setEditData(prev => ({ ...prev, age: calculatedAge }));
    }
  };

  const handleNewPhotoCapture = (file) => {
    setEditData((prev) => ({ ...prev, photo: file }));
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDocumentCapture = (documentType, file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setDocumentEditState((prev) => ({
        ...prev,
        [documentType]: {
          imageUrl: prev[documentType]?.imageUrl || "",
          file,
          previewUrl: reader.result || "",
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      const form = new FormData();

      Object.keys(editData).forEach((key) => {
        if (
          key !== "photo" &&
          key !== "documents" &&
          key !== "_id" &&
          key !== "createdAt" &&
          key !== "updatedAt" &&
          key !== "__v"
        ) {
          form.append(key, editData[key]);
        }
      });

      if (editData.photo instanceof File) {
        form.append("photo", editData.photo);
      }

      const hasDocumentChanges = Object.values(documentEditState).some(
        (doc) => doc?.file instanceof File,
      );

      if (hasDocumentChanges) {
        let uploadIndex = 0;
        const docsPayload = [];

        DOCUMENT_CAPTURE_FIELDS.forEach(({ documentType }) => {
          const docState = documentEditState[documentType];

          if (docState?.file instanceof File) {
            form.append("documents", docState.file);
            docsPayload.push({ documentType, uploadIndex });
            uploadIndex += 1;
            return;
          }

          if (docState?.imageUrl) {
            docsPayload.push({ documentType, imageUrl: docState.imageUrl });
          }
        });

        Object.entries(documentEditState).forEach(([documentType, docState]) => {
          if (
            !DOCUMENT_CAPTURE_FIELDS.some((field) => field.documentType === documentType) &&
            docState?.imageUrl
          ) {
            docsPayload.push({ documentType, imageUrl: docState.imageUrl });
          }
        });

        form.append("documents", JSON.stringify(docsPayload));
      }

      const res = await axios.put(`${VITE_API_URL_FORM}/${id}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setClient(res.data.client);
      setIsEditing(false);
      setNewPhotoPreview(null);
      setDocumentEditState({});
      toast.success("✅ Client updated successfully");
    } catch (err) {
      console.error("Error updating client:", err);
      toast.error(
        "❌ Failed to update client: " +
        (err.response?.data?.message || err.message),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      window.confirm("Are you sure you want to delete this client permanently?")
    ) {
      try {
        await axios.delete(`${VITE_API_URL_FORM}/${id}`);
        toast.success("✅ Client deleted successfully");
        navigate("/admin");
      } catch (err) {
        console.error("Error deleting client:", err);
        toast.error("❌ Failed to delete client: " + err.message);
      }
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="no-results">
          <p>⏳ Loading client details...</p>
        </div>
      </>
    );
  }

  if (!client) {
    return (
      <>
        <Navbar />
        <div className="no-results">
          <p>❌ Client not found</p>
        </div>
      </>
    );
  }

  const photoUrl = client.photo || null;

  return (
    <>
      <Navbar />
      <div className="admin-wrapper">
        <div className="admin-container">
          <div className="admin-header">
            <div>
              <h2>👤 {client.clientName} {client.surname}</h2>
              <p>Client Details</p>
            </div>
            <div className="header-buttons">
              <button
                onClick={handleDownloadPDF}
                className="btn-action btn-pdf"
                disabled={loading}
              >
                📄 Download PDF
              </button>
              <button
                onClick={() => navigate("/admin")}
                className="btn-action edit"
              >
                ← Back to List
              </button>
            </div>
          </div>

          <div className="client-detail-tabs">
            <button
              type="button"
              className={`detail-tab-btn ${activeTab === "details" ? "active" : ""}`}
              onClick={() => setActiveTab("details")}
            >
              Data Fields
            </button>
            <button
              type="button"
              className={`detail-tab-btn ${activeTab === "images" ? "active" : ""}`}
              onClick={() => setActiveTab("images")}
            >
              Images
            </button>
          </div>

          <div className={`client-detail-wrapper ${activeTab === "details" ? "tab-details" : "tab-images"}`}>
            {/* LEFT SIDE - ALL INFORMATION */}
            <div className={`detail-info-section ${activeTab === "details" ? "" : "tab-hidden"}`}>
              {!isEditing ? (
                <>
                  {/* BASIC INFORMATION */}
                  <div className="info-section">
                    <h3 className="section-title">📋 Basic Information</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Client Name</label>
                        <p>{client.clientName || "N/A"}</p>
                      </div>
                      <div className="info-item">
                        <label>Surname</label>
                        <p>{client.surname || "N/A"}</p>
                      </div>
                      <div className="info-item">
                        <label>Contact</label>
                        <p>{client.contact || "N/A"}</p>
                      </div>
                      <div className="info-item">
                        <label>Email</label>
                        <p>{client.email || "N/A"}</p>
                      </div>
                      <div className="info-item">
                        <label>Gender</label>
                        <p>{client.gender || "N/A"}</p>
                      </div>
                      <div className="info-item">
                        <label>Date of Birth</label>
                        <p>{client.dob ? new Date(client.dob).toLocaleDateString('en-IN') : "N/A"}</p>
                      </div>
                      <div className="info-item">
                        <label>Age</label>
                        <p>{client.age || "N/A"} years</p>
                      </div>
                      <div className="info-item">
                        <label>Nationality</label>
                        <p>{client.nationality || "N/A"}</p>
                      </div>
                      <div className="info-item">
                        <label>Marital Status</label>
                        <p>{client.maritalStatus || "N/A"}</p>
                      </div>
                      <div className="info-item">
                        <label>Education</label>
                        <p>{client.education || "N/A"}</p>
                      </div>
                      <div className="info-item">
                        <label>Occupation</label>
                        <p>{client.occupation || "N/A"}</p>
                      </div>
                      <div className="info-item">
                        <label>Family Members</label>
                        <p>{client.familyMembersCount || "0"}</p>
                      </div>
                      <div className="info-item full-width">
                        <label>Address</label>
                        <p>{client.address || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  {/* DOCUMENT NUMBERS */}
                  <div className="info-section">
                    <h3 className="section-title">🆔 Document Numbers</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Aadhaar Card No</label>
                        <p>{client.aadhaarCardNo || "N/A"}</p>
                      </div>
                      <div className="info-item">
                        <label>PAN Card No</label>
                        <p>{client.panCardNo || "N/A"}</p>
                      </div>
                      <div className="info-item">
                        <label>Passport No</label>
                        <p>{client.passportNo || "N/A"}</p>
                      </div>
                      <div className="info-item">
                        <label>Driving License No</label>
                        <p>{client.drivingLicenseNo || "N/A"}</p>
                      </div>
                      <div className="info-item">
                        <label>Voter Card No</label>
                        <p>{client.voterCardNo || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  {/* FAMILY DETAILS */}
                  <div className="info-section">
                    <h3 className="section-title">👨‍👩‍👧 Family Details</h3>

                    <h4 className="subsection-title">Father's Information</h4>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Name</label>
                        <p>{client.fatherName || "N/A"}</p>
                      </div>
                      <div className="info-item">
                        <label>Surname</label>
                        <p>{client.fatherSurname || "N/A"}</p>
                      </div>
                      <div className="info-item">
                        <label>Phone</label>
                        <p>{client.fatherPhone || "N/A"}</p>
                      </div>
                      <div className="info-item">
                        <label>Email</label>
                        <p>{client.fatherEmail || "N/A"}</p>
                      </div>
                    </div>

                    <h4 className="subsection-title">Mother's Information</h4>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Name</label>
                        <p>{client.motherName || "N/A"}</p>
                      </div>
                      <div className="info-item">
                        <label>Surname</label>
                        <p>{client.motherSurname || "N/A"}</p>
                      </div>
                      <div className="info-item">
                        <label>Phone</label>
                        <p>{client.motherPhone || "N/A"}</p>
                      </div>
                      <div className="info-item">
                        <label>Email</label>
                        <p>{client.motherEmail || "N/A"}</p>
                      </div>
                    </div>

                    {client.maritalStatus === "Married" && (
                      <>
                        <h4 className="subsection-title">Spouse's Information</h4>
                        <div className="info-grid">
                          <div className="info-item">
                            <label>Name</label>
                            <p>{client.spouseName || "N/A"}</p>
                          </div>
                          <div className="info-item">
                            <label>Surname</label>
                            <p>{client.spouseSurname || "N/A"}</p>
                          </div>
                          <div className="info-item">
                            <label>Phone</label>
                            <p>{client.spousePhone || "N/A"}</p>
                          </div>
                          <div className="info-item">
                            <label>Email</label>
                            <p>{client.spouseEmail || "N/A"}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="detail-actions">
                    <button className="btn btn-edit" onClick={handleEditStart}>
                      ✏️ Edit Information
                    </button>
                    <button className="btn btn-delete" onClick={handleDelete}>
                      🗑️ Delete Client
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* EDIT MODE */}
                  <div className="form-grid">
                    {/* Basic Information */}
                    <h3 className="section-title" style={{ gridColumn: '1 / -1' }}>Basic Information</h3>

                    <div className="form-group">
                      <label>Client Name</label>
                      <input
                        type="text"
                        value={editData.clientName || ""}
                        onChange={(e) => handleInputChange("clientName", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Surname</label>
                      <input
                        type="text"
                        value={editData.surname || ""}
                        onChange={(e) => handleInputChange("surname", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Contact</label>
                      <input
                        type="text"
                        value={editData.contact || ""}
                        onChange={(e) => handleInputChange("contact", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={editData.email || ""}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Gender</label>
                      <select
                        value={editData.gender || ""}
                        onChange={(e) => handleInputChange("gender", e.target.value)}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Date of Birth</label>
                      <input
                        type="date"
                        value={editData.dob ? new Date(editData.dob).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleInputChange("dob", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Age</label>
                      <input
                        type="number"
                        value={editData.age || ""}
                        readOnly
                      />
                    </div>
                    <div className="form-group">
                      <label>Nationality</label>
                      <input
                        type="text"
                        value={editData.nationality || ""}
                        onChange={(e) => handleInputChange("nationality", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Marital Status</label>
                      <select
                        value={editData.maritalStatus || ""}
                        onChange={(e) => handleInputChange("maritalStatus", e.target.value)}
                      >
                        <option value="">Select Status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Separated">Separated</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Education</label>
                      <input
                        type="text"
                        value={editData.education || ""}
                        onChange={(e) => handleInputChange("education", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Occupation</label>
                      <input
                        type="text"
                        value={editData.occupation || ""}
                        onChange={(e) => handleInputChange("occupation", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Family Members</label>
                      <input
                        type="number"
                        value={editData.familyMembersCount || ""}
                        onChange={(e) => handleInputChange("familyMembersCount", e.target.value)}
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Address</label>
                      <textarea
                        value={editData.address || ""}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        rows="3"
                      />
                    </div>

                    {/* Document Numbers */}
                    <h3 className="section-title" style={{ gridColumn: '1 / -1', marginTop: '20px' }}>Document Numbers</h3>

                    <div className="form-group">
                      <label>Aadhaar Card No</label>
                      <input
                        type="text"
                        value={editData.aadhaarCardNo || ""}
                        onChange={(e) => handleInputChange("aadhaarCardNo", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>PAN Card No</label>
                      <input
                        type="text"
                        value={editData.panCardNo || ""}
                        onChange={(e) => handleInputChange("panCardNo", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Passport No</label>
                      <input
                        type="text"
                        value={editData.passportNo || ""}
                        onChange={(e) => handleInputChange("passportNo", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Driving License No</label>
                      <input
                        type="text"
                        value={editData.drivingLicenseNo || ""}
                        onChange={(e) => handleInputChange("drivingLicenseNo", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Voter Card No</label>
                      <input
                        type="text"
                        value={editData.voterCardNo || ""}
                        onChange={(e) => handleInputChange("voterCardNo", e.target.value)}
                      />
                    </div>

                    {/* Family Details */}
                    <h3 className="section-title" style={{ gridColumn: '1 / -1', marginTop: '20px' }}>Family Details - Father</h3>

                    <div className="form-group">
                      <label>Father Name</label>
                      <input
                        type="text"
                        value={editData.fatherName || ""}
                        onChange={(e) => handleInputChange("fatherName", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Father Surname</label>
                      <input
                        type="text"
                        value={editData.fatherSurname || ""}
                        onChange={(e) => handleInputChange("fatherSurname", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Father Phone</label>
                      <input
                        type="text"
                        value={editData.fatherPhone || ""}
                        onChange={(e) => handleInputChange("fatherPhone", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Father Email</label>
                      <input
                        type="email"
                        value={editData.fatherEmail || ""}
                        onChange={(e) => handleInputChange("fatherEmail", e.target.value)}
                      />
                    </div>

                    <h3 className="section-title" style={{ gridColumn: '1 / -1', marginTop: '20px' }}>Family Details - Mother</h3>

                    <div className="form-group">
                      <label>Mother Name</label>
                      <input
                        type="text"
                        value={editData.motherName || ""}
                        onChange={(e) => handleInputChange("motherName", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Mother Surname</label>
                      <input
                        type="text"
                        value={editData.motherSurname || ""}
                        onChange={(e) => handleInputChange("motherSurname", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Mother Phone</label>
                      <input
                        type="text"
                        value={editData.motherPhone || ""}
                        onChange={(e) => handleInputChange("motherPhone", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Mother Email</label>
                      <input
                        type="email"
                        value={editData.motherEmail || ""}
                        onChange={(e) => handleInputChange("motherEmail", e.target.value)}
                      />
                    </div>

                    {editData.maritalStatus === "Married" && (
                      <>
                        <h3 className="section-title" style={{ gridColumn: '1 / -1', marginTop: '20px' }}>Family Details - Spouse</h3>

                        <div className="form-group">
                          <label>Spouse Name</label>
                          <input
                            type="text"
                            value={editData.spouseName || ""}
                            onChange={(e) => handleInputChange("spouseName", e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Spouse Surname</label>
                          <input
                            type="text"
                            value={editData.spouseSurname || ""}
                            onChange={(e) => handleInputChange("spouseSurname", e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Spouse Phone</label>
                          <input
                            type="text"
                            value={editData.spousePhone || ""}
                            onChange={(e) => handleInputChange("spousePhone", e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Spouse Email</label>
                          <input
                            type="email"
                            value={editData.spouseEmail || ""}
                            onChange={(e) => handleInputChange("spouseEmail", e.target.value)}
                          />
                        </div>
                      </>
                    )}
                  </div>

                </>
              )}
            </div>

            {/* RIGHT SIDE - PASSPORT PHOTO & DOCUMENTS */}
            <div className={`detail-media-section ${activeTab === "images" ? "" : "tab-hidden"}`}>
              {/* Passport Photo */}
              <div className="passport-photo-card">
                <h3 className="section-title">👤 Passport Size Photo</h3>
                {!isEditing ? (
                  photoUrl ? (
                    <div className="photo-container">
                      <img
                        src={photoUrl}
                        alt={`${client.clientName} ${client.surname}`}
                        className="client-passport-photo"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          e.target.src =
                            'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect fill="%23ddd" width="300" height="300"/><text x="50%" y="50%" text-anchor="middle" fill="%23999" font-size="16">No Photo</text></svg>';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="no-photo-placeholder">
                      <span>📷</span>
                      <p>No Photo Available</p>
                    </div>
                  )
                ) : (
                  <div className="photo-container">
                    <img
                      src={newPhotoPreview || photoUrl || "https://via.placeholder.com/300?text=No+Photo"}
                      alt="Preview"
                      className="client-passport-photo"
                      style={{
                        border: newPhotoPreview ? "3px solid #667eea" : "3px solid var(--border-color)",
                      }}
                    />
                    {newPhotoPreview && (
                      <p className="new-photo-badge">
                        ✓ New photo captured
                      </p>
                    )}
                    <div style={{ marginTop: "14px" }}>
                      <CameraInput
                        label="Update Passport Photo"
                        name="photo"
                        setFile={handleNewPhotoCapture}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Captured Documents */}
              <div className="documents-card">
                <h3 className="section-title">📸 Captured Documents</h3>
                {isEditing && (
                  <div style={{ marginBottom: "16px" }}>
                    <p style={{ marginBottom: "10px", color: "var(--text-secondary)" }}>
                      Replace any captured image below. Leave untouched fields as-is.
                    </p>
                    <div className="documents-grid-view">
                      {DOCUMENT_CAPTURE_FIELDS.map(({ documentType, label }) => {
                        const existingImage =
                          documentEditState[documentType]?.previewUrl ||
                          documentEditState[documentType]?.imageUrl;

                        return (
                          <div key={documentType} className="document-item">
                            <div className="document-label">{label}</div>
                            {existingImage ? (
                              <img
                                src={existingImage}
                                alt={label}
                                className="document-thumbnail"
                              />
                            ) : (
                              <div className="document-placeholder">
                                <span>📄</span>
                                <p>No Document</p>
                              </div>
                            )}

                            <CameraInput
                              label={`Update ${label}`}
                              name={documentType}
                              setFile={(file) => handleDocumentCapture(documentType, file)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {!isEditing && client.documents && client.documents.length > 0 ? (

                  <div className="documents-grid-view">

                    {client.documents.map((doc, index) => (

                      <div key={index} className="document-item">

                        <div className="document-label">
                          {doc.documentType || `Document ${index + 1}`}
                        </div>
                        {doc.imageUrl ? (
                          <img
                            src={doc.imageUrl}
                            alt={doc.documentType || `Document ${index + 1}`}
                            className="document-thumbnail"
                            crossOrigin="anonymous"
                            onClick={() => window.open(doc.imageUrl, "_blank")}
                            onError={(e) => {
                              e.target.src =
                                'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150"><rect fill="%23f1f5f9" width="200" height="150"/><text x="50%" y="50%" text-anchor="middle" fill="%23999" font-size="12">Image Error</text></svg>';
                            }}
                          />
                        ) : (
                          <div className="document-placeholder">
                            <span>📄</span>
                            <p>No Document</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : !isEditing ? (
                  <div className="no-documents-placeholder">
                    <span>📂</span>
                    <p>No documents captured</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          {isEditing && (
            <div className="detail-actions detail-actions-global">
              <button
                className="btn btn-delete"
                onClick={() => {
                  setIsEditing(false);
                  setNewPhotoPreview(null);
                  setDocumentEditState({});
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-edit"
                onClick={handleSaveEdit}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ClientDetail;
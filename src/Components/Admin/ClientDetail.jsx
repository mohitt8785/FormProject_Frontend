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

  const handleDownloadPDF = async () => {
    try {
      // toast.info("📄 Generating comprehensive PDF...");
      const doc = new jsPDF("p", "mm", "a4");
      // A4 = 210mm x 297mm
      let currentPage = 1;

      // ✅ Aspect-ratio-safe image adder
      const addImageToPDF = async (imageUrl, x, y, maxW, maxH) => {
        try {
          const response = await fetch(imageUrl, { mode: "cors" });
          const blob = await response.blob();

          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              try {
                const base64 = reader.result;
                const img = new Image();
                img.onload = () => {
                  const naturalW = img.naturalWidth;
                  const naturalH = img.naturalHeight;

                  // Fit inside maxW x maxH while keeping aspect ratio
                  const ratio = Math.min(maxW / naturalW, maxH / naturalH);
                  const fitW = naturalW * ratio;
                  const fitH = naturalH * ratio;

                  // Center inside the box
                  const offsetX = x + (maxW - fitW) / 2;
                  const offsetY = y + (maxH - fitH) / 2;

                  doc.addImage(base64, "JPEG", offsetX, offsetY, fitW, fitH);
                  resolve({ success: true, fitW, fitH });
                };
                img.onerror = () => resolve({ success: false });
                img.src = base64;
              } catch (err) {
                resolve({ success: false });
              }
            };
            reader.onerror = () => resolve({ success: false });
            reader.readAsDataURL(blob);
          });
        } catch (err) {
          return { success: false };
        }
      };

      // ─────────────────────────────────────────
      // PAGE 1: HEADER
      // ─────────────────────────────────────────
      doc.setFillColor(102, 126, 234);
      doc.rect(0, 0, 210, 30, "F");
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("CLIENT INFORMATION FORM", 105, 20, { align: "center" });

      // ─────────────────────────────────────────
      // ✅ PASSPORT PHOTO — Standard size: 35mm × 45mm
      // Placed top-right of page 1
      // ─────────────────────────────────────────
      const photoW = 35;   // mm — standard passport width
      const photoH = 45;   // mm — standard passport height
      const photoX = 165;  // right side (210 - 35 - 10 margin)
      const photoY = 55;

      if (client.photo) {
        await addImageToPDF(client.photo, photoX, photoY, photoW, photoH);
        doc.setDrawColor(102, 126, 234);
        doc.setLineWidth(1);
        doc.rect(photoX, photoY, photoW, photoH); // exact border around passport box
      } else {
        doc.setFillColor(240, 240, 240);
        doc.rect(photoX, photoY, photoW, photoH, "F");
        doc.setDrawColor(148, 163, 184);
        doc.rect(photoX, photoY, photoW, photoH);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("No Photo", photoX + photoW / 2, photoY + photoH / 2, { align: "center" });
      }

      // Passport photo label
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.text("Passport Photo", photoX + photoW / 2, photoY + photoH + 4, { align: "center" });
      doc.text("(35×45 mm)", photoX + photoW / 2, photoY + photoH + 8, { align: "center" });

      // ─────────────────────────────────────────
      // TEXT ROWS (stay left of photo)
      // ─────────────────────────────────────────
      let y = 38;
      const labelX = 15;
      const valueX = 70;
      const textMaxWidth = 85; // keep text away from photo

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
        const lines = doc.splitTextToSize(value || "N/A", textMaxWidth);
        doc.text(lines, valueX, y);
        y += 7 * lines.length;
      };

      const addSection = (title) => {
        if (y > 260) {
          doc.addPage();
          currentPage++;
          y = 20;
        }
        y += 4;
        doc.setFontSize(12);
        doc.setTextColor(102, 126, 234);
        doc.setFont("helvetica", "bold");
        doc.text(title, 15, y);
        doc.setDrawColor(102, 126, 234);
        doc.setLineWidth(0.4);
        doc.line(15, y + 2, 195, y + 2);
        y += 8;
      };

      addSection("BASIC INFORMATION");
      addRow("Client Name:", client.clientName || "N/A");
      addRow("Surname:", client.surname || "N/A");
      addRow("Contact:", client.contact || "N/A");
      addRow("Email:", client.email || "N/A");
      addRow("Gender:", client.gender || "N/A");
      addRow("Date of Birth:", client.dob ? new Date(client.dob).toLocaleDateString("en-IN") : "N/A");
      addRow("Age:", client.age?.toString() || "N/A");
      addRow("Country:", client.country || "N/A");
      addRow("Nationality:", client.nationality || "N/A");
      addRow("Marital Status:", client.maritalStatus || "N/A");
      addRow("Education:", client.education || "N/A");
      addRow("Occupation:", client.occupation || "N/A");
      addRow("Applied For:", client.appliedFor || "N/A");
      addRow("Pre Work Experience:", client.preWorkExperience || "N/A");
      addRow("Consular Name:", client.consularName || "N/A");
      addRow("Family Members:", client.familyMembersCount?.toString() || "0");
      if (client.address) addRow("Address:", client.address);

      addSection("GOVERNMENT SERVANT INFORMATION");
      addRow("Family Member in Govt Service:", client.hasGovtServant || "N/A");
      if (client.hasGovtServant === "Yes") {
        addRow("Relation:", client.govtServantRelation || "N/A");
        addRow("Name:", client.govtServantName || "N/A");
        addRow("Work Type:", client.govtServantWorkType || "N/A");
        addRow("Designation:", client.govtServantDesignation || "N/A");
      }

      addSection("DOCUMENT NUMBERS");
      addRow("Aadhaar Card No:", client.aadhaarCardNo || "N/A");
      addRow("PAN Card No:", client.panCardNo || "N/A");
      addRow("Passport No:", client.passportNo || "N/A");
      addRow("Driving License No:", client.drivingLicenseNo || "N/A");
      addRow("Voter Card No:", client.voterCardNo || "N/A");

      doc.addPage();
      currentPage++;
      y = 20;

      addSection("FATHER DETAILS");
      addRow("Father Name:", `${client.fatherName || ""} ${client.fatherSurname || ""}`.trim());
      addRow("Father Phone:", client.fatherPhone || "N/A");
      addRow("Father Email:", client.fatherEmail || "N/A");

      addSection("MOTHER DETAILS");
      addRow("Mother Name:", `${client.motherName || ""} ${client.motherSurname || ""}`.trim());
      addRow("Mother Phone:", client.motherPhone || "N/A");
      addRow("Mother Email:", client.motherEmail || "N/A");

      if (client.maritalStatus === "Married") {
        addSection("SPOUSE DETAILS");
        addRow("Spouse Name:", `${client.spouseName || ""} ${client.spouseSurname || ""}`.trim());
        addRow("Spouse Phone:", client.spousePhone || "N/A");
        addRow("Spouse Email:", client.spouseEmail || "N/A");
      }

      // ─────────────────────────────────────────
      // ✅ DOCUMENT PAGES
      // Real-world card sizes (in mm):
      //   Credit/ID card (Aadhaar, PAN, Voter, DL): 85.6 × 54  → ratio 1.585
      //   Passport inner page:                       125 × 88   → ratio 1.42
      //   A4 Marksheet / CV:                         210 × 297  → portrait, fit full page
      //
      // On A4 (210mm wide, usable ~180mm):
      //   2-per-page: each card max 174mm × 110mm  (landscape orientation on page)
      //   1-per-page: card max 174mm × 130mm
      // ─────────────────────────────────────────
      if (client.documents && client.documents.length > 0) {

        // ✅ Document groups with their real aspect ratios & layout
        const documentGroups = [
          {
            title: "Aadhaar Card",
            types: ["AadhaarFront", "AadhaarBack"],
            perPage: 2,
            // Standard ID card: 85.6×54mm → scale to fit 174×100mm box
            maxW: 174, maxH: 100,
          },
          {
            title: "PAN Card",
            types: ["PANCard"],
            perPage: 1,
            // PAN = landscape ID card, give it more height for 1-per-page
            maxW: 174, maxH: 120,
          },
          {
            title: "Passport",
            types: ["PassportFront", "PassportBack"],
            perPage: 2,
            // Passport page ~125×88mm → slightly taller ratio
            maxW: 174, maxH: 110,
          },
          {
            title: "Driving License",
            types: ["DrivingLicenseFront", "DrivingLicenseBack"],
            perPage: 2,
            // DL = ID card size
            maxW: 174, maxH: 100,
          },
          {
            title: "Voter Card",
            types: ["VoterCardFront", "VoterCardBack"],
            perPage: 2,
            // Voter card = ID card size (as in your photo)
            maxW: 174, maxH: 100,
          },
          {
            title: "Marksheet",
            types: ["MarksheetFront", "MarksheetBack"],
            perPage: 2,
            // Marksheet = A4 portrait → tall box
            maxW: 174, maxH: 115,
          },
          {
            title: "CV / Resume",
            types: ["CVPage1", "CVPage2"],
            perPage: 2,
            // CV = A4 portrait → tall box
            maxW: 174, maxH: 115,
          },
        ];

        const pageMarginX = 18;  // left margin
        const cardBorderW = 174; // full usable width

        // ✅ Y-slot positions for 2-per-page layout
        // Page header ends at ~24mm, so:
        //   Slot 1: label at 30, image at 38 → image box 100mm tall → ends at 138
        //   Slot 2: label at 148, image at 156 → image box 100mm tall → ends at 256
        const twoSlots = (maxH) => [
          { labelY: 30, imageY: 38 },
          { labelY: 38 + maxH + 18, imageY: 38 + maxH + 26 },
        ];

        // 1-per-page: vertically centered-ish
        const oneSlot = (maxH) => ({ labelY: 70, imageY: 80 });

        const toReadableLabel = (val) =>
          val
            ? val.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/([A-Z])([A-Z][a-z])/g, "$1 $2").trim()
            : "Document";

        for (const group of documentGroups) {
          const groupDocs = client.documents.filter((d) =>
            group.types.includes(d.documentType)
          );
          if (groupDocs.length === 0) continue;

          doc.addPage();
          currentPage++;

          // Page header bar
          doc.setFillColor(51, 65, 85);
          doc.rect(0, 0, 210, 24, "F");
          doc.setFontSize(14);
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.text(group.title, 105, 15, { align: "center" });

          const slots =
            group.perPage === 1
              ? [oneSlot(group.maxH)]
              : twoSlots(group.maxH);

          for (let i = 0; i < groupDocs.length; i++) {
            const docItem = groupDocs[i];
            const slot = slots[i] || slots[0];
            const { labelY, imageY } = slot;
            const imageX = pageMarginX + 2;

            // Document sub-label
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 41, 59);
            doc.text(toReadableLabel(docItem.documentType), pageMarginX, labelY);

            // ✅ Draw fixed-size border box first
            doc.setDrawColor(203, 213, 225);
            doc.setLineWidth(0.8);
            doc.rect(pageMarginX, imageY - 2, cardBorderW, group.maxH + 4);

            if (docItem.imageUrl) {
              // ✅ Image fits inside maxW × maxH, centered, aspect ratio safe
              const result = await addImageToPDF(
                docItem.imageUrl,
                imageX,
                imageY,
                group.maxW,
                group.maxH
              );

              if (!result.success) {
                doc.setFontSize(9);
                doc.setTextColor(148, 163, 184);
                doc.setFont("helvetica", "normal");
                doc.text(
                  "Document unavailable",
                  105,
                  imageY + group.maxH / 2,
                  { align: "center" }
                );
              }
            } else {
              doc.setFontSize(9);
              doc.setTextColor(148, 163, 184);
              doc.setFont("helvetica", "normal");
              doc.text(
                "No document captured",
                105,
                imageY + group.maxH / 2,
                { align: "center" }
              );
            }
          }
        }
      }

      // ─────────────────────────────────────────
      // FOOTER — every page
      // ─────────────────────────────────────────
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
          `Generated on ${new Date().toLocaleString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
          })}`,
          105, 290, { align: "center" }
        );
        doc.text(`Page ${i} of ${totalPages}`, 195, 290, { align: "right" });
        doc.setFontSize(7);
        doc.text(
          `Client: ${client.clientName || "N/A"} ${client.surname || ""}`,
          15, 290
        );
      }

      doc.save(`${client.clientName || "Client"}_Complete_Form.pdf`);
      toast.success(`📄 PDF Downloaded With ${client.documents?.length || 0} Documents!`);
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

  // ✅ Fixed: dob + age update in single setState call
  const handleInputChange = (field, value) => {
    if (field === "dob" && value) {
      const calculatedAge = calculateAgeFromDOB(value);
      setEditData((prev) => ({ ...prev, dob: value, age: calculatedAge }));
    } else {
      setEditData((prev) => ({ ...prev, [field]: value }));
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
          <p>Loading Client details...</p>
        </div>
      </>
    );
  }

  if (!client) {
    return (
      <>
        <Navbar />
        <div className="no-results">
          <p>Not found</p>
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
                        <label>Country</label>
                        <p>{client.country || "N/A"}</p>
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

                      <div className="info-item"><label>Applied For</label><p>{client.appliedFor || "N/A"}</p></div>
                      <div className="info-item"><label>Pre Work Experience</label><p>{client.preWorkExperience || "N/A"}</p></div>
                      <div className="info-item"><label>Consular Name</label><p>{client.consularName || "N/A"}</p></div>
                      <div className="info-item"><label>Family Members</label><p>{client.familyMembersCount || "0"}</p></div>
                      <div className="info-item full-width"><label>Address</label><p>{client.address || "N/A"}</p></div>
                    </div>
                  </div>

                  {/* ✅ GOVERNMENT SERVANT INFORMATION */}
                  <div className="info-section">
                    <h3 className="section-title">🏛️ Government Servant Information</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Family Member in Govt Service</label>
                        <p>{client.hasGovtServant || "N/A"}</p>
                      </div>

                      {client.hasGovtServant === "Yes" && (
                        <>
                          <div className="info-item">
                            <label>Relation</label>
                            <p>{client.govtServantRelation || "N/A"}</p>
                          </div>
                          <div className="info-item">
                            <label>Name</label>
                            <p>{client.govtServantName || "N/A"}</p>
                          </div>
                          <div className="info-item">
                            <label>Work Type</label>
                            <p>{client.govtServantWorkType || "N/A"}</p>
                          </div>
                          <div className="info-item">
                            <label>Designation</label>
                            <p>{client.govtServantDesignation || "N/A"}</p>
                          </div>
                          {/* <div className="info-item">
                            <label>Department</label>
                            <p>{client.govtServantDepartment || "N/A"}</p>
                          </div> */}
                        </>
                      )}
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
                      <label >Client Name</label>
                      <input
                        type="text"
                        value={editData.clientName || ""}
                        onChange={(e) => handleInputChange("clientName", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="optional">Surname</label>
                      <input
                        type="text"
                        value={editData.surname || ""}
                        onChange={(e) => handleInputChange("surname", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Contact number</label>
                      <input
                        type="text"
                        value={editData.contact || ""}
                        onChange={(e) => handleInputChange("contact", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="optional">Email</label>
                      <input
                        type="email"
                        value={editData.email || ""}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                      />
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
                      <label>Nationality</label>
                      <input
                        type="text"
                        value={editData.nationality || ""}
                        onChange={(e) => handleInputChange("nationality", e.target.value)}
                      />
                    </div>


                    {/* ✅ NEW FIELDS - EDIT */}
                    <div className="form-group">
                      <label className="optional">previous Country</label>
                      <input type="text" value={editData.country || ""} onChange={(e) => handleInputChange("country", e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="optional">Applied For</label>
                      <input type="text" placeholder="e.g. Malta Work Visa, Canada PR" value={editData.appliedFor || ""} onChange={(e) => handleInputChange("appliedFor", e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="optional">Pre Work Experience</label>
                      <input type="text" placeholder="Enter previous work experience" value={editData.preWorkExperience || ""} onChange={(e) => handleInputChange("preWorkExperience", e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="optional">Consular Name</label>
                      <input type="text" placeholder="Enter consular name" value={editData.consularName || ""} onChange={(e) => handleInputChange("consularName", e.target.value)} />
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
                      <label className="optional">Education</label>
                      <input
                        type="text"
                        value={editData.education || ""}
                        onChange={(e) => handleInputChange("education", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="optional">Occupation</label>
                      <input
                        type="text"
                        value={editData.occupation || ""}
                        onChange={(e) => handleInputChange("occupation", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="optional">Family Members</label>
                      <input
                        type="number"
                        value={editData.familyMembersCount || ""}
                        onChange={(e) => handleInputChange("familyMembersCount", e.target.value)}
                      />
                    </div>
                    <div className="form-group full-width">
                      <label className="optional">Address</label>
                      <textarea
                        value={editData.address || ""}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        rows="3"
                      />
                    </div>

                    {/* ✅ GOVERNMENT SERVANT INFORMATION - EDIT MODE */}
                    <h3 className="section-title" style={{ gridColumn: '1 / -1', marginTop: '20px' }}>🏛️ Government Servant Information</h3>

                    <div className="form-group">
                      <label>Family Member in Govt Service</label>
                      <select
                        value={editData.hasGovtServant || "No"}
                        onChange={(e) => handleInputChange("hasGovtServant", e.target.value)}
                      >
                        <option value="">Select Option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    {editData.hasGovtServant === "Yes" && (
                      <>
                        <div className="form-group">
                          <label>Relation</label>
                          <select
                            value={editData.govtServantRelation || ""}
                            onChange={(e) => handleInputChange("govtServantRelation", e.target.value)}
                          >
                            <option value="">Select Relation</option>
                            <option value="Father">Father</option>
                            <option value="Mother">Mother</option>
                            <option value="Spouse">Spouse (Husband/Wife)</option>
                            <option value="Brother">Brother</option>
                            <option value="Sister">Sister</option>
                            <option value="Son">Son</option>
                            <option value="Daughter">Daughter</option>
                            <option value="Uncle">Uncle</option>
                            <option value="Aunt">Aunt</option>
                            <option value="Grandfather">Grandfather</option>
                            <option value="Grandmother">Grandmother</option>
                            <option value="Other">Other Relative</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Name</label>
                          <input
                            type="text"
                            value={editData.govtServantName || ""}
                            onChange={(e) => handleInputChange("govtServantName", e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Work Type</label>
                          <select
                            value={editData.govtServantWorkType || ""}
                            onChange={(e) => handleInputChange("govtServantWorkType", e.target.value)}
                          >
                            <option value="">Select Work Type</option>
                            <option value="Central Government">Central Government</option>
                            <option value="State Government">State Government</option>
                            <option value="PSU (Public Sector Undertaking)">PSU (Public Sector Undertaking)</option>
                            <option value="Indian Army">Indian Army</option>
                            <option value="Indian Navy">Indian Navy</option>
                            <option value="Indian Air Force">Indian Air Force</option>
                            <option value="Police Department">Police Department</option>
                            <option value="Railway">Railway</option>
                            <option value="Banking Sector">Banking Sector (Government)</option>
                            <option value="Teaching (Government School/College)">Teaching (Government School/College)</option>
                            <option value="Medical (Government Hospital)">Medical (Government Hospital)</option>
                            <option value="Judiciary">Judiciary</option>
                            <option value="Municipal Corporation">Municipal Corporation</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Designation</label>
                          <input
                            type="text"
                            value={editData.govtServantDesignation || ""}
                            onChange={(e) => handleInputChange("govtServantDesignation", e.target.value)}
                          />
                        </div>
                        {/* <div className="form-group">
                          <label>Department</label>
                          <input
                            type="text"
                            value={editData.govtServantDepartment || ""}
                            onChange={(e) => handleInputChange("govtServantDepartment", e.target.value)}
                          />
                        </div> */}
                      </>
                    )}

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
                      <label className="optional">Driving License No</label>
                      <input
                        type="text"
                        value={editData.drivingLicenseNo || ""}
                        onChange={(e) => handleInputChange("drivingLicenseNo", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="optional">Voter Card No</label>
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
                      <label className="optional">Father Surname</label>
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
                      <label className="optional">Father Email</label>
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
                      <label className="optional">Mother Surname</label>
                      <input
                        type="text"
                        value={editData.motherSurname || ""}
                        onChange={(e) => handleInputChange("motherSurname", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="optional">Mother Phone</label>
                      <input
                        type="text"
                        value={editData.motherPhone || ""}
                        onChange={(e) => handleInputChange("motherPhone", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="optional">Mother Email</label>
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
                          <label className="optional">Spouse Name</label>
                          <input
                            type="text"
                            value={editData.spouseName || ""}
                            onChange={(e) => handleInputChange("spouseName", e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="optional">Spouse Surname</label>
                          <input
                            type="text"
                            value={editData.spouseSurname || ""}
                            onChange={(e) => handleInputChange("spouseSurname", e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="optional">Spouse Phone</label>
                          <input
                            type="text"
                            value={editData.spousePhone || ""}
                            onChange={(e) => handleInputChange("spousePhone", e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="optional">Spouse Email</label>
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
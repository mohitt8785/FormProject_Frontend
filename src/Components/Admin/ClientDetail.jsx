import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import jsPDF from "jspdf"; 
import Navbar from "../Navbar/Navbar.jsx";
import CameraInput from "./CameraInput.jsx";
import "./Admin.css";

const VITE_API_URL_FORM = import.meta.env.VITE_API_URL_FORM;
// const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;

const ClientDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [client, setClient] = useState(location.state?.client || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(!client);
  const [newPhotoPreview, setNewPhotoPreview] = useState(null);

  useEffect(() => {
    if (!client) fetchClientDetail();
  }, [id, client]);

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

  // ✅ PDF Download Function
  const handleDownloadPDF = async () => {
    try {
      const doc = new jsPDF("p", "mm", "a4");

      // ===== HEADER =====
      doc.setFillColor(102, 126, 234);
      doc.rect(0, 0, 210, 28, "F");

      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("GROWTH CLIENT INFORMATION FORM", 105, 18, { align: "center" });

      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.line(0, 30, 210, 30);

      // ===== PHOTO SECTION (RIGHT SIDE – BIG) =====
      const photoX = 120;
      const photoY = 40;
      const photoWidth = 70;
      const photoHeight = 90;

      if (client.photo) {
        try {
          const response = await fetch(client.photo);
          const blob = await response.blob();
          const reader = new FileReader();

          reader.onloadend = () => {
            doc.setDrawColor(102, 126, 234);
            doc.rect(photoX - 2, photoY - 2, photoWidth + 4, photoHeight + 4);
            doc.addImage(reader.result, "JPEG", photoX, photoY, photoWidth, photoHeight);
            generatePDFContent(doc);
          };

          reader.readAsDataURL(blob);
        } catch {
          generatePDFContent(doc);
        }
      } else {
        doc.setDrawColor(148, 163, 184);
        doc.rect(photoX, photoY, photoWidth, photoHeight);
        doc.setFontSize(12);
        doc.setTextColor(148, 163, 184);
        doc.text("No Photo", photoX + 22, photoY + 45);
        generatePDFContent(doc);
      }

    } catch (error) {
      console.error(error);
      toast.error("❌ PDF generation failed");
    }
  };

  const generatePDFContent = (doc) => {
    let y = 45;

    const labelX = 20;
    const valueX = 55;

    const addRow = (label, value) => {
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(label, labelX, y);

      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text(value || "N/A", valueX, y);

      y += 9;
    };

    // ===== LEFT FORM BORDER =====
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, 38, 95, 120);

    // ===== SECTION TITLE =====
    doc.setFontSize(14);
    doc.setTextColor(102, 126, 234);
    doc.setFont("helvetica", "bold");
    doc.text("Personal Details", 20, y);
    y += 10;

    doc.setFont("helvetica", "normal");

    addRow("Client Name", client.clientName);
    addRow("Father Name", client.fatherName);
    addRow("Father Phone", client.fatherPhone);
    addRow("Gender", client.gender);
    addRow(
      "DOB",
      client.dob ? new Date(client.dob).toLocaleDateString() : "N/A"
    );
    addRow("Age", client.age?.toString());
    addRow("Relationship", client.relationship);
    addRow("Occupation", client.occupation);

    y += 6;

    // ===== CONTACT DETAILS =====
    doc.setFontSize(14);
    doc.setTextColor(102, 126, 234);
    doc.setFont("helvetica", "bold");
    doc.text("Contact Details", 20, y);
    y += 10;

    doc.setFont("helvetica", "normal");

    addRow("Email", client.email);
    addRow("Phone", client.phone);
    addRow("Nationality", client.Nationality);
    addRow("Address", client.address);

    // ===== FOOTER =====
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 265, 190, 265);

    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Generated on ${new Date().toLocaleString()}`,
      105,
      272,
      { align: "center" }
    );

    doc.save(`${client.clientName}_Client_Form.pdf`);
    toast.success("📄 Professional PDF downloaded!");
  };


  const handleEditStart = () => {
    setEditData({ ...client });
    setNewPhotoPreview(null);
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
    setEditData({ ...editData, photo: file });

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);

    console.log("New photo captured:", file);
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);

      const form = new FormData();

      Object.keys(editData).forEach((key) => {
        if (
          key !== "photo" &&
          key !== "biometric" &&
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
        console.log("✅ Uploading NEW photo file");
      } else {
        console.log("⏭️ Keeping existing photo");
      }

      if (editData.biometric instanceof File) {
        form.append("biometric", editData.biometric);
      }

      const res = await axios.put(`${VITE_API_URL_FORM}/${id}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setClient(res.data.client);
      setIsEditing(false);
      setNewPhotoPreview(null);
      toast.success("✅ Client updated successfully");

      // Remove this call to prevent duplicate toasts or unnecessary re-fetch
      // fetchClientDetail();
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
              <h2>👤 Client Details</h2>
              <p>{client.clientName}</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {/* ✅ PDF Download Button */}
              <button
                onClick={handleDownloadPDF}
                className="btn-action edit"
                style={{ background: 'linear-gradient(135deg, #4582d2 0%, #e0e7ff 100%)', color: 'white' }}
              >
                📄 Download PDF
              </button>
              <button
                onClick={() => navigate("/admin")}
                className="btn-action edit"
              >
                ← Back
              </button>
            </div>
          </div>

          <div className="client-detail-container">
            {/* Photo Section - LEFT SIDE */}
            <div className="detail-photo-section">
              {!isEditing ? (
                photoUrl ? (
                  <div>
                    <h4
                      style={{
                        marginBottom: "10px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Client Photo
                    </h4>
                    <img
                      src={photoUrl}
                      alt={client.clientName}
                      className="client-photo"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        e.target.src =
                          'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect fill="%23ddd" width="300" height="300"/><text x="50%" y="50%" text-anchor="middle" fill="%23999">No Photo</text></svg>';
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "300px",
                      background: "var(--bg-primary)",
                      borderRadius: "var(--border-radius-lg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-secondary)",
                    }}
                  >
                    No Photo Available
                  </div>
                )
              ) : (
                <div>
                  <h4
                    style={{
                      marginBottom: "10px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {newPhotoPreview ? "New Photo Preview" : "Current Photo"}
                  </h4>
                  <img
                    src={
                      newPhotoPreview ||
                      photoUrl ||
                      "https://via.placeholder.com/300?text=No+Photo"
                    }
                    alt="Preview"
                    className="client-photo"
                    style={{
                      border: newPhotoPreview
                        ? "3px solid #667eea"
                        : "3px solid var(--border-color)",
                    }}
                  />
                  {newPhotoPreview && (
                    <p
                      style={{
                        marginTop: "10px",
                        color: "#667eea",
                        fontSize: "14px",
                        fontWeight: "600",
                        textAlign: "center",
                      }}
                    >
                      ✓ New photo captured
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Information Section - RIGHT SIDE */}
            <div className="detail-info-section">
              {!isEditing ? (
                <>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Client Name</label>
                      <p>{client.clientName}</p>
                    </div>
                    <div className="info-item">
                      <label>Father Name</label>
                      <p>{client.fatherName}</p>
                    </div>
                    <div className="info-item">
                      <label>Father Phone</label>
                      <p>{client.fatherPhone}</p>
                    </div>
                    <div className="info-item">
                      <label>Email</label>
                      <p>{client.email}</p>
                    </div>
                    <div className="info-item">
                      <label>Phone</label>
                      <p>{client.phone}</p>
                    </div>
                    <div className="info-item">
                      <label>Nationality</label>
                      <p>{client.Nationality}</p>
                    </div>
                    <div className="info-item">
                      <label>Gender</label>
                      <p>{client.gender}</p>
                    </div>
                    <div className="info-item">
                      <label>Date of Birth</label>
                      <p>{client.dob ? new Date(client.dob).toLocaleDateString() : "Not provided"}</p>
                    </div>
                    <div className="info-item">
                      <label>Age</label>
                      <p>{client.age}</p>
                    </div>
                    <div className="info-item">
                      <label>Relationship</label>
                      <p>{client.relationship}</p>
                    </div>
                    <div className="info-item">
                      <label>Occupation</label>
                      <p>{client.occupation}</p>
                    </div>
                    <div className="info-item">
                      <label>Address</label>
                      <p>{client.address}</p>
                    </div>
                  </div>

                  <div className="detail-actions">
                    <button className="btn btn-edit" onClick={handleEditStart}>
                      ✏️ Edit
                    </button>
                    <button className="btn btn-delete" onClick={handleDelete}>
                      🗑️ Delete
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="form-grid">
                    {/* Edit form fields - updated to match Form.jsx */}
                    <div className="form-group">
                      <label>Client Name</label>
                      <input
                        type="text"
                        value={editData.clientName}
                        onChange={(e) =>
                          handleInputChange("clientName", e.target.value)
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Father Name</label>
                      <input
                        type="text"
                        value={editData.fatherName}
                        onChange={(e) =>
                          handleInputChange("fatherName", e.target.value)
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Father Phone</label>
                      <input
                        type="text"
                        value={editData.fatherPhone}
                        onChange={(e) =>
                          handleInputChange("fatherPhone", e.target.value)
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={editData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        type="text"
                        value={editData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Nationality</label>
                      <input
                        type="text"
                        value={editData.Nationality}
                        onChange={(e) =>
                          handleInputChange("Nationality", e.target.value)
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Gender</label>
                      <select
                        value={editData.gender}
                        onChange={(e) =>
                          handleInputChange("gender", e.target.value)
                        }
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Date of Birth</label>
                      <input
                        type="date"
                        value={editData.dob ? new Date(editData.dob).toISOString().split('T')[0] : ''}
                        onChange={(e) =>
                          handleInputChange("dob", e.target.value)
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Age</label>
                      <input
                        type="number"
                        value={editData.age}
                        onChange={(e) =>
                          handleInputChange("age", e.target.value)
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Relationship</label>
                      <select
                        value={editData.relationship}
                        onChange={(e) =>
                          handleInputChange("relationship", e.target.value)
                        }
                      >
                        <option value="">Select</option>
                        <option value="Married">Married</option>
                        <option value="Unmarried">Unmarried</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Occupation</label>
                      <input
                        type="text"
                        value={editData.occupation}
                        onChange={(e) =>
                          handleInputChange("occupation", e.target.value)
                        }
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Address</label>
                      <textarea
                        value={editData.address}
                        onChange={(e) =>
                          handleInputChange("address", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: "20px" }}>
                    <CameraInput
                      label="Capture New Photo"
                      name="photo"
                      setFile={handleNewPhotoCapture}
                    />
                  </div>

                  <div className="detail-actions">
                    <button
                      className="btn btn-delete"
                      onClick={() => {
                        setIsEditing(false);
                        setNewPhotoPreview(null);
                      }}
                    >
                      ✕ Cancel
                    </button>
                    <button
                      className="btn btn-edit"
                      onClick={handleSaveEdit}
                      disabled={loading}
                    >
                      {loading ? "Saving..." : "💾 Save"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientDetail;
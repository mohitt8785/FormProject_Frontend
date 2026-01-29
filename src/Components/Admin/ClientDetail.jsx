import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import jsPDF from "jspdf"; // ✅ Import jsPDF
import Navbar from "../Navbar/Navbar.jsx";
import CameraInput from "./CameraInput.jsx";
import "./Admin.css";

const VITE_API_URL_FORM = import.meta.env.VITE_API_URL_FORM;
const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;

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
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.setTextColor(102, 126, 234);
      doc.text("CLIENT INFORMATION", 105, 20, { align: "center" });
      
      // Line
      doc.setDrawColor(102, 126, 234);
      doc.setLineWidth(0.5);
      doc.line(20, 25, 190, 25);
      
      // Photo (if available)
      const photoUrl = client.photo;
      if (photoUrl) {
        try {
          // Convert photo to base64
          const response = await fetch(photoUrl);
          const blob = await response.blob();
          const reader = new FileReader();
          
          reader.onloadend = () => {
            const base64data = reader.result;
            doc.addImage(base64data, 'JPEG', 150, 35, 40, 40);
            generatePDFContent(doc);
          };
          reader.readAsDataURL(blob);
        } catch (error) {
          console.error("Error loading photo:", error);
          generatePDFContent(doc);
        }
      } else {
        generatePDFContent(doc);
      }
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const generatePDFContent = (doc) => {
    let yPos = 40;
    
    // Helper function to add field
    const addField = (label, value) => {
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(label + ":", 20, yPos);
      
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text(value || "N/A", 70, yPos);
      
      yPos += 10;
    };
    
    // Personal Information
    doc.setFontSize(14);
    doc.setTextColor(102, 126, 234);
    doc.text("Personal Details", 20, yPos);
    yPos += 8;
    
    addField("Client Name", client.clientName);
    addField("Father Name", client.fatherName);
    addField("Gender", client.gender);
    addField("Date of Birth", client.dob || "Not provided");
    addField("Age", client.age?.toString());
    
    yPos += 5;
    
    // Contact Information
    doc.setFontSize(14);
    doc.setTextColor(102, 126, 234);
    doc.text("Contact Details", 20, yPos);
    yPos += 8;
    
    addField("Email", client.email);
    addField("Phone", client.phone);
    addField("Address", client.address);
    addField("Country", client.country);
    
    yPos += 5;
    
    // Family Information
    doc.setFontSize(14);
    doc.setTextColor(102, 126, 234);
    doc.text("Family Details", 20, yPos);
    yPos += 8;
    
    addField("Family Members", client.familyMembers?.toString() || "Not provided");
    
    // Footer
    yPos += 10;
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, yPos, { align: "center" });
    
    // Save PDF
    doc.save(`${client.clientName}_Details.pdf`);
    toast.success("PDF downloaded successfully! ✅");
  };

  const handleEditStart = () => {
    setEditData({ ...client });
    setNewPhotoPreview(null);
    setIsEditing(true);
  };

  const handleInputChange = (field, value) => {
    setEditData({
      ...editData,
      [field]: value,
    });
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

      fetchClientDetail();
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
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}
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
                      <label>Email</label>
                      <p>{client.email}</p>
                    </div>
                    <div className="info-item">
                      <label>Phone</label>
                      <p>{client.phone}</p>
                    </div>
                    <div className="info-item">
                      <label>Country</label>
                      <p>{client.country}</p>
                    </div>
                    <div className="info-item">
                      <label>Gender</label>
                      <p>{client.gender}</p>
                    </div>
                    <div className="info-item">
                      <label>Date of Birth</label>
                      <p>{client.dob || "Not provided"}</p>
                    </div>
                    <div className="info-item">
                      <label>Age</label>
                      <p>{client.age}</p>
                    </div>
                    <div className="info-item">
                      <label>Address</label>
                      <p>{client.address}</p>
                    </div>
                    <div className="info-item">
                      <label>Family Members</label>
                      <p>{client.familyMembers || "Not provided"}</p>
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
                    {/* Edit form fields - same as before */}
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
                      <label>Country</label>
                      <input
                        type="text"
                        value={editData.country}
                        onChange={(e) =>
                          handleInputChange("country", e.target.value)
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
                        value={editData.dob}
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
                      <label>Address</label>
                      <textarea
                        value={editData.address}
                        onChange={(e) =>
                          handleInputChange("address", e.target.value)
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Family Members</label>
                      <input
                        type="number"
                        value={editData.familyMembers}
                        onChange={(e) =>
                          handleInputChange("familyMembers", e.target.value)
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
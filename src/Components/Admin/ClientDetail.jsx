import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
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

  // ✅ Camera se naya photo capture karne ke liye
  const handleNewPhotoCapture = (file) => {
    setEditData({ ...editData, photo: file });

    // Preview create karo
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

      // ✅ Only non-file fields append karo
      Object.keys(editData).forEach((key) => {
        // Skip photo, biometric, aur MongoDB fields
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

      // ✅ Photo separately handle karo
      if (editData.photo instanceof File) {
        // Naya photo uploaded hai
        form.append("photo", editData.photo);
        console.log("✅ Uploading NEW photo file");
      } else {
        // Purana photo hai - DON'T append (backend pe already hai)
        console.log("⏭️ Keeping existing photo");
      }

      // Optional: Biometric
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

      // Refresh to show updated data
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

  // const photoUrl = client.photo
  //   ? `${VITE_BASE_URL}/${client.photo.replace(/\\/g, "/")}`
  //   : null;

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
            <button
              onClick={() => navigate("/admin")}
              className="btn-action edit"
            >
              ← Back
            </button>
          </div>

          <div className="client-detail-container">
            {/* Photo Section - LEFT SIDE */}
            <div className="detail-photo-section">
              {!isEditing ? (
                // View Mode
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
                // Edit Mode - Show preview
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

                  {/* ✅ Camera Input for capturing new photo */}
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
                      {loading ? "Saving form..." : "💾 Save"}
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

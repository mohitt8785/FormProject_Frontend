import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Navbar from "../Components/Navbar/Navbar.jsx";
import CameraInput from "../Components/Admin/CameraInput.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

import "./Styles/Form.css";

const VITE_API_URL_FORM = import.meta.env.VITE_API_URL_FORM;

const FormContent = () => {
  const [formData, setFormData] = useState({
    clientName: "",
    fatherName: "",
    gender: "",
    dob: "",
    age: "",
    phone: "",
    email: "",
    address: "",
    Nationality: "",
    familyMembers: "",
    occupation: "",
    photo: null,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Supported file types for photo
  const SUPPORTED_IMAGE_TYPES = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'image/gif', 'image/bmp', 'image/tiff'
  ];

  // Calculate age from DOB
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

  // INPUT CHANGE
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    const updatedValue = files ? files[0] : value;

    // Special handling for DOB to auto-calculate age
    if (name === 'dob' && value) {
      const calculatedAge = calculateAgeFromDOB(value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        age: calculatedAge || prev.age
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: updatedValue,
      }));
    }

    // Clear error for this field
    setErrors(prev => ({ ...prev, [name]: "" }));

    // Real-time validation for specific fields
    if (name === 'email' && updatedValue) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(updatedValue.trim())) {
        setErrors(prev => ({ ...prev, email: "Invalid email format" }));
      }
    }

    if (name === 'phone' && updatedValue) {
      const digitsOnly = updatedValue.replace(/\D/g, '');
      if (digitsOnly.length > 0 && digitsOnly.length !== 10) {
        setErrors(prev => ({ ...prev, phone: "Must be 10 digits" }));
      }
    }

    if (name === 'fatherPhone' && updatedValue) {
      const digitsOnly = updatedValue.replace(/\D/g, '');
      if (digitsOnly.length > 0 && digitsOnly.length !== 10) {
        setErrors(prev => ({ ...prev, fatherPhone: "Must be 10 digits" }));
      }
    }

    if (name === 'age' && updatedValue) {
      const ageNum = parseInt(updatedValue);
      if (ageNum < 1 || ageNum > 150) {
        setErrors(prev => ({ ...prev, age: "Age must be between 1-150" }));
      }
    }

    // Validate photo file
    if (name === 'photo' && files && files[0]) {
      const file = files[0];

      // Check file type
      if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
        setErrors(prev => ({ ...prev, photo: "Photo must be an image (JPEG, PNG, GIF, BMP, TIFF, WEBP)" }));
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, photo: "Photo size must be less than 5MB" }));
      }
    }
  };

  // PHONE INPUT WITH FORMATTING for fatherPhone
  const handleFatherPhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '').substring(0, 10);

    const rawDigits = value;

    // Auto-format display
    if (value.length > 6) {
      value = value.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    } else if (value.length > 3) {
      value = value.replace(/(\d{3})(\d{1,3})/, '$1-$2');
    }

    setFormData(prev => ({ ...prev, fatherPhone: rawDigits }));
    setErrors(prev => ({ ...prev, fatherPhone: "" }));

    if (rawDigits.length > 0 && rawDigits.length !== 10) {
      setErrors(prev => ({ ...prev, fatherPhone: "Must be 10 digits" }));
    } else if (rawDigits.length === 10 && !/^[6-9]/.test(rawDigits)) {
      setErrors(prev => ({ ...prev, fatherPhone: "Should start with 6-9" }));
    }
  };

  // PHONE INPUT WITH FORMATTING for phone
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '').substring(0, 10);

    const rawDigits = value;

    // Auto-format display
    if (value.length > 6) {
      value = value.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    } else if (value.length > 3) {
      value = value.replace(/(\d{3})(\d{1,3})/, '$1-$2');
    }

    setFormData(prev => ({ ...prev, phone: rawDigits }));
    setErrors(prev => ({ ...prev, phone: "" }));

    if (rawDigits.length > 0 && rawDigits.length !== 10) {
      setErrors(prev => ({ ...prev, phone: "Must be 10 digits" }));
    } else if (rawDigits.length === 10 && !/^[6-9]/.test(rawDigits)) {
      setErrors(prev => ({ ...prev, phone: "Should start with 6-9" }));
    }
  };

  // VALIDATION
  const validateForm = () => {
    const newErrors = {};

    // Client Name
    if (!formData.clientName.trim()) {
      newErrors.clientName = "Client name is required";
    } else if (formData.clientName.trim().length < 2) {
      newErrors.clientName = "Name must be at least 2 characters";
    }

    // Father Name
    if (!formData.fatherName.trim()) {
      newErrors.fatherName = "Father name is required";
    } else if (formData.fatherName.trim().length < 2) {
      newErrors.fatherName = "Father name must be at least 2 characters";
    }

    // Gender
    if (!formData.gender) {
      newErrors.gender = "Please select gender";
    }

    // Date of Birth
    if (formData.dob) {
      const dobDate = new Date(formData.dob);
      const today = new Date();

      if (dobDate > today) {
        newErrors.dob = "Date of birth cannot be in the future";
      }
    }

    // Age
    if (!formData.age || Number(formData.age) < 1 || Number(formData.age) > 150) {
      newErrors.age = "Please enter a valid age (1-150)";
    }

    // Phone
    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone must be exactly 10 digits";
    }

    // Email
    if (formData.email.trim()) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    // Address
    if (formData.address.trim() && formData.address.trim().length < 4) {
      newErrors.address = "Address should be more detailed";
    }

    // Nationality
    if (!formData.Nationality.trim()) {
      newErrors.Nationality = "Nationality is required";
    }

    // Family Members (optional but validate if provided)
    if (formData.familyMembers !== "") {
      const familyNum = parseInt(formData.familyMembers);
      if (isNaN(familyNum) || familyNum < 0 || familyNum > 50) {
        newErrors.familyMembers = "Please enter a reasonable number (0-50)";
      }
    }

    // Occupation (optional)
    // No validation for occupation as it's optional

    // Photo
    if (!formData.photo) {
      newErrors.photo = "Photo is required";
    } else if (formData.photo instanceof File) {
      if (!SUPPORTED_IMAGE_TYPES.includes(formData.photo.type)) {
        newErrors.photo = "Photo must be an image (JPEG, PNG, GIF, BMP, TIFF, WEBP)";
      }

      if (formData.photo.size > 5 * 1024 * 1024) {
        newErrors.photo = "Photo size must be less than 5MB";
      }
    }

    return newErrors;
  };

  // SUBMIT FORM
  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstError = Object.values(newErrors)[0];
      toast.error(`Please fix: ${firstError}`);
      return;
    }

    try {
      setLoading(true);
      toast.info("Saving client information...");

      const form = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== "") {
          form.append(key, formData[key]);
        }
      });

      const response = await axios.post(VITE_API_URL_FORM, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });

      if (response.data.success) {
        toast.success("✅ Client information saved successfully!");

        // Reset form
        setFormData({
          clientName: "",
          fatherName: "",
          gender: "",
          dob: "",
          age: "",
          phone: "",
          email: "",
          address: "",
          Nationality: "",
          familyMembers: "",
          occupation: "",
          photo: null,
        });

        setErrors({});

        // Clear file input
        document.querySelectorAll('input[type="file"]').forEach(input => input.value = '');
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.response?.data?.message || "Failed to save client information ❌");
    } finally {
      setLoading(false);
    }
  };

  // Format phone for display
  const displayPhone = formData.phone ?
    formData.phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3') :
    '';

  const displayFatherPhone = formData.fatherPhone ?
    formData.fatherPhone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3') :
    '';

  return (
    <>
      <Navbar />
      <div className="form-wrapper">
        <div className="form-container">
          <div className="form-header">
            <h2>📋 Client Information Form</h2>
            <p>Please fill all required fields (*)</p>
          </div>

          <form onSubmit={handleSubmit} className="form" noValidate>
            <div className="form-section">
              <h3 className="section-title">Personal Information</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Client Name *</label>
                  <input
                    type="text"
                    name="clientName"
                    placeholder="Enter client full name"
                    value={formData.clientName}
                    onChange={handleChange}
                    className={errors.clientName ? "input-error" : ""}
                  />
                  {errors.clientName && <p className="error">{errors.clientName}</p>}
                </div>

                <div className="form-group">
                  <label>Father Name *</label>
                  <input
                    type="text"
                    name="fatherName"
                    placeholder="Enter father's name"
                    value={formData.fatherName}
                    onChange={handleChange}
                    className={errors.fatherName ? "input-error" : ""}
                  />
                  {errors.fatherName && <p className="error">{errors.fatherName}</p>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Father Phone Number *</label>
                  <input
                    type="text"
                    name="fatherPhone"
                    placeholder="Enter father's phone number"
                    value={displayFatherPhone}
                    maxLength="12"
                    onChange={handleFatherPhoneChange}
                    className={errors.fatherPhone ? "input-error" : ""}
                  />
                  <small className="hint">Format: XXX-XXX-XXXX</small>
                  {errors.fatherPhone && <p className="error">{errors.fatherPhone}</p>}
                </div>

                <div className="form-group">
                  <label>Relationship *</label>
                  <select
                    name="relationship"
                    value={formData.relationship}
                    onChange={handleChange}
                    className={errors.relationship ? "input-error" : ""}
                  >
                    <option value="">Select relationship</option>
                    <option value="Married">Married</option>
                    <option value="Unmarried">Unmarried</option>
                  </select>
                  {errors.relationship && <p className="error">{errors.relationship}</p>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={errors.gender ? "input-error" : ""}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && <p className="error">{errors.gender}</p>}
                </div>

                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    className={errors.dob ? "input-error" : ""}
                  />
                  {errors.dob && <p className="error">{errors.dob}</p>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Age *</label>
                  <input
                    type="number"
                    name="age"
                    min="1"
                    max="150"
                    placeholder="Enter age"
                    value={formData.age}
                    onChange={handleChange}
                    className={errors.age ? "input-error" : ""}
                  />
                  <small className="hint">Will auto-calculate from DOB</small>
                  {errors.age && <p className="error">{errors.age}</p>}
                </div>

                <div className="form-group">
                  <label className="optional">Family Members</label>
                  <input
                    type="number"
                    name="familyMembers"
                    min="0"
                    max="50"
                    placeholder="Number of family members"
                    value={formData.familyMembers}
                    onChange={handleChange}
                    className={errors.familyMembers ? "input-error" : ""}
                  />
                  {errors.familyMembers && <p className="error">{errors.familyMembers}</p>}
                </div>

                <div className="form-group">
                  <label className="optional">Occupation</label>
                  <input
                    type="text"
                    name="occupation"
                    placeholder="Enter occupation (optional)"
                    value={formData.occupation}
                    onChange={handleChange}
                    className={errors.occupation ? "input-error" : ""}
                  />
                  {errors.occupation && <p className="error">{errors.occupation}</p>}
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-title">Contact Information</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="Enter 10 digit phone number"
                    value={displayPhone}
                    maxLength="12"
                    onChange={handlePhoneChange}
                    className={errors.phone ? "input-error" : ""}
                  />
                  <small className="hint">Format: XXX-XXX-XXXX</small>
                  {errors.phone && <p className="error">{errors.phone}</p>}
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? "input-error" : ""}
                  />
                  {errors.email && <p className="error">{errors.email}</p>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label>Address *</label>
                  <textarea
                    name="address"
                    placeholder="Enter complete address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                    className={errors.address ? "input-error" : ""}
                  />
                  {errors.address && <p className="error">{errors.address}</p>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nationality *</label>
                  <input
                    type="text"
                    name="Nationality"
                    placeholder="Enter Nationality"
                    value={formData.Nationality}
                    onChange={handleChange}
                    className={errors.Nationality ? "input-error" : ""}
                  />
                  {errors.Nationality && <p className="error">{errors.Nationality}</p>}
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-title">Photo</h3>

              <CameraInput
                label="Live Photo *"
                name="photo"
                error={errors.photo}
                setFile={(file) => {
                  setFormData(prev => ({ ...prev, photo: file }));
                  setErrors(prev => ({ ...prev, photo: "" }));
                }}
                accept="image/*"
              />
              <small className="hint">Max 5MB, Supported: JPEG, PNG, GIF, BMP, TIFF, WEBP</small>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className={`submit-btn ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Saving...
                  </>
                ) : (
                  "✅ Save Client Information"
                )}
              </button>

              <button
                type="button"
                className="clear-btn"
                onClick={() => {
                  setFormData({
                    clientName: "",
                    fatherName: "",
                    gender: "",
                    dob: "",
                    age: "",
                    phone: "",
                    email: "",
                    address: "",
                    Nationality: "",
                    familyMembers: "",
                    occupation: "",
                    photo: null,
                  });
                  setErrors({});
                  toast.info("Form cleared");
                }}
              >
                Clear Form
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

const Form = () => {
  return <ProtectedRoute>{<FormContent />}</ProtectedRoute>;
};

export default Form;
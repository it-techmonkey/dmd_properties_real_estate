import sql from "../../lib/db";
import { initializeDatabase } from "./migrations/init";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await initializeDatabase();

    const {
      name,
      phone,
      email,
      subject,
      event,
      message,
      property_id,
      project_name,
      type,
      price,
      job_title,
      employer,
      property_interests,
      nationality,
      date_of_birth,
      home_address,
      notes,
      client_folder_link,
    } = req.body;

    // Check for required fields
    const missingFields = [];
    if (!name || !name.trim()) missingFields.push("Name");

    if (missingFields.length > 0) {
      return res
        .status(400)
        .json({ error: `Please fill in: ${missingFields.join(", ")}` });
    }

    // Validate phone
    if (phone) {
      const cleanPhone = phone.replace(/\s/g, "");
      const phoneRegex = /^[+]?[\d\s()-]{7,20}$/;
      if (!phoneRegex.test(cleanPhone)) {
        return res
          .status(400)
          .json({ error: "Please enter a valid phone number" });
      }
    }

    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res
          .status(400)
          .json({ error: "Please enter a valid email address" });
      }
    }

    // Determine enquiry message and subject
    let enquiryMessage = "";
    let enquirySubject = "";

    if (subject && message) {
      // General enquiry from contact form
      enquiryMessage = message;
      enquirySubject = subject;
    } else if (project_name || type || price) {
      // Property enquiry
      enquiryMessage = `Property: ${project_name || "N/A"}, Type: ${
        type || "N/A"
      }, Budget: ${price || "N/A"}`;
      enquirySubject = "Property Enquiry";
    } else {
      enquirySubject = "General Enquiry";
      enquiryMessage = "No additional details provided";
    }

    // Insert into unified general_enquiries with client fields
    const namesParsed = name.trim().split(" ");
    const firstName = namesParsed[0] || "";
    const lastName = namesParsed.slice(1).join(" ") || "";

    const enquiryResult = await sql`
      INSERT INTO general_enquiries (
        first_name, last_name, email, phone, subject, event, message,
        job_title, employer, property_interests, notes, client_folder_link,
        nationality, date_of_birth, home_address, status
      )
      VALUES (
        ${firstName || null},
        ${lastName || null},
        ${email || null},
        ${phone || null},
        ${enquirySubject},
        ${event || null},
        ${enquiryMessage},
        ${job_title || null},
        ${employer || null},
        ${property_interests || project_name || null},
        ${notes || null},
        ${client_folder_link || null},
        ${nationality || null},
        ${date_of_birth || null},
        ${home_address || null},
        'HOT'
      )
      RETURNING id
    `;

    // Using unified general_enquiries only; no clients table writes

    res.status(201).json({
      success: true,
      enquiryId: enquiryResult[0]?.id,
    });
  } catch (error) {
    console.error("Enquiry submission error:", error);
    res
      .status(500)
      .json({ error: "Failed to submit enquiry", details: error.message });
  }
}

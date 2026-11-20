require("dotenv").config();
const { Resend } = require("resend");

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const fromEmail = process.env.FROM_EMAIL || "FoodLink <notifications@apexinterview.in>";

const DEFAULT_APP_URL = "https://foodlink-version-03.vercel.app";

const appUrl = (
    process.env.APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
    DEFAULT_APP_URL
).replace(/\/$/, "");

// ─── Core Mailer ───────────────────────────────────────────────────────────────
async function sendMail({ to, subject, html }) {
    const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
    if (recipients.length === 0) {
        console.warn("[FoodLink Email] No valid recipients — skipping.");
        return { success: false, error: "No recipients" };
    }

    if (!resend) {
        console.log("[FoodLink Email - DRY RUN]");
        console.log("  To:", recipients.join(", "));
        console.log("  Subject:", subject);
        return { success: false, mock: true };
    }

    try {
        const { data, error } = await resend.emails.send({ from: fromEmail, to: recipients, subject, html });
        if (error) {
            console.error("[FoodLink Email Error]:", error);
            return { success: false, error: error.message };
        }
        console.log(`[FoodLink Email Sent] To: ${recipients.join(", ")} | ${subject}`);
        return { success: true, id: data.id };
    } catch (err) {
        console.error("[FoodLink Email Exception]:", err.message);
        return { success: false, error: err.message };
    }
}

// ─── Shared Layout ─────────────────────────────────────────────────────────────
function layout({ headerColor = "#1a7a3c", headerLabel, title, preheader, body, ctaText, ctaUrl }) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">

<!-- Preheader -->
<div style="display:none;font-size:1px;color:#f4f4f5;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader || title}</div>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;">
  <tr>
    <td align="center" style="padding:32px 16px;">

      <!-- Outer Card -->
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:6px;border:1px solid #e0e0e0;overflow:hidden;">

        <!-- Top bar -->
        <tr>
          <td style="background:${headerColor};height:5px;font-size:0;line-height:0;">&nbsp;</td>
        </tr>

        <!-- Logo / Brand row -->
        <tr>
          <td style="padding:28px 36px 20px;border-bottom:1px solid #eeeeee;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <span style="font-size:22px;font-weight:800;color:#1a7a3c;letter-spacing:-0.5px;">Food</span><span style="font-size:22px;font-weight:800;color:#374151;letter-spacing:-0.5px;">Link</span>
                  <span style="display:block;font-size:11px;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;margin-top:1px;">Surplus Food Sharing Platform &nbsp;|&nbsp; PSG Tech</span>
                </td>
                <td align="right">
                  <span style="font-size:11px;color:#9ca3af;">${new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" })}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Header Label + Title -->
        <tr>
          <td style="padding:28px 36px 0;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${headerColor};letter-spacing:2px;text-transform:uppercase;">${headerLabel}</p>
            <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#111827;line-height:1.3;">${title}</h1>
            <hr style="border:none;border-top:1px solid #eeeeee;margin:0 0 24px;">
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:0 36px 24px;color:#374151;font-size:15px;line-height:1.75;">
            ${body}
          </td>
        </tr>

        <!-- CTA Button -->
        ${ctaText && ctaUrl ? `
        <tr>
          <td align="center" style="padding:4px 36px 32px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background:${headerColor};border-radius:4px;">
                  <a href="${ctaUrl}" style="display:inline-block;padding:13px 30px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.4px;">${ctaText}</a>
                </td>
              </tr>
            </table>
            <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">Or paste this link in your browser:<br><span style="color:#1a7a3c;">${ctaUrl}</span></p>
          </td>
        </tr>` : ""}

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #eeeeee;padding:20px 36px;border-radius:0 0 6px 6px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-size:12px;color:#9ca3af;line-height:1.6;">
                  This is an automated message from <strong style="color:#6b7280;">FoodLink</strong>. Please do not reply to this email.<br>
                  &copy; ${new Date().getFullYear()} FoodLink &mdash; PSG College of Technology, Coimbatore.
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

// ─── Detail Table Helper ───────────────────────────────────────────────────────
function detailTable(rows) {
    const rowsHtml = rows.map(([label, value], i) => `
    <tr>
      <td style="padding:10px 14px;font-size:13px;font-weight:600;color:#6b7280;width:36%;background:${i % 2 === 0 ? "#f9fafb" : "#ffffff"};border-bottom:1px solid #f0f0f0;vertical-align:top;">${label}</td>
      <td style="padding:10px 14px;font-size:13px;color:#111827;background:${i % 2 === 0 ? "#f9fafb" : "#ffffff"};border-bottom:1px solid #f0f0f0;vertical-align:top;">${value}</td>
    </tr>`).join("");

    return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:5px;overflow:hidden;margin:16px 0;">
      ${rowsHtml}
    </table>`;
}

// ─── Alert Box Helper ──────────────────────────────────────────────────────────
function alertBox(text, { bg = "#fffbeb", border = "#f59e0b", color = "#92400e" } = {}) {
    return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">
      <tr>
        <td style="background:${bg};border-left:4px solid ${border};border-radius:0 4px 4px 0;padding:12px 16px;font-size:13px;color:${color};line-height:1.6;">
          ${text}
        </td>
      </tr>
    </table>`;
}

// ─── Status Pill Helper ────────────────────────────────────────────────────────
function pill(text, bg) {
    return `<span style="display:inline-block;background:${bg};color:#ffffff;padding:2px 10px;border-radius:3px;font-size:12px;font-weight:700;letter-spacing:0.5px;">${text}</span>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION 1 — Admin: New donation request submitted
// ═══════════════════════════════════════════════════════════════════════════════
async function notifyAdminNewDonation(food, adminEmails) {
    if (!adminEmails || adminEmails.length === 0) return;

    const expires = new Date(food.expires).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
    const submittedAt = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
    });

    const body = `
    <p style="margin:0 0 18px;">Dear Administrator,</p>
    <p style="margin:0 0 18px;">A new surplus food donation request has been submitted on the FoodLink platform and is pending your review. Please assign a food safety inspector to verify this listing before it expires.</p>

    ${alertBox(`<strong>Action Required:</strong> This listing will expire on <strong>${expires}</strong>. Please assign an inspector promptly to ensure timely inspection.`, { bg: "#fef3c7", border: "#d97706", color: "#78350f" })}

    <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:1px;">Donation Details</p>
    ${detailTable([
        ["Food Item", `<strong>${food.name}</strong>`],
        ["Type", `${food.veg ? pill("VEG", "#16a34a") : pill("NON-VEG", "#dc2626")}&nbsp;&nbsp;${food.nature}`],
        ["Servings", `<strong>${food.servings} meals</strong>`],
        ["Donor Name", food.donor || "—"],
        ["Donor Contact", food.phone ? `<a href="tel:${food.phone}" style="color:#1a7a3c;font-weight:600;">${food.phone}</a>` : "—"],
        ["Pickup Address", `<strong>${food.address}</strong>`],
        ["Expires At", `<span style="color:#dc2626;font-weight:600;">${expires}</span>`],
        ["Submitted At", submittedAt]
    ])}

    <p style="margin:18px 0 6px;font-size:13px;color:#6b7280;">Log in to the Admin Dashboard to review this listing and assign either <strong>Agilesh</strong> or <strong>Haresh</strong> for field inspection.</p>`;

    return await sendMail({
        to: adminEmails,
        subject: `Action Required: New Food Donation — ${food.name}, ${food.servings} servings at ${food.address}`,
        html: layout({
            headerColor: "#1a7a3c",
            headerLabel: "Admin Notification",
            title: "New Donation Request Submitted",
            preheader: `${food.donor || "A donor"} has submitted ${food.servings} servings of ${food.name} for inspection.`,
            body,
            ctaText: "Review & Assign Inspector",
            ctaUrl: `${appUrl}/admin.html`
        })
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION 2 — Inspector: Assigned a food to inspect by Admin
// ═══════════════════════════════════════════════════════════════════════════════
async function notifyInspectorAssignment(inspectorEmail, inspectorName, food) {
    if (!inspectorEmail) return;

    const expires = new Date(food.expires).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
    });

    const body = `
    <p style="margin:0 0 18px;">Dear ${inspectorName},</p>
    <p style="margin:0 0 6px;">You have a new inspection assigned. Here are the details:</p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">
      <tr>
        <td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:5px;padding:18px 20px;">
          <p style="margin:0 0 2px;font-size:11px;font-weight:700;color:#15803d;letter-spacing:1.5px;text-transform:uppercase;">Pickup Location</p>
          <p style="margin:0;font-size:20px;font-weight:800;color:#14532d;">${food.address}</p>
        </td>
      </tr>
    </table>

    ${detailTable([
        ["Food", `<strong>${food.name}</strong>`],
        ["Type", `${food.veg ? pill("VEG", "#16a34a") : pill("NON-VEG", "#dc2626")}&nbsp;&nbsp;${food.nature}`],
        ["Servings", `<strong>${food.servings} meals</strong>`],
        ["Donor", food.donor || "—"],
        ["Contact", food.phone ? `<a href="tel:${food.phone}" style="color:#1a7a3c;font-weight:700;font-size:16px;">${food.phone}</a>` : "—"],
        ["Inspect Before", `<span style="color:#dc2626;font-weight:700;">${expires}</span>`]
    ])}`;

    return await sendMail({
        to: inspectorEmail,
        subject: `Inspection Assignment: ${food.name} at ${food.address} — Expires ${expires}`,
        html: layout({
            headerColor: "#1e40af",
            headerLabel: "Inspector Notification",
            title: "Food Inspection Task Assigned",
            preheader: `You have been assigned to inspect ${food.servings} servings of ${food.name} at ${food.address}.`,
            body,
            ctaText: "Open Inspector Dashboard",
            ctaUrl: `${appUrl}/inspector.html`
        })
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION 3 — NGO: Approved food with >50 servings available
// ═══════════════════════════════════════════════════════════════════════════════
async function notifyNgosBulkFoodAvailable(food, ngoEmails) {
    if (!ngoEmails || ngoEmails.length === 0) return;

    const expires = new Date(food.expires).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
    const urgencyMs = new Date(food.expires) - Date.now();
    const urgencyHrs = Math.max(0, Math.floor(urgencyMs / 3600000));
    const urgencyMins = Math.max(0, Math.floor((urgencyMs % 3600000) / 60000));
    const urgencyColor = urgencyHrs < 2 ? "#dc2626" : urgencyHrs < 6 ? "#d97706" : "#15803d";
    const timeLeft = urgencyHrs > 0 ? `${urgencyHrs} hr ${urgencyMins} min` : `${urgencyMins} minutes`;

    const body = `
    <p style="margin:0 0 18px;">Dear Team,</p>
    <p style="margin:0 0 18px;">A large batch of surplus food has been verified and approved by our food safety inspector. This listing is now available for claim on a <strong>first-come, first-served basis</strong>.</p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
      <tr>
        <td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:5px;padding:20px;text-align:center;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#15803d;letter-spacing:1.5px;text-transform:uppercase;">Approved Listing</p>
          <p style="margin:0 0 8px;font-size:24px;font-weight:800;color:#14532d;">${food.name}</p>
          <p style="margin:0;font-size:40px;font-weight:900;color:#15803d;line-height:1;">${food.servings}</p>
          <p style="margin:4px 0 0;font-size:12px;font-weight:700;color:#6b7280;letter-spacing:1px;text-transform:uppercase;">Meals Available</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:1px;">Food Details</p>
    ${detailTable([
        ["Food Item", `<strong>${food.name}</strong>`],
        ["Type", `${food.veg ? pill("VEG", "#16a34a") : pill("NON-VEG", "#dc2626")}&nbsp;&nbsp;${food.nature}`],
        ["Total Servings", `<strong>${food.servings} meals</strong>`],
        ["Pickup Address", `<strong>${food.address}</strong>`],
        ["Donated By", food.donor || "—"],
        ["Available Until", `<span style="color:${urgencyColor};font-weight:700;">${expires}</span>`],
        ["Time Remaining", `<span style="color:${urgencyColor};font-weight:700;">${timeLeft}</span>`]
    ])}

    ${alertBox(`<strong>FIFO Policy:</strong> This listing is claimed on a first-come, first-served basis. The first organisation to claim it will receive the pickup verification code. Log in immediately to secure this donation for your beneficiaries.`, { bg: "#eff6ff", border: "#3b82f6", color: "#1e3a8a" })}

    <p style="margin:18px 0 0;font-size:13px;color:#6b7280;">If the listing has already been claimed by the time you log in, it will show as unavailable. We encourage you to check the platform regularly for new listings.</p>`;

    return await sendMail({
        to: ngoEmails,
        subject: `Food Available: ${food.servings} servings of ${food.name} at ${food.address} — Claim Now`,
        html: layout({
            headerColor: "#0369a1",
            headerLabel: "Food Availability Alert",
            title: "Large Food Donation Now Available",
            preheader: `${food.servings} servings of ${food.name} at ${food.address} — first come, first served.`,
            body,
            ctaText: "Claim This Donation",
            ctaUrl: `${appUrl}/home.html`
        })
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION 4 — Inspector B: Task transferred from Inspector A
// ═══════════════════════════════════════════════════════════════════════════════
async function notifyInspectorPassedTask(toEmail, toName, fromName, food) {
    if (!toEmail) return;

    const expires = new Date(food.expires).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
    });

    const body = `
    <p style="margin:0 0 18px;">Dear ${toName},</p>
    <p style="margin:0 0 6px;">Inspector <strong>${fromName}</strong> has passed this inspection task to you. Here are the details:</p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">
      <tr>
        <td style="background:#fefce8;border:1px solid #fde68a;border-radius:5px;padding:16px 20px;">
          <p style="margin:0 0 2px;font-size:11px;font-weight:700;color:#92400e;letter-spacing:1.5px;text-transform:uppercase;">Pickup Location</p>
          <p style="margin:0;font-size:20px;font-weight:800;color:#78350f;">${food.address}</p>
        </td>
      </tr>
    </table>

    ${detailTable([
        ["Food", `<strong>${food.name}</strong>`],
        ["Type", `${food.veg ? pill("VEG", "#16a34a") : pill("NON-VEG", "#dc2626")}&nbsp;&nbsp;${food.nature}`],
        ["Servings", `<strong>${food.servings} meals</strong>`],
        ["Donor", food.donor || "—"],
        ["Contact", food.phone ? `<a href="tel:${food.phone}" style="color:#1a7a3c;font-weight:700;font-size:16px;">${food.phone}</a>` : "—"],
        ["Passed By", `<strong>${fromName}</strong>`],
        ["Inspect Before", `<span style="color:#dc2626;font-weight:700;">${expires}</span>`]
    ])}`;

    return await sendMail({
        to: toEmail,
        subject: `Inspection Task Transferred to You by ${fromName}: ${food.name} at ${food.address}`,
        html: layout({
            headerColor: "#b45309",
            headerLabel: "Task Transfer Notice",
            title: "Inspection Task Reassigned to You",
            preheader: `${fromName} has transferred an inspection task to you: ${food.name} at ${food.address}.`,
            body,
            ctaText: "Open Inspector Dashboard",
            ctaUrl: `${appUrl}/inspector.html`
        })
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION 5 — Donor: Their food was accepted / rejected / passed
// ═══════════════════════════════════════════════════════════════════════════════
async function notifyDonorDecision(donorEmail, donorName, food, decision, { inspectorName, reason, passedTo } = {}) {
    if (!donorEmail) return;

    const decidedAt = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
    });

    let headerColor, headerLabel, title, preheader, decisionBlock;

    if (decision === "approved") {
        headerColor = "#15803d";
        headerLabel = "Donation Update";
        title = "Your Food Donation Has Been Approved";
        preheader = `Great news — ${food.name} has passed inspection and is now live for NGOs to claim.`;
        decisionBlock = `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">
          <tr>
            <td style="background:#f0fdf4;border:1px solid #bbf7d0;border-left:4px solid #16a34a;border-radius:0 5px 5px 0;padding:16px 20px;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#15803d;letter-spacing:1px;text-transform:uppercase;">Status: Approved</p>
              <p style="margin:0;font-size:14px;color:#14532d;">Your donation has passed the food safety inspection and is now <strong>live on the platform</strong>. Registered NGOs can now see and claim it.</p>
            </td>
          </tr>
        </table>`;
    } else if (decision === "rejected") {
        headerColor = "#dc2626";
        headerLabel = "Donation Update";
        title = "Your Food Donation Was Not Approved";
        preheader = `Your donation of ${food.name} was reviewed and could not be approved. See details below.`;
        decisionBlock = `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">
          <tr>
            <td style="background:#fef2f2;border:1px solid #fecaca;border-left:4px solid #dc2626;border-radius:0 5px 5px 0;padding:16px 20px;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#dc2626;letter-spacing:1px;text-transform:uppercase;">Status: Rejected</p>
              <p style="margin:0 0 8px;font-size:14px;color:#7f1d1d;">Our inspector reviewed the food and was unable to approve it for distribution.</p>
              ${reason ? `<p style="margin:0;font-size:13px;color:#374151;"><strong>Inspector's Note:</strong> ${reason}</p>` : ""}
            </td>
          </tr>
        </table>`;
    } else {
        // passed
        headerColor = "#b45309";
        headerLabel = "Donation Update";
        title = "Your Food Donation Is Being Re-Reviewed";
        preheader = `Your donation of ${food.name} has been forwarded to another inspector for review.`;
        decisionBlock = `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">
          <tr>
            <td style="background:#fffbeb;border:1px solid #fde68a;border-left:4px solid #f59e0b;border-radius:0 5px 5px 0;padding:16px 20px;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#b45309;letter-spacing:1px;text-transform:uppercase;">Status: Forwarded for Re-Review</p>
              <p style="margin:0;font-size:14px;color:#78350f;">The initial inspector was unable to visit the location. Your donation has been forwarded to <strong>${passedTo || "another inspector"}</strong> for review. No action is needed from your side.</p>
            </td>
          </tr>
        </table>`;
    }

    const body = `
    <p style="margin:0 0 18px;">Dear ${donorName},</p>
    <p style="margin:0 0 18px;">Your food donation listed below has been reviewed by our food safety team. Here is the update:</p>

    ${decisionBlock}

    ${detailTable([
        ["Food Item", `<strong>${food.name}</strong>`],
        ["Type", `${food.veg ? pill("VEG", "#16a34a") : pill("NON-VEG", "#dc2626")}&nbsp;&nbsp;${food.nature}`],
        ["Servings", `<strong>${food.servings} meals</strong>`],
        ["Pickup Address", food.address],
        ["Reviewed By", inspectorName || "Food Safety Inspector"],
        ["Decision Date", decidedAt]
    ])}

    <p style="margin:18px 0 0;font-size:13px;color:#6b7280;">Thank you for contributing to FoodLink. Your effort helps reduce food waste and feed those in need.</p>`;

    return await sendMail({
        to: donorEmail,
        subject: decision === "approved"
            ? `Approved: Your donation of ${food.name} is now live`
            : decision === "rejected"
                ? `Update: Your donation of ${food.name} could not be approved`
                : `Update: Your donation of ${food.name} is being re-reviewed`,
        html: layout({ headerColor, headerLabel, title, preheader, body })
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION 6 — Password Reset Link
// ═══════════════════════════════════════════════════════════════════════════════
async function sendPasswordResetEmail(toEmail, resetUrl) {
    if (!toEmail) return;

    const body = `
    <p style="margin:0 0 18px;">Hello,</p>
    <p style="margin:0 0 18px;">We received a request to reset the password for your FoodLink account associated with this email address. Click the button below to set a new password.</p>

    ${alertBox(`<strong>This link is valid for 15 minutes only.</strong> If you did not request a password reset, you can safely ignore this email — your account has not been changed.`, { bg: "#fef3c7", border: "#d97706", color: "#78350f" })}

    ${detailTable([
        ["Account Email", toEmail],
        ["Link Expires", new Date(Date.now() + 15 * 60 * 1000).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })]
    ])}

    <p style="margin:18px 0 6px;font-size:13px;color:#6b7280;">If the button does not work, copy and paste the link below into your browser:</p>
    <p style="margin:0;font-size:12px;word-break:break-all;color:#1a7a3c;">${resetUrl}</p>`;

    return await sendMail({
        to: toEmail,
        subject: "Password Reset Request — FoodLink",
        html: layout({
            headerColor: "#1a7a3c",
            headerLabel: "Account Security",
            title: "Reset Your Password",
            preheader: "You requested a password reset for your FoodLink account.",
            body,
            ctaText: "Reset My Password",
            ctaUrl: resetUrl
        })
    });
}

module.exports = {
    notifyAdminNewDonation,
    notifyInspectorAssignment,
    notifyNgosBulkFoodAvailable,
    notifyInspectorPassedTask,
    notifyDonorDecision,
    sendPasswordResetEmail
};

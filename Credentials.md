# FoodLink Credentials & Roles

## 1. Predetermined Accounts

### Administrator (Only 1 Admin)
- **Name**: Yajat
- **Email**: `26mx128@psgtech.ac.in`
- **Phone**: `8148085073`
- **Password**: `coswindy`
- **Role**: `admin`
- **Responsibilities**:
  - Receives email alerts when any food donation request is posted.
  - Reviews listings in [Admin Dashboard](http://localhost:3000/admin.html) and allocates each to one of the 2 inspectors.

---

### Food Safety Inspectors (Predetermined 2 Inspectors)

#### Inspector A
- **Name**: Agilesh
- **Email**: `26mx101@psgtech.ac.in`
- **Phone**: `9080632150`
- **Password**: `qwerty`
- **Role**: `inspector`

#### Inspector B
- **Name**: Haresh
- **Email**: `26mx205@psgtech.ac.in`
- **Phone**: `9962940766`
- **Password**: `haresh`
- **Role**: `inspector`

**Inspector Responsibilities**:
- Only sees food listings allocated specifically to them by the Admin.
- Receives email notification with pickup address and donor contact.
- Has 3 actions for each assigned listing:
  1. **Accept**: Approves the food. If servings > 50, all NGOs are automatically notified by email.
  2. **Reject**: Rejects the food with an inspection note.
  3. **Pass to Other Inspector**: Reallocates the task to the other inspector and sends them an email alert.

---

## 2. Public Self-Registration
The registration page ([`login.html`](http://localhost:3000/login.html)) allows public sign-up only for:
- **Food Donors**: Messes, canteens, restaurants, caterers. (Name and phone are automatically saved and reused for all donations).
- **NGOs / Charities**: Verified organizations claiming food on a strict **FIFO (First-In, First-Out)** basis.

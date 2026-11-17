# FoodLink (Node + Express + MongoDB)

Same FoodLink as before, but the data now lives in MongoDB and the pages talk to an Express server.

## How to run

1. Install Node.js and MongoDB (and make sure MongoDB is running on the default port 27017).
2. Open a terminal in this folder and run:

```
npm install
npm start
```

3. Open http://localhost:3000 in the browser.

The first time it runs, the demo accounts and 3 sample food listings are added to the `foodlink` database automatically.

## Demo accounts

| Account | Username | Password | Can see |
|---|---|---|---|
| Donor | donor | donor123 | donor.html |
| NGO | ngo | ngo123 | home.html, reg.html, myreg.html |
| Admin | admin | admin123 | admin.html |
| Inspector | inspector | inspect123 | inspector.html |

abt.html and cntct.html are open to everyone.

Flow: donor adds food (pending) -> inspector tastes and approves -> NGO sees it and claims it -> donor confirms pickup with the 4-digit code. Rejected or pending food is never shown to NGOs.

## Files

| File | What it does |
|---|---|
| server.js | Express server, login (sessions) and all the API routes |
| models/User.js | User collection (username, password, role, name) |
| models/Food.js | Food collection (listing, inspection, claim details) |
| public/ | All the pages, style.css and app.js (they call the API with fetch) |

## Reset the demo data

In the mongo shell: `use foodlink` then `db.dropDatabase()`. Restart the server to get the sample data back.

We are planning to use official college gmail ids for sending email notifications to the ngo

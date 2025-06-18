Of recent I was able to change the frontend storage from Drizzle ORM and postgresql to Local Storage and fetching data from the backend.


18th June - 
- With the help of the Holy Spirit, today, I was able the issue concerning the authentication. I have been working on the outside server [Backend folder] to fix the authentication issue, turns out that server handling the authentication process is the one inside of the Frontend folder. Was finally able to change that server folder (inside of frontend) from using session-based authentication to JWT.

- Also have trouble rendering name of user after login using the backend or credentials from the database, because the demo users make use of the first name and lastname to display the name of users; whilst the backend uses Username or Fullname for storing user credentials. Ended fixing all the authentication problems. For registration, Login and Logout.
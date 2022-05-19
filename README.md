# Clarkson Ignite Makerspace Public Ticket Viewer

This repository hosts code meant to run on GitHub pages. It allows any user, with their unique tracking number, to see the status, que position, and estimated time to print their part.

# How it works

1. Public-facing data is inserted into a spreadsheet that is read-only to anybody not given explicit write access.
2. This will query that sheet to determine how many prints exist, and the order in which they should be printed.
3. The will sort the data based on the print priority.
4. This will spit out data about the print.

## **Consequences**

Anybody with adequate desire and curiosity can see our public-facing data spreadsheet. Fortunately, security is handled by google here, so I'm pretty confident we won't have a problem there. As long as the public-facing data is limited to data that can't feasibly link to a user, there should be no issues.

Files cannot be rendered/shared/displayed. It would be cool to show someone a model of their file so they have a better idea of it, but that's just not possible with giving everybody easy access to everybody else's files.

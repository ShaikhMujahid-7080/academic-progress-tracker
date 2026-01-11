(remember to give the complete code of any file that needs to be edited along with its name & dont give a portion to replace or add in the file)

> Pending
1) give an option to student to store/upload studymaterial/imgs/file upto 10mb in their personal notes section/tab & make it (temporary) automatically delete after 48 hours
2) fix navbar/tab not accessible on smaller screens
3) make the entire app responsive
4) make the dropdown menu of Current Semester and Student Role (from Add new student) more beautiful and animated


> 11/1/26 (2.0)
* **Added**:
  1) add an explicit “Admin Privileges” panel/tab (one place that lists quick admin actions and links like Create User, Manage Notices, Appoint Co-Leader and managing the permissions/privillages of the co-leaders such as which co-leader can create new users, post notices, appoint another/new co-leader, manage password (add, remove or update) of users/students and more)
  2) Allow students to edit their own names in the Student & Semester Management tab.
  3) Make the Degree Completion page to include buttons for common actions (export transcript, mark as graduated, etc), and add more informational stuff
* **Changed**:
* **Fixed**:
  1) fix: disable the ability of co-leaders to manage the pasword of admin 
  2) fix: add an option for the co-leaders to add new students and option to Appoint Co-Leaders (for only those who have Create Users or Appoint Co-Leaders privillage)  
  3) fix: Add Student option/button isnt working for the co-leader (who have that privillage) also make the Create Users privillage default for new co-leaders (who are appointed by admin/co-leaders)
  4) fix: the private notice are visible to all co-leaders (make it visible to only who posted it & Private (Selected users only))
* **Enhanced**:
  1) Enhance Personal Notes with better code snippet support (Copy button in preview, easy Paste/Insert in editor).
  2) enhance & make a premium look or interface of co-leader & even more premium for admin
  3) make the theorycard compact, by displaying only the CA & Mid-Sem names & marks (e.g: CA-1 : 0 (default), CA-2 : 9, etc) as default view, and show edit option on each card (subject) which will display & enable to edit all the options (e.g: type, date, etc) of that card/subject
* **Removed**:


> 11/1/26
* **Added**:
  1) Added "default semester" support: a new admission year and admission type ( DSY or not) are captured when creating a student. The app now computes and shows the student's current semester by default based on the admission year and current date, using academic-year boundaries (academic year like 2024-25, starting in July; each academic year has two semesters).
  2) Degree Completion page: a new "Degree Completion" tab is shown by default to students who have passed 4 academic years since admission (visible when applicable).
* **Changed**:
  1) Hide semesters 1–2 in the semester dropdown for DSY students (so they can't pick invalid semesters), Add a small UI note showing a student's admission year/type next to their name 
  2) instead of making Admission Type as 1st or DSY made it DSY or not (checkbox) and remove (1st Year) from the student profile (who are not DSY)
* **Fixed**:
  1) Preserve selected student across refresh: on load the app restores `selected-student` from localStorage (if the student still exists) so users remain logged in after reload.
  2) Create Notice visibility for Co-Leaders: co-leaders without explicit permission objects are now allowed to create notices by default.
* **Enhanced**:
  1) Admin controls: added the ability to add a password to unprotected students (Admins can now Add, Change, or Remove passwords from student accounts via the Student & Settings panel)
  2) Student authentication UI: replaced browser prompt with a modal window when selecting password-protected students from "Student & Semester Management" (improves UX and accessibility)
  3) Personal Notes: Preview tab now becomes active automatically when there are any saved notes (improves discoverability of the preview feature)
* **Removed**:

> 10/1/26
1) not asking for admin password at "Select Student Profile" screen (for admin user/password protected users)
2) password is encrypted and saved in database of each users
3) fixed: subjects of 6th semester

> 9/9/25
1) create a global notice board (with support for checklist, polls, reminders, todos, etc) 
2) add personal notes/quick notes for each user with the support for markdown, link/URL
3) add the ability to create a password protected or unprotected student/user for admin
4) make the ability to create, send & manage the notice for admin only & the users/students the admin selects/allows
5) provide an option for wether or not the poll should accept multiple answers/selections by a single user/student (and dont ask for confirmation such as submit selecteion, just finilize the selection)
6) display the perticular/multiple answers/selections selected by the users/students for the polls & checklist to everyone
7)  add support for markdown & link/URL to be clickable(open in new tab) if added in any of the notices
8)  remove the browser confirmation popup/notification, instead create a beautiful custome website confirmation popup/notification
9)  just like Allow multiple selections add a toggle option for anonymus poll & checkbox voting/selection
10) make all the sent notices reeditable along with the polls & checkboxes

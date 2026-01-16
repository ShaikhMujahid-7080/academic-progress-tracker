(remember to give the complete code of any file that needs to be edited along with its name & dont give a portion to replace or add in the file)

> Pending
1) add: [PersonalNotes] give an option to student to store/upload studymaterial/imgs/file upto 10mb in their personal notes section/tab & make it (temporary) automatically delete after 48 hours, the current firebase plan (Free) doesnt support file upload/storage, so we'll have to make adjustments for that (store in database or something) 
2) make the entire app responsive
3) add: a small footer to the app that will display the developer name (Shaikh Mujahid) and more info about the app
4) add: Time Table/Schedule 
5) add: [Calendar] just like the PersonalNotes add schedule button above the calender which will display the schedule/timetable (along with an edit option) entered by the admin/co-leader
6) fix: [Header] Make the header even more responsive 

> 16/1/26
* **Added**:
  1) [Calendar] added the status bar card to the Calendar tab. It now displays the last update time and the total number of events, matching the design of the Personal Notes tab
* **Changed**:
* **Fixed**:
  1) [NoticeBoard] removed the date restrictions in the Notice Board. You can now select and input previous/old dates for Assessments, Reminders, and Todos in both the creation form and when editing existing items.
  2) [PersonalNotes] when typing (or toolbar button input) anything in the editor the screen is scrolling to top (when there is already too much text in editor)
* **Enhanced**:
  1) implemented the synchronization between Assessment Notices and Theory Cards.
    * Automatic Updates: Theory Cards now update instantly when an admin modifies an Assessment Notice.
    * Smart Clearing: If an Assessment Notice is deleted, the corresponding date and type fields in the Theory Card are cleared automatically.
    * Data Integrity: Manually entered data and marks are preserved, and only fields set by notices are affected by deletions.
    * Source Tracking: The system now distinguishes between data from notices and manual overrides.
* **Removed**:
  
> 15/1/26
* **Added**:
  1) [PersonalNotes] add a button in toolbar that will insert a horizontal line 
  2) [Calendar] added the real-time Date-Time Card to the Calendar side panel! It features:
   * A live-ticking clock with seconds.
   * A large, prominent display for the time.
   * Current date in dd/mm/yyyy and the full day name.
   * A premium gradient design with smooth animations.
* **Changed**:
* **Fixed**:
  1) [PersonalNotes] whenever you use any of the buttons/tools from the toolbar it scrolls to the top of the page 
  2) [Calendar] the text of date,day & time card and a transparent background for date is overlapping on the navbar
  3) [Calendar] fixed the alignment issue in the Calendar. The Event List card now stretches to perfectly match the bottom of the main Calendar grid, regardless of how many rows the month view has. I also added independent scrolling to the event list to keep the UI clean when you have many items.
  4) [NoticeBoard] the searchbar is overlapping the sticky Global Notice Board navbar
  5) fixed the Academic Year display in the header! It is now dynamic and automatically calculates the correct year based on the current date. Since it's currently Jan 2026, it correctly displays as Academic Year 2025-26. The tracker is now always up-to-date!
* **Enhanced**:
  1) [PersonalNotes] make the toolbar sticky for easy access to the toolbar buttons
  2) [NoticeBoard] make the notices only visible in the semester from which they are posted from
  3) [Calendar] make the events only visible in the semester from which they are posted from
  4) [TheorySubjects] the automatic filling of Theory Subject details from NoticeBoard assessment notices. Now, whenever an assessment notice is posted, the relevant subject cards will automatically populate their Date and Assessment Name fields if they are currently empty. This ensures your academic tracker stays in sync with announcements!
* **Removed**:

> 14/1/26
* **Added**:
* **Changed**:
* **Fixed**:
  1) Fixed Admin Privileges tab: Hero section text ("Manage co-leader permissions...") overlapping main navbar on scroll [AdminPrivilegesTab.jsx]
  2) Fixed Student Management tab: Semester + Role dropdowns breaking through sticky header [StudentManagementTab.jsx]
  3) Fixed Notice Board tab: Secondary sticky navbar (top-0 z-20) hiding main navigation [NoticeBoardTab.jsx]
  4) Fixed Admin Privileges Quick Actions: "Create User", "Manage Notices", "View Students" buttons overlapping navbar [AdminPrivilegesTab.jsx]
* **Enhanced**:
* **Removed**:

> 12/1/26
* **Added**:
  1) (Notice Board) ability to reorder all the (posted) notices (only to co-leader & admin ofcorse)
  2) (Notice Board) option to post Assessment notice for posting [Subject_Name] [Assessment_Name (e.g: CA-1, CA-2, etc)] [Assessment_Type] [Assessment_Date,Time&Day] kinda like table or something
  3) calender/tab to track all the Todos, Reminders and other events
  4) Implemented fixed holidays (Christmas, Republic Day, Gandhi Jayanti, etc.) in CalendarTab.jsx. Use the defined logic to color these dates Red. Clicking them displays the holiday name in the event list. Note: Ensure you navigate to the correct month (e.g., Dec, Jan) to see them.
  5) Personal Notes Spacer: Added a special symbol >>> to create an empty line/gap. Usage: Type >>> on its own line in your notes, and it will render as a visible empty space in the preview. Added this to the Tips section for reference.
  6) Personal Notes - Spacer Icon: Added a Spacer (MoveVertical) icon to the toolbar in Personal Notes. Clicking it instantly inserts the >>> spacer token into your notes.
* **Changed**:
  1) Moved the "Tips for better note-taking" section, Added a "Tips" button in the toolbar to toggle the visibility of the "Tips for better note-taking" section.
  2) Todo (Noticeboard) time-format to 12 hours
  3) updated the Assessment color in the Calendar as requested: New Color: Purple. Visibility: Event dots are now purple. Event details in the side panel use a purple theme (bg-purple-50, text-purple-600). Conflict Resolved: This clearly distinguishes Assessments from the Red Holiday events.
* **Fixed**:
  1) Todo (Noticeboard) headings & list items "#,•" not supporting/working
  2) Personal Notes headings & list items "#,•" not supporting/working
  3) make the new notice (when posted) appear at the top of the noticeboard instead of at the bottom 
  4) [Notice Board] the edit option of Assessment notice is not working 
  5) the assessment or any other event posted for today(for current day) is not reflecting on the calendar
  6) multiple assessments with different date (but in single post) are not reflecting on the calendar
  7) [Calendar] the name of subject (of an assessment notice) isnt visible in the Events list in calendar
  8) [Calendar] make the date/numbers of sunday as red color (signifying holiday)
  9) [Calendar] make the date/numbers of friday as green color (signifying religious day)
  10) [Calendar] make the first day of the week (monday) as default
  11) [Assessment Notice] from the assessment_type remove the options (End Semester,Quiz, Assignment, and other) and add (CA-3, CA-4, Mid-Sem, and End-Sem)
  12) [Calendar] the assessment_type isnt visible in the event list of the calendar
  13) Calendar Assessment Name Optional: You can now create assessment notices without entering an "Assessment Name". In the calendar, it will display as "Subject (Type)" (e.g., "Maths (CA-1)") if the name is omitted. If a name is provided, it displays as "Subject: Name (Type)"
* **Enhanced**:
  1) Todo (Noticeboard) make it display the day (of selected date)
  2) make the navbar horizontally scrollable (when hovered & scrolled) and also make it horizontally draggable (when clicked & dragged kinda like scrolling but with mouse)
  3) [Notice Board] option to add multiple assessments (rows) in the Assessment notice 
  4) Created a new AnimatedDropdown component with smooth transitions and styling.Replaced the "Current Semester" dropdown in Student Management. Replaced the "Role" dropdown in the "Add Student" form.
  5) Calendar - Glow Effects: Holidays/Sundays: Now have a subtle Red Glow around their date. Fridays: Now have a subtle Green Glow around their date. This makes them stand out beautifully without overpowering the UI.
* **Removed**:
  1) Removed fixed height constraints from the Personal Notes editor and preview panes. The editor now automatically grows with content, allowing the main page scrollbar to be used instead of an inner scrollbar.


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

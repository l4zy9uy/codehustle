# CodeHustle Platform - Use Cases & Requirements

## Platform Overview

CodeHustle is an **internal educational platform** for **HUST (Hanoi University of Science and Technology)**. It serves as an Online Judge (OJ) system specifically designed for university coursework, assignments, and practice problems.

## User Roles

### 1. Students (HUST Students)
- Solve programming problems assigned by lecturers
- Participate in course contests/exams
- Submit solutions for automatic grading
- Track progress in enrolled courses
- View submission history and results

### 2. Lecturers (HUST Faculty)
- Create and manage courses
- Create problems for their courses
- Organize contests/exams for courses
- View student submissions and progress
- Create batch temporary accounts based on email

### 3. Platform Admins (OJ Maintainers)
- Operate the online judge infrastructure and worker pools
- Configure default limits, languages, and safety policies for all content
- Monitor queues, incidents, and platform health
- Assign or revoke elevated roles (admin, lecturer, proctor)
- Approve bulk account imports and access requests

## Core Use Cases

### Course Management

#### Lecturer Use Cases:
1. **Create Course**
   - Lecturer creates a new course (e.g., "Introduction to Data Structures")
   - Sets course details: title, lecturer name, term, description
   - Course becomes available for students to enroll/view

2. **Manage Course Problems**
   - Add problems to course
   - Organize problems by topics/weeks
   - Set problem difficulty and tags
   - View student progress on course problems

#### Student Use Cases:
1. **Browse Courses**
   - View available courses
   - See course details (lecturer, term, description)
   - Filter/search courses

2. **View Course Content**
   - Access course problems
   - See problem list with progress indicators
   - Filter problems by difficulty, tags, solved status

### Problem Solving

#### Student Use Cases:
1. **Browse Problems**
   - View all available problems
   - Filter by difficulty, tags, status (solved/unsolved)
   - Search problems by title/tags

2. **Solve Problem**
   - View problem statement (description, input/output, constraints, samples)
   - Write solution code in supported languages (C++, Java, Python)
   - Submit solution for automatic evaluation
   - View submission results (AC, WA, TLE, CE, RTE)
   - See detailed test case results for failed submissions

3. **Track Progress**
   - See solved/unsolved status
   - View submission history per problem
   - Track overall statistics (total solved, by difficulty)

#### Lecturer Use Cases:
1. **Create Problem**
   - Write problem statement (markdown supported)
   - Set difficulty (easy, medium, hard)
   - Add tags/categories
   - Configure test cases (stored as file paths for large data)
   - Set time and memory limits
   - Specify allowed languages

2. **Edit Problem**
   - Update problem statement
   - Modify test cases
   - Adjust difficulty/tags

### Lecturer Settings & Controls

1. **Configure Judge Defaults per Course/Contest**
   - Override default time/memory limits inherited from admin settings
   - Toggle which languages (C++, Java, Python) are allowed for a specific course or contest
   - Choose whether partial scoring or batch scoring is used for an assignment

2. **Manage Submission Policies**
   - Set attempt limits or cooldowns for a homework/contest
   - Enable/disable plagiarism detection signals per course
   - Trigger rejudge for a single problem or entire contest when test data changes

3. **Customize Visibility**
   - Schedule when rankings/scoreboards become visible to students
   - Choose whether clarifications are public or private to the asker
   - Decide if submissions are hidden after contest end for manual review

### Contests

#### Lecturer Use Cases:
1. **Create Contest**
   - Set contest name and description
   - Configure start/end times
   - Set contest format (default: IOI, individual)
   - Specify allowed languages
   - Set eligibility requirements
   - Add problems to contest
   - Set problem points

2. **Manage Contest**
   - View contest overview and rules
   - Post clarifications/announcements
   - Monitor student participation
   - View rankings/scoreboard

#### Student Use Cases:
1. **Browse Contests**
   - View upcoming contests
   - View past contests
   - Search contests

2. **Participate in Contest**
   - Join contest (or virtual join for past contests)
   - View contest problems
   - Submit solutions during contest window
   - View personal submissions
   - View rankings (after contest ends or during contest)

3. **Contest Details**
   - View contest info (duration, format, rules)
   - See contest problems with points
   - View clarifications/announcements
   - Track personal submissions
   - View scoreboard/rankings

### Submissions

#### Student Use Cases:
1. **View Submissions**
   - See all personal submissions
   - Filter by problem, language, status
   - View submission details (code, verdict, test results)
   - See execution time and memory usage

2. **Submission Results**
   - View verdict (AC, WA, TLE, CE, RTE)
   - See compilation errors (if CE)
   - See runtime errors (if RTE)
   - View failed test cases with input/output comparison (if WA)

### Announcements

#### Use Cases:
1. **View Announcements**
   - See latest announcements/news
   - Read full announcement details
   - Sort by newest/oldest
   - Paginate through announcements

2. **Announcement Details**
   - View full content (markdown supported)
   - See author and publication date
   - View images (if any)

## Key Features & Requirements

### Problem Features
- **No Editorials**: Problems do not have editorial solutions
- **No Notes**: No note-taking feature for problems
- **Inline Samples**: Sample inputs/outputs rendered inline (no file downloads)
- **Tags as Categories**: Tags represent problem categories
- **Difficulty Colors**: 
  - Easy = Green
  - Medium = Yellow
  - Hard = Red
- **Solved Badge**: Shows "Solved" badge next to problem title if user solved it
- **Test Cases**: Stored as file paths (not raw text) to handle large data

### Contest Features
- **Format**: Default IOI format, individual (not team-based)
- **No Organizer Info**: Contests don't show organizer information
- **No Tie-breaks**: No tie-breaking rules displayed
- **No Editorials**: Contest problems don't have editorials
- **No Users Solved Count**: Problem list doesn't show how many users solved each problem
- **No Editorial Links**: No links to editorial solutions
- **User Submissions Only**: Submissions tab shows only current user's submissions (not live/public)
- **Rankings**: Scoreboard shown after contest ends or during contest

### Submission Features
- **Automatic Grading**: All submissions are automatically evaluated
- **Detailed Results**: Shows test case results, execution time, memory usage
- **Code Viewing**: Users can view their submitted code
- **Status Tracking**: Real-time status updates (PENDING, RUNNING, etc.)

### Account Management

#### Batch Temporary Accounts
- **Lecturer Feature**: Lecturers can create batch temporary accounts
- **Email Pattern**: Accounts use email pattern `@sis.hust.edu.vn`
- **Account Type**: Temporary accounts (expire after certain period)
- **Permissions**: Same as regular student accounts
- **Management**: Lecturers can create, manage, and delete temporary accounts
- **Linking**: Temporary accounts are linked to specific contests/courses
- **Use Case**: Create temporary student accounts for exams/contests without requiring full student registration

### Platform Administration

#### Admin Use Cases:
1. **Monitor Platform Health**
   - View judge queue depth, worker uptime, and incident status from a dedicated dashboard
   - Track moderation alerts (e.g., plagiarism flags, manual regrade tickets)
   - Review recent admin activity for auditing purposes

2. **Manage Online Judge Settings**
   - Define global default time/memory limits and allowed languages
   - Configure featured problems/courses and announcement highlights
   - Control feature flags (API mocks, maintenance mode) for different environments

3. **Oversee Accounts & Access**
   - Approve lecturer or organization access requests
   - Review bulk account import jobs, download generated credentials, and enforce password reset policies
   - Assign or revoke admin/lecturer roles and track onboarding cohorts waiting for approval

4. **Moderation & Compliance**
   - Triage reports for plagiarism or abusive content
   - Force submission rejudges or disable specific problems/courses when issues are detected
   - Keep a history of resolved incidents for compliance reviews

## Technical Requirements

### Data Storage
- **Test Cases**: Store file paths (`input_path`, `expected_output_path`) instead of raw TEXT fields
- **Large Data**: Handle large test case data externally via file storage

### UI/UX Requirements
- **DMOJ-style Layout**: Announcements follow DMOJ blog post structure
- **Responsive Design**: Works on desktop and mobile
- **Markdown Support**: Problem statements and announcements support markdown
- **Math Rendering**: KaTeX support for mathematical expressions

### Authentication
- **Google OAuth**: Login via Google authentication
- **User Context**: Track logged-in user state
- **Role-based Access**: Different features for students vs lecturers/admins

## Workflows

### Student Workflow
1. Login via Google OAuth
2. Browse courses or problems
3. Select a problem to solve
4. Read problem statement
5. Write solution code
6. Submit solution
7. View results and feedback
8. Iterate if needed

### Lecturer Workflow
1. Login via Google OAuth
2. Create course (if needed)
3. Create problems for course
4. Create contest for course (optional)
5. Add problems to contest
6. Monitor student submissions
7. View contest rankings

### Contest Participation Workflow
1. Student browses contests
2. Joins contest (or virtual join for past contests)
3. Views contest problems
4. Solves problems and submits solutions
5. Views personal submissions
6. Checks rankings (when available)

## Grading & Scoring Details

### Automatic Grading
- **Points Calculation**: Based on total points student gets from test cases passed
- **Partial Credit**: Supported - students get points for each test case they pass
- **Penalty System**: Default 1 minute penalty for each non-AC (non-Accepted) submission
- **Contest Scoring**: Points accumulated from all problems solved correctly

### Course Enrollment
- **Enrollment Model**: Students must enroll in courses to access course content
- **Access Control**: Lecturers can restrict course access to specific students
- **Lecturer Management**: Lecturers can add/remove students from courses

## Additional Features & Workflows

### 1. Batch Temporary Accounts Workflow

**Suggested Implementation:**
- **Creation Method**: UI form where lecturer can:
  - Upload CSV file with email list, OR
  - Paste email list in textarea (one email per line)
  - Select target course/contest to link accounts to
- **Required Information**: 
  - Email address (must match `@sis.hust.edu.vn` pattern)
  - Optional: Student name/ID for display
- **Account Lifespan**: 
  - Fixed duration: Expires automatically after contest/course ends + X days (e.g., 30 days)
  - OR Manual expiration: Lecturer sets expiration date
- **Account Conversion**: 
  - Temporary accounts cannot be converted to permanent accounts
  - Students must register normally if they want permanent access
- **Password Handling**: 
  - Auto-generated secure passwords
  - Passwords emailed to student email addresses
  - Password reset available via email

### 2. Course Enrollment Flow

**Suggested Implementation:**
- **Enrollment Method**: 
  - Self-enroll: Students can click "Enroll" button on course page
  - Lecturer-add: Lecturers can manually add students by email/username
- **Course Visibility**: 
  - Students can see all courses (browse/search)
  - But can only access content (problems, assignments) for enrolled courses
- **Approval Process**: 
  - Auto-approval: Enrollment is immediate
  - OR Lecturer approval: Lecturer must approve enrollment requests
  - Lecturers can remove students from courses

### 3. Contest-Course Relationship

**Suggested Implementation:**
- **Standalone Contests**: 
  - Contests can exist without being linked to a course
  - Standalone contests are open to all students
- **Multi-Course Linking**: 
  - One contest can be linked to multiple courses
  - Students from any linked course can participate
- **Access Control**: 
  - If contest is linked to course(s), only enrolled students can participate
  - Lecturers can also manually add/remove participants

### 4. Lecturer Features

**Suggested Implementation:**
- **Analytics & Statistics**: 
  - Yes, lecturers can view analytics for their courses:
    - Student enrollment numbers
    - Problem solve rates
    - Average scores
    - Submission trends
- **Student Progress Tracking**: 
  - Yes, lecturers can see which students solved which problems
  - View individual student progress per problem
  - See submission history per student
- **Manual Grade Override**: 
  - Yes, lecturers can manually override grades for special cases
  - Add notes/reason for override
  - Override history tracked

### 5. Problem Management

**Suggested Implementation:**
- **Problem Reuse**: 
  - Yes, problems can be reused across multiple courses
  - Same problem can appear in different courses
- **Problem Privacy**: 
  - Problems can be private (only visible in specific course)
  - OR public (visible in all courses and general problem list)
  - Lecturers set visibility when creating problem
- **Submission Visibility**: 
  - Yes, lecturers can see all submissions to their problems
  - Filter by course, student, status
  - View code, execution results, test case details

### 6. Contest Management

**Suggested Implementation:**
- **Real-Time Progress**: 
  - Yes, lecturers can view real-time contest progress:
    - Live submission feed
    - Current rankings
    - Problem solve statistics
- **Contest Modification**: 
  - Can pause/modify contests before they start
  - After start: Can extend end time, add clarifications
  - Cannot remove problems or change points after start
- **Registration Deadlines**: 
  - Optional: Lecturers can set registration deadline
  - Students must register before deadline to participate
  - OR Open registration until contest starts

### 7. Other Features

**Suggested Implementation:**
- **Deadline System**: 
  - Yes, lecturers can set deadlines for assignments/problems
  - Students see deadline countdown
  - Late submissions marked but still accepted
- **Late Submission Policy**: 
  - Lecturers can set late submission penalties:
    - Percentage deduction per day/hour late
    - OR fixed penalty
    - OR no late submissions allowed
- **Plagiarism Detection**: 
  - Basic similarity checking between submissions
  - Flag potential plagiarism cases
  - Lecturers review flagged submissions manually
- **System Limits**: 
  - Reasonable limits to prevent abuse:
    - Max problems per course: 100-200
    - Max contests per course: 20-50
    - Max submissions per problem: 100 per student
    - File size limits for test cases: 10-50MB

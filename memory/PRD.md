# ConstructOS - IIMC Amravati Project Tracker

## Original Problem Statement
Build a progress tracking app for IIMC Amravati construction project (138 items from PDF). User visits every 3-4 days to update progress percentages. Features: hierarchical task tree with auto-rollup, phase-wise tiles, interactive Gantt chart, editable dates, custom risk parameters, Excel/PDF reports.

## Architecture
- **Backend**: FastAPI + MongoDB (motor async)
- **Frontend**: React + Tailwind CSS + Shadcn UI + Recharts
- **Database**: MongoDB (tasks collection with 138 seeded items)

## User Persona
- Construction project manager visiting every 3-4 days
- Updates leaf task progress (0-100%)
- Flags tasks as at-risk with custom notes
- Downloads Excel/PDF reports for stakeholder meetings

## Core Requirements (Static)
1. 138 hierarchical tasks from IIMC PDF (5 levels deep)
2. Only leaf tasks editable; parent progress auto-calculates (duration-weighted)
3. 5 phases: Pre-Construction, Admin/Academic, Auditorium, Residential, External Dev
4. Status: Not Started, In Progress, Completed, Delayed, At Risk
5. Custom risk flags per task with notes
6. Editable start/end dates
7. Interactive Gantt chart with zoom/scroll/today marker
8. Excel + PDF report generation
9. No authentication (open access)

## What's Been Implemented (2026-02-21)
- [x] Full backend with 138 seeded tasks, CRUD endpoints, progress rollup
- [x] Dashboard with overall progress, phase tiles, status chart, risk/delayed lists
- [x] Task tree with expandable hierarchy, inline progress editing, search, phase filter
- [x] Interactive Gantt chart with zoom, phase filter, leaf-only toggle, today marker
- [x] Reports page with Excel/PDF download
- [x] Risk assessment dialog per task
- [x] Date editing dialog per task
- [x] Auto-rollup from leaf → parent → grandparent → root

## Prioritized Backlog
### P0 (Done)
- All 138 tasks seeded with correct hierarchy
- Progress update + rollup
- Gantt chart + Task tree + Dashboard + Reports

### P1 (Next)
- Dependency lines in Gantt chart
- Date range filter for reports (daily/weekly/monthly period filtering)
- Bulk progress update mode (update multiple tasks at once)
- Task notes/comments per visit

### P2 (Future)
- Photo/document attachment per task
- Email notification for delayed tasks
- Historical progress tracking (trend over time)
- Export Gantt as image
- Mobile-optimized quick update view

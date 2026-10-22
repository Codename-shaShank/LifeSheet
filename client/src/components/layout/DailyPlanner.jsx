import { ListChecks, Plus } from 'lucide-react';

/**
 * Daily Planner — UI only for now.
 *
 * FUTURE (Add tasks):
 *  • Task model: { userId, date (YYYY-MM-DD), title, problemId?, done, order } in a `tasks` collection.
 *  • API: GET /api/tasks?date=…, POST /api/tasks, PATCH /api/tasks/:id, DELETE /api/tasks/:id.
 *  • "Add tasks" opens a picker: free-text task, or pick unsolved problems from the current sheet.
 *  • Ticking a problem task marks the problem done too (and vice versa).
 *  • "Plan my week": spread the remaining problems of a module across the next N days.
 */
export default function DailyPlanner() {
  return (
    <aside className="planner" aria-labelledby="planner-title">
      <h2 id="planner-title" className="planner-title">
        Daily Planner
      </h2>
      <div className="planner-empty">
        <span className="planner-icon">
          <ListChecks size={18} />
        </span>
        <p className="planner-empty-title">No tasks for today</p>
        <p className="planner-empty-body">Add your tasks to see your daily plan here</p>
      </div>
      <button type="button" className="planner-add">
        <Plus size={14} /> Add tasks
      </button>
    </aside>
  );
}

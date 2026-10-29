import User from "../models/User.js";
import Complaint from "../models/Complaint.js";

import {
    CATEGORIES,
    OPEN_STATUSES
} from "../constants/complaint.constants.js";

// Auto-assign a new complaint to the active staff member of the
// matching department who currently has the fewest open complaints.
// Returns null when nobody matches (e.g. category "other" or no staff
// created yet) - the complaint then waits for manual admin assignment.
const assignComplaint = async ({ collegeId, category }) => {
    if (!CATEGORIES.includes(category) || category === "other") {
        return null;
    }

    const staff = await User.find({
        collegeId,
        role: "staff",
        department: category,
        isActive: true
    })
        .select("_id")
        .sort({ createdAt: 1 })
        .lean();

    if (staff.length === 0) return null;
    if (staff.length === 1) return staff[0]._id;

    const loads = await Complaint.aggregate([
        {
            $match: {
                collegeId,
                assignedTo: { $in: staff.map((s) => s._id) },
                status: { $in: OPEN_STATUSES }
            }
        },
        { $group: { _id: "$assignedTo", count: { $sum: 1 } } }
    ]);

    const loadMap = new Map(
        loads.map((row) => [String(row._id), row.count])
    );

    let best = staff[0]._id;
    let bestLoad = loadMap.get(String(best)) ?? 0;

    for (const member of staff.slice(1)) {
        const load = loadMap.get(String(member._id)) ?? 0;

        if (load < bestLoad) {
            best = member._id;
            bestLoad = load;
        }
    }

    return best;
};

export { assignComplaint };

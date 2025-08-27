import React from "react";

export default function AssignmentTable({ assignments, onEdit }) {
  const handleChange = (idx, field, value) => {
    const updated = assignments.map((a, i) =>
      i === idx ? { ...a, [field]: value } : a
    );
    onEdit(updated);
  };

  if (!assignments || assignments.length === 0) {
    return (
      <div>
        <h2>Assignments</h2>
        <div>No assignments detected. Try uploading a different file.</div>
      </div>
    );
  }

  return (
    <div>
      <h2>Assignments</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid black" }}>Assignment Name</th>
            <th style={{ border: "1px solid black" }}>Date</th>
            <th style={{ border: "1px solid black" }}>Additional Notes</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((a, idx) => (
            <tr key={idx}>
              <td style={{ border: "1px solid black" }}>
                <input
                  value={a.name}
                  onChange={e => handleChange(idx, "name", e.target.value)}
                  style={{ width: "95%" }}
                />
              </td>
              <td style={{ border: "1px solid black" }}>
                <input
                  type="date"
                  value={a.date}
                  onChange={e => handleChange(idx, "date", e.target.value)}
                  style={{ width: "95%" }}
                />
              </td>
              <td style={{ border: "1px solid black" }}>
                <input
                  value={a.notes || ""}
                  placeholder="Notes"
                  onChange={e => handleChange(idx, "notes", e.target.value)}
                  style={{ width: "95%" }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
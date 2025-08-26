import React from 'react';

function AssignmentTable({ assignments, onAssignmentsChange }) {
  const handleChange = (idx, field, value) => {
    const updated = assignments.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    onAssignmentsChange(updated);
  };

  return (
    <div>
      <h2>Review & Edit Assignments</h2>
      <table border="1" cellPadding="6" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Date</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((a, idx) => (
            <tr key={idx}>
              <td>
                <input
                  value={a.name}
                  onChange={e => handleChange(idx, 'name', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="date"
                  value={a.date}
                  onChange={e => handleChange(idx, 'date', e.target.value)}
                />
              </td>
              <td>
                <input
                  value={a.notes}
                  onChange={e => handleChange(idx, 'notes', e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AssignmentTable;